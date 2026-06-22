import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import crypto from "crypto";

import RepositoryAgent from "./src/agents/RepositoryAgent.js";
import BenchmarkAgent from "./src/agents/BenchmarkAgent.js";
import MutationAgent from "./src/agents/MutationAgent.js";
import TestAgent from "./src/agents/TestAgent.js";
import FixAgent from "./src/agents/FixAgent.js";

import { safeJoin, toPosix } from "./src/utils/pathUtils.js";
import { writeRepositoryAnalysis } from "./src/reporting/repositoryReportWriter.js";

const client = new OpenAI();

const args = process.argv.slice(2);

const fixMode = args.includes("--fix");
const requestedChangedMode = args.includes("--changed");
const mutationMode = args.includes("--mutation");
const benchmarkMode = args.includes("--benchmark");
const initCiMode = args.includes("--init-ci");
const fullScanMode = args.includes("--all");

const targetArgIndex = args.indexOf("--target");
const targetFile =
  targetArgIndex !== -1 && args[targetArgIndex + 1]
    ? args[targetArgIndex + 1]
    : null;

const repoPathArg = args.find((arg, index) => {
  if (arg.startsWith("--")) return false;
  if (index > 0 && args[index - 1] === "--target") return false;
  return true;
});

const repoPath = path.resolve(repoPathArg || process.cwd());

let activeChangedMode = requestedChangedMode;
let autoChangedMode = false;

if (!fs.existsSync(repoPath)) {
  console.log(`❌ Repository path does not exist: ${repoPath}`);
  process.exit(1);
}

function readFileSafe(relativePath) {
  return fs.readFileSync(safeJoin(repoPath, relativePath), "utf8");
}

function analyseRepository() {
  const repositoryAgent = new RepositoryAgent(repoPath);
  return repositoryAgent.analyseRepository();
}

function findModule(repoAnalysis, file) {
  return repoAnalysis.modules.find((mod) => mod.file === file);
}

function getImportClosure(repoAnalysis, startFiles) {
  const visited = new Set();
  const stack = [...startFiles];

  while (stack.length > 0) {
    const file = stack.pop();

    if (!file || visited.has(file)) continue;

    visited.add(file);

    const mod = findModule(repoAnalysis, file);
    if (!mod) continue;

    for (const imp of mod.imports) {
      if (imp.resolved && !visited.has(imp.resolved)) {
        stack.push(imp.resolved);
      }
    }
  }

  return [...visited].sort();
}

function getCallerClosure(repoAnalysis, startFiles, depth = 2) {
  const callers = new Set();
  let current = new Set(startFiles);

  for (let i = 0; i < depth; i++) {
    const next = new Set();

    for (const file of current) {
      const directCallers = repoAnalysis.reverseDependencies[file] || [];

      for (const caller of directCallers) {
        if (!callers.has(caller)) {
          callers.add(caller);
          next.add(caller);
        }
      }
    }

    current = next;
  }

  return [...callers].sort();
}

function getCallGraphRelatedFiles(repoAnalysis, startFiles) {
  const related = new Set();

  for (const edge of repoAnalysis.callGraph) {
    if (
      startFiles.includes(edge.callerFile) ||
      startFiles.includes(edge.calleeFile)
    ) {
      related.add(edge.callerFile);
      related.add(edge.calleeFile);
    }
  }

  return [...related].sort();
}

function activateAutoChangedModeIfUseful(repoAnalysis) {
  if (
    !fullScanMode &&
    !targetFile &&
    !requestedChangedMode &&
    repoAnalysis.git.available &&
    repoAnalysis.git.changedSourceFiles.length > 0
  ) {
    activeChangedMode = true;
    autoChangedMode = true;
  }
}

function chooseTargetFiles(repoAnalysis) {
  if (targetFile && requestedChangedMode) {
    console.log("❌ Use either --target or --changed, not both.");
    process.exit(1);
  }

  if (targetFile) {
    const normalisedTarget = toPosix(targetFile);

    if (!repoAnalysis.files.source.includes(normalisedTarget)) {
      console.log(`❌ Target file not found in source files: ${normalisedTarget}`);
      process.exit(1);
    }

    return [normalisedTarget];
  }

  if (activeChangedMode) {
    if (!repoAnalysis.git.available) {
      console.log("ℹ️ Git is not available. Falling back to full focused scan.");
      activeChangedMode = false;
    } else if (repoAnalysis.git.changedSourceFiles.length === 0) {
      if (requestedChangedMode) {
        console.log("❌ No changed source files found inside target project.");
        console.log("Run git status to confirm changed files.");
        process.exit(1);
      }

      activeChangedMode = false;
      autoChangedMode = false;
    } else {
      return repoAnalysis.git.changedSourceFiles;
    }
  }

  const topLevelEntryFiles = repoAnalysis.entryPoints
    .filter((entry) => entry.isTopLevel)
    .map((entry) => entry.file);

  if (topLevelEntryFiles.length > 0) {
    return topLevelEntryFiles;
  }

  return repoAnalysis.entryPoints.map((entry) => entry.file);
}

function filterDeterministicAnalysisForFocusedFiles(repoAnalysis, focusedFiles) {
  const focusedSet = new Set(focusedFiles);

  return {
    ...repoAnalysis.deterministicAnalysis,
    files: repoAnalysis.deterministicAnalysis.files.filter((file) =>
      focusedSet.has(file.file)
    ),
    coverageTargets: repoAnalysis.deterministicAnalysis.coverageTargets.filter(
      (target) => focusedSet.has(target.file)
    )
  };
}

function buildFocusedContext(repoAnalysis) {
  activateAutoChangedModeIfUseful(repoAnalysis);

  const targetFiles = chooseTargetFiles(repoAnalysis);
  const dependencyFiles = getImportClosure(repoAnalysis, targetFiles);
  const callerFiles = getCallerClosure(repoAnalysis, targetFiles, 2);

  const callGraphRelatedFiles = getCallGraphRelatedFiles(repoAnalysis, [
    ...targetFiles,
    ...dependencyFiles,
    ...callerFiles
  ]);

  const focusedFiles = [
    ...new Set([
      ...repoAnalysis.files.docs,
      ...targetFiles,
      ...dependencyFiles,
      ...callerFiles,
      ...callGraphRelatedFiles,
      ...repoAnalysis.files.tests.filter(
        (file) => file !== repoAnalysis.generatedTestFile
      )
    ])
  ].filter((file) => fs.existsSync(path.join(repoPath, file)));

  const focusedDeterministicAnalysis =
    filterDeterministicAnalysisForFocusedFiles(repoAnalysis, focusedFiles);

  const focusedModel = {
    mode: activeChangedMode
      ? autoChangedMode
        ? "auto git-changed multi-language focused context with deterministic analysis"
        : "git-changed multi-language focused context with deterministic analysis"
      : repoAnalysis.git.available
        ? "git detected but no changed source files; full multi-language focused context with deterministic analysis"
        : "no git detected; full multi-language focused context with deterministic analysis",
    targetSelection: activeChangedMode
      ? autoChangedMode
        ? "auto git changed files"
        : "git changed files"
      : targetFile
        ? "manual target"
        : "top-level entry points",
    targetFiles,
    dependencyFiles,
    callerFiles,
    callGraphRelatedFiles,
    existingTests: repoAnalysis.files.tests,
    focusedFiles,
    deterministicAnalysis: focusedDeterministicAnalysis
  };

  let context = "";

  context += "\n\n===== REPOSITORY ANALYSIS =====\n";
  context += JSON.stringify(repoAnalysis, null, 2);

  context += "\n\n===== FOCUSED CONTEXT MODEL =====\n";
  context += JSON.stringify(focusedModel, null, 2);

  context += "\n\n===== DETERMINISTIC TEST TARGETS =====\n";
  context += JSON.stringify(focusedDeterministicAnalysis, null, 2);

  for (const file of focusedFiles) {
    context += `\n\n===== ${file} =====\n`;
    context += readFileSafe(file);
  }

  return {
    projectContext: context,
    focusedModel
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDashboardValue(value) {
  if (value === null || value === undefined) return "Not available";
  if (Array.isArray(value)) return value.length === 0 ? "None" : value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";

  return String(value);
}

function writeHtmlDashboard(dashboard) {
  const status = dashboard.testResult
    ? dashboard.testResult.passed
      ? "PASS"
      : "FAIL"
    : "NOT RUN";

  const statusClass =
    status === "PASS" ? "pass" : status === "FAIL" ? "fail" : "neutral";

  const changedSourceFiles = dashboard.git?.changedSourceFiles || [];
  const focusedFiles = dashboard.focusedModel?.focusedFiles || [];
  const targetFiles = dashboard.focusedModel?.targetFiles || [];
  const highComplexity =
    dashboard.deterministicSummary?.highComplexityFunctions || [];

  const mutationScore =
    dashboard.mutationResult?.mutationScore === null ||
    dashboard.mutationResult?.mutationScore === undefined
      ? "Not run"
      : `${dashboard.mutationResult.mutationScore}%`;

  const mutationStatus = dashboard.mutationResult
    ? `${dashboard.mutationResult.killed}/${dashboard.mutationResult.candidatesExecuted} killed`
    : "Not run";

  const testDuration =
    dashboard.testResult?.durationMs !== undefined
      ? `${dashboard.testResult.durationMs} ms`
      : "Not run";

  const listItems = (items) =>
    items.length === 0
      ? `<li class="muted">None</li>`
      : items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const highComplexityRows =
    highComplexity.length === 0
      ? `<tr><td colspan="3" class="muted">None</td></tr>`
      : highComplexity
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.file)}</td>
                <td>${escapeHtml(item.function)}</td>
                <td>${escapeHtml(item.cyclomaticComplexity)}</td>
              </tr>
            `
          )
          .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QA Agent Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: rgba(15, 23, 42, 0.86);
      --border: rgba(148, 163, 184, 0.24);
      --text: #e5e7eb;
      --muted: #94a3b8;
      --pass: #22c55e;
      --fail: #ef4444;
      --neutral: #f59e0b;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 34rem),
        radial-gradient(circle at top right, rgba(167, 139, 250, 0.16), transparent 32rem),
        linear-gradient(135deg, #020617 0%, var(--bg) 48%, #111827 100%);
      color: var(--text);
      padding: 32px;
    }

    .page { max-width: 1180px; margin: 0 auto; }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      letter-spacing: -0.05em;
      line-height: 1;
    }

    p { color: var(--muted); line-height: 1.6; }

    .status-pill {
      padding: 12px 18px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.08em;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      white-space: nowrap;
    }

    .pass {
      color: #dcfce7;
      background: rgba(34, 197, 94, 0.18);
      border-color: rgba(34, 197, 94, 0.38);
    }

    .fail {
      color: #fee2e2;
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.42);
    }

    .neutral {
      color: #fef3c7;
      background: rgba(245, 158, 11, 0.18);
      border-color: rgba(245, 158, 11, 0.42);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .metric-label {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.11em;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      overflow-wrap: anywhere;
    }

    .metric-value.small {
      font-size: 1rem;
      line-height: 1.4;
      letter-spacing: 0;
    }

    .section { margin-top: 16px; }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    ul { margin: 0; padding-left: 20px; line-height: 1.8; }

    .muted { color: var(--muted); }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 16px;
    }

    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    th {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(15, 23, 42, 0.45);
    }

    code {
      color: #bae6fd;
      background: rgba(56, 189, 248, 0.09);
      border: 1px solid rgba(56, 189, 248, 0.16);
      padding: 2px 6px;
      border-radius: 8px;
    }

    @media (max-width: 980px) {
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .hero, .two-col { grid-template-columns: 1fr; flex-direction: column; }
    }

    @media (max-width: 560px) {
      body { padding: 18px; }
      .grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div>
        <h1>QA Agent Dashboard</h1>
        <p>
          Automated quality snapshot generated from repository analysis, Git changed files,
          deterministic branch analysis, generated test execution and optional mutation testing.
        </p>
      </div>
      <div class="status-pill ${statusClass}">${escapeHtml(status)}</div>
    </section>

    <section class="grid">
      <div class="card">
        <div class="metric-label">Language</div>
        <div class="metric-value">${escapeHtml(dashboard.language)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Functions analysed</div>
        <div class="metric-value">${escapeHtml(dashboard.deterministicSummary?.totalFunctions ?? 0)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Coverage targets</div>
        <div class="metric-value">${escapeHtml(dashboard.deterministicSummary?.totalCoverageTargets ?? 0)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Mutation score</div>
        <div class="metric-value">${escapeHtml(mutationScore)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Project type</div>
        <div class="metric-value small">${escapeHtml(formatDashboardValue(dashboard.projectTypes))}</div>
      </div>

      <div class="card">
        <div class="metric-label">Test command</div>
        <div class="metric-value small"><code>${escapeHtml(dashboard.testCommand)}</code></div>
      </div>

      <div class="card">
        <div class="metric-label">Test duration</div>
        <div class="metric-value">${escapeHtml(testDuration)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Mutation status</div>
        <div class="metric-value small">${escapeHtml(mutationStatus)}</div>
      </div>
    </section>

    <section class="two-col section">
      <div class="card">
        <h2>Git changed source files</h2>
        <ul>${listItems(changedSourceFiles)}</ul>
      </div>

      <div class="card">
        <h2>Target files</h2>
        <ul>${listItems(targetFiles)}</ul>
      </div>
    </section>

    <section class="two-col section">
      <div class="card">
        <h2>Focused files</h2>
        <ul>${listItems(focusedFiles)}</ul>
      </div>

      <div class="card">
        <h2>Run metadata</h2>
        <table>
          <tr><th>Field</th><th>Value</th></tr>
          <tr><td>Generated at</td><td>${escapeHtml(dashboard.generatedAt)}</td></tr>
          <tr><td>Repository path</td><td>${escapeHtml(dashboard.repoPath)}</td></tr>
          <tr><td>Primary language key</td><td>${escapeHtml(dashboard.primaryLanguage)}</td></tr>
          <tr><td>Generated test file</td><td>${escapeHtml(dashboard.generatedTestFile)}</td></tr>
          <tr><td>Git detected</td><td>${escapeHtml(formatDashboardValue(dashboard.git?.available))}</td></tr>
          <tr><td>Target selection</td><td>${escapeHtml(dashboard.focusedModel?.targetSelection)}</td></tr>
        </table>
      </div>
    </section>

    <section class="card section">
      <h2>High complexity functions</h2>
      <table>
        <tr>
          <th>File</th>
          <th>Function</th>
          <th>Complexity</th>
        </tr>
        ${highComplexityRows}
      </table>
    </section>
  </main>
</body>
</html>`;

  fs.writeFileSync(path.join(repoPath, "qa-dashboard.html"), html);
}

function writeDashboard(
  repoAnalysis,
  focusedModel,
  testResult = null,
  mutationResult = null
) {
  const dashboard = {
    generatedAt: new Date().toISOString(),
    repoPath,
    language: repoAnalysis.language,
    primaryLanguage: repoAnalysis.primaryLanguage,
    projectTypes: repoAnalysis.projectTypes,
    testCommand: repoAnalysis.testCommand,
    generatedTestFile: repoAnalysis.generatedTestFile,
    git: repoAnalysis.git,
    focusedModel,
    deterministicSummary: repoAnalysis.deterministicAnalysis.summary,
    testResult: testResult
      ? {
          passed: testResult.passed,
          command: testResult.command,
          durationMs: testResult.durationMs
        }
      : null,
    mutationResult
  };

  fs.writeFileSync(
    path.join(repoPath, "qa-dashboard.json"),
    JSON.stringify(dashboard, null, 2)
  );

  writeHtmlDashboard(dashboard);

  return dashboard;
}

function initialiseGitHubActions(repoAnalysis) {
  const workflowDir = path.join(repoPath, ".github", "workflows");

  fs.mkdirSync(workflowDir, {
    recursive: true
  });

  const workflowPath = path.join(workflowDir, "qa-agent.yml");

  const workflow = `name: QA Agent

on:
  pull_request:
  push:
    branches: [ main, master ]

jobs:
  qa-agent:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install agent dependencies
        run: npm install

      - name: Setup Python
        if: contains('${repoAnalysis.primaryLanguage}', 'python')
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      - name: Install Python dependencies
        if: contains('${repoAnalysis.primaryLanguage}', 'python')
        run: |
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest

      - name: Run QA Agent
        run: node agent.js . --changed
`;

  fs.writeFileSync(workflowPath, workflow);
  console.log("✅ GitHub Actions workflow created: .github/workflows/qa-agent.yml");
}

function printRepositorySummary(repoAnalysis, focusedModel) {
  console.log("\nRepository summary:");
  console.log(`Detected language: ${repoAnalysis.language}`);
  console.log(`Primary language key: ${repoAnalysis.primaryLanguage}`);
  console.log(`Project type: ${repoAnalysis.projectTypes.join(", ")}`);
  console.log(`Test command: ${repoAnalysis.testCommand}`);
  console.log(`Generated test file: ${repoAnalysis.generatedTestFile}`);
  console.log(`Source files: ${repoAnalysis.files.source.length}`);
  console.log(`Existing test files: ${repoAnalysis.files.tests.length}`);
  console.log(`Entry points: ${repoAnalysis.entryPoints.length}`);
  console.log(`Call graph edges: ${repoAnalysis.callGraph.length}`);

  console.log("\nDeterministic analysis:");
  console.log(
    `Functions analysed: ${repoAnalysis.deterministicAnalysis.summary.totalFunctions}`
  );
  console.log(
    `Coverage targets: ${repoAnalysis.deterministicAnalysis.summary.totalCoverageTargets}`
  );
  console.log(
    `Existing test intents: ${repoAnalysis.deterministicAnalysis.summary.existingTestIntentCount}`
  );

  console.log("\nLanguage counts:");
  for (const [language, count] of Object.entries(repoAnalysis.languageCounts)) {
    if (count > 0) {
      console.log(`- ${language}: ${count}`);
    }
  }

  console.log("\nGit decision:");
  console.log(`Git detected: ${repoAnalysis.git.available ? "yes" : "no"}`);

  if (repoAnalysis.git.available) {
    console.log(`Git root: ${repoAnalysis.git.gitRoot}`);
    console.log(
      `Changed source files in target project: ${repoAnalysis.git.changedSourceFiles.length}`
    );
  }

  console.log(`Path selected: ${focusedModel.targetSelection}`);

  console.log("\nFocused files:");
  for (const file of focusedModel.focusedFiles) {
    console.log(`- ${file}`);
  }
}

function hashContent(value) {
  return crypto.createHash("sha256").update(value || "").digest("hex");
}

async function runGeneratedTestsWithRepair({
  testAgent,
  repoAnalysis,
  focusedModel,
  projectContext,
  initialTestCode,
  maxRepairAttempts = 50
}) {
  let currentTestCode = initialTestCode;
  let testResult = testAgent.run(repoAnalysis);

  const seenFailureOutputs = new Set();
  const seenTestHashes = new Set([hashContent(currentTestCode)]);

  console.log(testResult.output);

  let repairAttempt = 0;

  while (!testResult.passed && repairAttempt < maxRepairAttempts) {
    const failureHash = hashContent(testResult.output);

    if (seenFailureOutputs.has(failureHash)) {
      console.log("\n🛑 Repair stopped: repeated failure output detected.");
      break;
    }

    seenFailureOutputs.add(failureHash);
    repairAttempt++;

    console.log(
      `\n🧪 Generated tests failed. Repair attempt ${repairAttempt}/${maxRepairAttempts}...`
    );

    const repairedTestCode = await testAgent.repairGeneratedTests({
      repoAnalysis,
      focusedModel,
      projectContext,
      generatedTestCode: currentTestCode,
      testResult
    });

    const repairedHash = hashContent(repairedTestCode);

    if (repairedHash === hashContent(currentTestCode)) {
      console.log("\n🛑 Repair stopped: repair produced no changes.");
      break;
    }

    if (seenTestHashes.has(repairedHash)) {
      console.log("\n🛑 Repair stopped: repeated generated test file detected.");
      break;
    }

    seenTestHashes.add(repairedHash);
    currentTestCode = repairedTestCode;

    testAgent.writeGeneratedTests(repoAnalysis, currentTestCode);

    console.log("✅ Generated test file repaired.");
    console.log("\nRe-running generated tests...");

    testResult = testAgent.run(repoAnalysis);
    console.log(testResult.output);
  }

  if (!testResult.passed && repairAttempt >= maxRepairAttempts) {
    console.log(`\n🛑 Repair stopped: max attempts reached (${maxRepairAttempts}).`);
  }

  return {
    testResult,
    finalTestCode: currentTestCode,
    repairAttempts: repairAttempt
  };
}

async function main() {
  console.log("🔎 Analysing repository...");

  let repoAnalysis = analyseRepository();
  let { projectContext, focusedModel } = buildFocusedContext(repoAnalysis);

  writeRepositoryAnalysis(repoPath, repoAnalysis, focusedModel);
  console.log("✅ repository-analysis.md created.");

  writeDashboard(repoAnalysis, focusedModel);
  console.log("✅ qa-dashboard.json created.");

  printRepositorySummary(repoAnalysis, focusedModel);

  if (initCiMode) {
    initialiseGitHubActions(repoAnalysis);
  }

  console.log("\nGenerating tests...");

  const testAgent = new TestAgent(repoPath, client, readFileSafe);

  const testCode = await testAgent.generateTests({
    repoAnalysis,
    focusedModel,
    projectContext
  });

  const generatedTest = testAgent.writeGeneratedTests(repoAnalysis, testCode);
  console.log(`✅ ${generatedTest.file} created.`);

  console.log("\nRunning tests...");

  const generatedTestRun = await runGeneratedTestsWithRepair({
    testAgent,
    repoAnalysis,
    focusedModel,
    projectContext,
    initialTestCode: testCode,
    maxRepairAttempts: 50
  });

  let testResult = generatedTestRun.testResult;

  let benchmarkResult = null;

  if (benchmarkMode) {
    console.log("\n📊 Running benchmark against generated test suite...");

    const benchmarkAgent = new BenchmarkAgent(repoPath);
    benchmarkResult = benchmarkAgent.run(repoAnalysis);

    console.log("✅ qa-benchmark.json created.");
    console.log(`Tests passed: ${benchmarkResult.passed}`);
    console.log(`Duration: ${benchmarkResult.durationMs}ms`);
  }

  let mutationResult = null;

  if (mutationMode) {
    if (!testResult.passed) {
      console.log("\n🧬 Mutation testing skipped because generated tests failed.");
    } else {
      console.log("\n🧬 Running mutation testing against generated test suite...");

      const mutationAgent = new MutationAgent(repoPath, readFileSafe);
      mutationResult = mutationAgent.run(repoAnalysis, focusedModel);

      console.log("✅ mutation-report.md created.");
      console.log(
        `Mutation score: ${
          mutationResult.mutationScore === null
            ? "N/A"
            : `${mutationResult.mutationScore}%`
        }`
      );
    }
  }

  writeDashboard(
    repoAnalysis,
    focusedModel,
    benchmarkResult?.testResult || testResult,
    mutationResult
  );

  if (testResult.passed) {
    testAgent.writeQaReport({
      repoAnalysis,
      focusedModel,
      testResult
    });

    console.log("✅ All tests passed. No QA defects detected.");
    console.log("✅ qa-report.md updated.");
    process.exit(0);
  }

  console.log("❌ Tests failed.");
  console.log(testResult.output);

  testAgent.writeQaReport({
    repoAnalysis,
    focusedModel,
    testResult
  });

  console.log("\n✅ qa-report.md created.");

  if (!fixMode) {
    console.log("\nℹ️ Fix mode not enabled.");
    console.log("Run this to allow the agent to fix the code:");
    console.log(`node agent.js ${repoPath} --fix`);
    process.exit(1);
  }

  console.log("\n🛠️ Fix mode enabled. Generating source-code fixes...");

  const fixAgent = new FixAgent(repoPath, client, readFileSafe);

  const fixProposal = await fixAgent.proposeFix({
    repoAnalysis,
    focusedModel,
    projectContext,
    testResult
  });

  const appliedFix = fixAgent.applyFix(fixProposal);

  console.log("\nApplied fixes:");
  for (const file of appliedFix.changedFiles) {
    console.log(`- ${file}`);
  }

  console.log(`Backup folder: ${appliedFix.backup.backupRoot}`);

  console.log("\nRe-analysing repository after fix...");

  repoAnalysis = analyseRepository();
  ({ projectContext, focusedModel } = buildFocusedContext(repoAnalysis));

  writeRepositoryAnalysis(repoPath, repoAnalysis, focusedModel);
  console.log("✅ repository-analysis.md updated.");

  console.log("\nRe-running tests...");

  testResult = fixAgent.runTests(repoAnalysis);
  console.log(testResult.output);

  writeDashboard(repoAnalysis, focusedModel, testResult, mutationResult);

  const finalReport = `# QA Auto-Fix Report

## Fix summary

${appliedFix.summary || "No summary provided."}

## Changed files

${
  appliedFix.changedFiles.length > 0
    ? appliedFix.changedFiles.map((file) => `- ${file}`).join("\n")
    : "No files changed."
}

## Backup

${appliedFix.backup.backupRoot}

## Post-fix test result

- Passed: ${testResult.passed ? "Yes" : "No"}
- Command: ${testResult.command}
- Duration: ${testResult.durationMs}ms

## Test output

\`\`\`text
${testResult.output}
\`\`\`
`;

  fs.writeFileSync(path.join(repoPath, "qa-report.md"), finalReport);
  console.log("✅ qa-report.md updated with fix result.");

  if (testResult.passed) {
    console.log("✅ Auto-fix successful. All tests now pass.");
    process.exit(0);
  }

  console.log("❌ Auto-fix attempted, but tests still fail.");
  process.exit(1);
}

main().catch((err) => {
  console.error("❌ QA Agent failed unexpectedly.");
  console.error(err);
  process.exit(1);
});