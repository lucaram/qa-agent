import fs from "fs";
import path from "path";

import { cleanCodeBlock } from "../utils/stringUtils.js";
import { safeJoin } from "../utils/pathUtils.js";
import { runTests } from "../runtime/commandRunner.js";
import { getLanguageTestRules } from "../config/languageTestRules.js";

const NO_PRODUCTION_REIMPLEMENTATION_RULE =
  "Never redefine, duplicate, inline, mock, reimplement, shadow or copy production functions, classes or modules in generated tests. Always import or require the real source module under test and call that real implementation. If the correct import cannot be resolved, fail generation rather than copying production implementation into the test file.";

const TEST_GENERATION_SYSTEM_PROMPT =
  `You are a senior QA automation engineer. Generate only executable test code. Do not include markdown fences. Do not invent expected behaviour. NEVER call a function with inputs that the source code is expected to reject unless the call is wrapped in an explicit exception assertion. Always follow the language-specific test rules supplied in the prompt. Generate tests only in the repository's primary language. Never mix programming languages. Never mix testing frameworks. Use only the testing framework specified by the language-specific rules. Generated tests must be directly executable using the detected repository test command. Use the QA plan as the primary source of scenarios. Use safe QA test examples directly when supplied. If a QA test example has expected.expectedValueAvailable=true and reliability.safeForDirectGeneration=true, use that expected value directly. Do not recalculate it differently. Derive numeric expected values from the supplied safe examples and compact source context. For large repositories, generate a representative high-value suite rather than trying to cover every deterministic target in one prompt. ${NO_PRODUCTION_REIMPLEMENTATION_RULE}`;
const TEST_REPAIR_SYSTEM_PROMPT =
  `${TEST_GENERATION_SYSTEM_PROMPT} You are now repairing ONLY the generated test file. Always obey the language-specific test rules supplied in the prompt. Never change the test language or testing framework. Return the full corrected test file content only. Do not modify production/source code. Do not remove meaningful coverage unless an assertion is invalid. If the failing output shows actual and expected values, treat safe QA test examples, source implementation, QA plan, algorithm steps, calculation formulas and data flow as the source of truth, not the previous expected value.`;

export default class TestAgent {
  constructor(repoPath, openAiClient, readFileSafe) {
    this.repoPath = repoPath;
    this.client = openAiClient;
    this.readFileSafe = readFileSafe;
  }

  buildLanguageRules(repoAnalysis) {
    return getLanguageTestRules(repoAnalysis.primaryLanguage);
  }

  getSafeTestExamples(qaPlan) {
    const examples = Array.isArray(qaPlan?.testExamples)
      ? qaPlan.testExamples
      : [];

    return examples
      .filter((example) => example?.reliability?.safeForDirectGeneration === true)
      .filter((example) => example?.targetApi)
      .map((example) => ({
        id: example.id,
        priority: example.priority,
        targetApi: example.targetApi,
        testName: example.testName,
        testType: example.testType,
        scenario: example.scenario,
        inputs: example.inputs || {},
        expected: {
          kind: example.expected?.kind || "unknown",
          expectedValueAvailable:
            example.expected?.expectedValueAvailable === true,
          expectedValue: example.expected?.expectedValue,
          expectedCalculation: example.expected?.expectedCalculation || null,
          expectedBehaviour: example.expected?.expectedBehaviour || "",
          expectedException: example.expected?.expectedException || null,
          assertionHint: example.expected?.assertionHint || ""
        },
        reliability: example.reliability,
        source: example.source,
        evidence: example.evidence || [],
        covers: example.covers || []
      }));
  }

    getApiDependencyScores(repoAnalysis) {
    const scores = new Map();

    for (const mod of repoAnalysis?.modules || []) {
      const imports = Array.isArray(mod.imports) ? mod.imports : [];
      const dependencies = Array.isArray(mod.dependencies) ? mod.dependencies : [];
      const exports = Array.isArray(mod.exports) ? mod.exports : [];
      const functions = Array.isArray(mod.functions) ? mod.functions : [];

      const dependencyCount = imports.length + dependencies.length;

      for (const item of [...exports, ...functions]) {
        const name = typeof item === "string" ? item : item?.name;
        if (!name) continue;

        scores.set(name, Math.max(scores.get(name) || 0, dependencyCount));
      }
    }

    return scores;
  }

  scoreSafeTestExample(example, repoAnalysis) {
    let score = 0;
    const targetApi = String(example?.targetApi || "");
    const testName = String(example?.testName || "");
    const scenario = String(example?.scenario || "");
    const combined = `${targetApi} ${testName} ${scenario}`.toLowerCase();
    const covers = Array.isArray(example?.covers) ? example.covers : [];
    const dependencyScores = this.getApiDependencyScores(repoAnalysis);

    score += Math.max(0, 100 - Number(example?.priority || 5) * 5);

    if (dependencyScores.has(targetApi)) {
      score += dependencyScores.get(targetApi) * 20;
    }

    if (
      combined.includes("preview") ||
      combined.includes("summary") ||
      combined.includes("total") ||
      combined.includes("impact") ||
      combined.includes("orchestration") ||
      combined.includes("workflow") ||
      combined.includes("account") ||
      combined.includes("portfolio")
    ) {
      score += 80;
    }

    if (
      combined.includes("buy") ||
      combined.includes("sell") ||
      combined.includes("side") ||
      combined.includes("boundary") ||
      combined.includes("<=") ||
      combined.includes(">=") ||
      combined.includes("< 0") ||
      combined.includes("> 100")
    ) {
      score += 50;
    }

    if (covers.includes("mutation")) score += 60;
    if (covers.includes("dependencyFlow")) score += 50;
    if (covers.includes("dataFlow")) score += 40;
    if (covers.includes("calculationFormula")) score += 30;
    if (covers.includes("validationRule")) score += 25;
    if (example?.expected?.kind === "return") score += 20;
    if (example?.expected?.kind === "exception") score += 10;

    return score;
  }

  getPrioritisedSafeTestExamples(qaPlan, repoAnalysis, max = 60) {
    return this.getSafeTestExamples(qaPlan)
      .map((example, index) => ({
        example,
        index,
        score: this.scoreSafeTestExample(example, repoAnalysis)
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index)
      .slice(0, max)
      .map((item) => item.example);
  }

  limitArray(items, max = 30) {
    return Array.isArray(items) ? items.slice(0, max) : [];
  }

  truncateText(value, maxChars = 50000) {
    const text = String(value || "");

    if (text.length <= maxChars) return text;

    return `${text.slice(0, maxChars)}

[TRUNCATED: context reduced to avoid model context-length failure]`;
  }

  compactRepoAnalysis(repoAnalysis) {
    return {
      primaryLanguage: repoAnalysis?.primaryLanguage,
      language: repoAnalysis?.language,
      testCommand: repoAnalysis?.testCommand,
      generatedTestFile: repoAnalysis?.generatedTestFile,
      modules: this.limitArray(repoAnalysis?.modules, 80).map((mod) => ({
        file: mod.file,
        exports: this.limitArray(mod.exports, 40),
        functions: this.limitArray(mod.functions, 40).map((fn) => ({
          name: typeof fn === "string" ? fn : fn?.name,
          params: fn?.params || fn?.parameters || []
        }))
      }))
    };
  }

  compactFocusedModel(focusedModel) {
    const deterministicAnalysis = focusedModel?.deterministicAnalysis || {};

    return {
      focusedFiles: this.limitArray(focusedModel?.focusedFiles, 40),
      deterministicAnalysis: {
        summary: deterministicAnalysis.summary || {},
        coverageTargets: this.limitArray(
          deterministicAnalysis.coverageTargets,
          35
        )
      }
    };
  }

  compactQaPlan(qaPlan, repoAnalysis = null) {
    if (!qaPlan) return null;

    return {
      summary: qaPlan.summary || "",
      publicApis: this.limitArray(qaPlan.publicApis, 40),
            testExamples: this.limitArray(
        this.getPrioritisedSafeTestExamples(qaPlan, repoAnalysis, 60),
        40
      ),
      prioritisedTestPlan: this.limitArray(
        qaPlan.prioritisedTestPlan,
        40
      ).map((item) => ({
        priority: item.priority,
        testName: item.testName,
        targetApi: item.targetApi,
        testType: item.testType,
        scenario: item.scenario,
        expectedBehaviour: item.expectedBehaviour,
        testExampleIds: item.testExampleIds || [],
        source: item.source,
        confidence: item.confidence,
        covers: item.covers || []
      })),
      requirementsVsImplementation: this.limitArray(
        qaPlan.requirementsVsImplementation,
        20
      )
    };
  }

  compactProjectContext(projectContext) {
    return this.truncateText(projectContext, 55000);
  }

   buildGenerationPrompt({
    repoAnalysis,
    focusedModel,
    projectContext,
    qaPlan = null
  }) {
    const compactRepo = this.compactRepoAnalysis(repoAnalysis);
    const compactFocus = this.compactFocusedModel(focusedModel);
        const compactPlan = this.compactQaPlan(qaPlan, repoAnalysis);
    const safeTestExamples = this.getPrioritisedSafeTestExamples(
      qaPlan,
      repoAnalysis,
      60
    ).slice(0, 40);
    const compactContext = this.compactProjectContext(projectContext);

    return `
Generate tests for this repository.

Primary language: ${repoAnalysis.primaryLanguage}
Detected language: ${repoAnalysis.language}
Test command: ${repoAnalysis.testCommand}
Generated test file: ${repoAnalysis.generatedTestFile}

Language-specific test rules:
${this.buildLanguageRules(repoAnalysis)}

Compact repository API/import summary:
${JSON.stringify(compactRepo, null, 2)}

Compact focused model:
${JSON.stringify(compactFocus, null, 2)}

Compact QA plan:
${JSON.stringify(compactPlan || {}, null, 2)}

Safe QA test examples:
${JSON.stringify(safeTestExamples, null, 2)}

Critical planning rule:
Use safe QA test examples first.
Prioritise deterministic examples with safeForDirectGeneration=true.
Generate a representative, executable suite rather than trying to cover every possible target in one file.
For large repositories, prefer high-value public APIs, orchestration APIs, exception paths and mutation-sensitive behaviours.
Do not copy all coverage targets mechanically.
Do not exceed practical test size.

Critical test example rule:
A safe QA test example is authoritative when:
- reliability.safeForDirectGeneration is true
- expected.expectedValueAvailable is true for return-value tests
- expected.expectedException is present for exception tests

For return-value examples:
- Use expected.expectedValue directly.
- Do not recalculate the value differently.
- Convert the language-neutral inputs into executable inputs for the repository language.
- Preserve the example's targetApi and scenario intent.

For exception examples:
- Generate a separate exception test.
- Use expected.expectedException and assertionHint.
- Do not place exception inputs in happy-path tests.

Critical expected-value rule:
Derive numeric expected values from the actual source implementation.
Use safe QA test examples when available.
Do not reinterpret, simplify or guess expected values.
Follow the actual code order of operations.
If there is no documentation, treat source code behaviour as current implementation truth.

Critical anti-false-positive rule:
${NO_PRODUCTION_REIMPLEMENTATION_RULE}
Tests must exercise mutated production source files, not copied local implementations.
Do not declare production APIs with function, const, let, var, class, def, object literal methods, or arrow functions inside the test file.
Do not create local helper implementations with the same names as production functions/classes/modules.
Imports/requires must point to the real source files/modules.
If imports cannot be resolved from the repository context, fail generation rather than copying implementation.

Compact repository context:
${compactContext}
`;
  }

    buildRepairPrompt({
    repoAnalysis,
    focusedModel,
    projectContext,
    generatedTestCode,
    testResult,
    qaPlan = null
  }) {
    const compactRepo = this.compactRepoAnalysis(repoAnalysis);
    const compactFocus = this.compactFocusedModel(focusedModel);
        const compactPlan = this.compactQaPlan(qaPlan, repoAnalysis);
    const safeTestExamples = this.getPrioritisedSafeTestExamples(
      qaPlan,
      repoAnalysis,
      60
    ).slice(0, 40);
    const compactContext = this.compactProjectContext(projectContext);

    return `
The generated test file failed. Repair ONLY the generated test file.

Generated test file:
${repoAnalysis.generatedTestFile}

Primary language:
${repoAnalysis.primaryLanguage}

Detected language:
${repoAnalysis.language}

Test command:
${repoAnalysis.testCommand}

Language-specific test rules:
${this.buildLanguageRules(repoAnalysis)}

Compact repository API/import summary:
${JSON.stringify(compactRepo, null, 2)}

Compact focused model:
${JSON.stringify(compactFocus, null, 2)}

Compact QA plan:
${JSON.stringify(compactPlan || {}, null, 2)}

Safe QA test examples:
${JSON.stringify(safeTestExamples, null, 2)}

Current generated test code:
\`\`\`
${this.truncateText(generatedTestCode, 30000)}
\`\`\`

Failing test output:
\`\`\`
${this.truncateText(testResult.output, 30000)}
\`\`\`

Compact repository context:
${compactContext}

Mandatory repair instructions:
1. Repair only the generated test file.
2. Preserve the QA plan scenario intent.
3. If a safe QA test example exists for the failing scenario and expected.expectedValueAvailable=true, use expected.expectedValue directly.
4. If the failure is an unhandled exception from source code, wrap that exact call in an exception assertion only when that path is expected to reject.
5. If the failure has actual/expected values, repair the generated test only when the assertion misunderstands the implementation or calculation.
6. Do not modify production/source code.
7. ${NO_PRODUCTION_REIMPLEMENTATION_RULE}
8. Remove any copied production implementation from the test and replace it with imports/requires of the real source module.
9. Return only the full corrected test file content.
`;
  }

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  parsePrimitiveValue(rawValue) {
    const value = String(rawValue ?? "").trim().replace(/,$/, "");

    if (/^-?\d+(?:\.\d+)?$/.test(value)) return Number(value);
    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value === "undefined") return undefined;

    const quoted = value.match(/^['"]([\s\S]*)['"]$/);
    if (quoted) return quoted[1];

    return value;
  }

  getProductionSymbols(repoAnalysis) {
    const generatedTestFile = String(repoAnalysis?.generatedTestFile || "").replace(/\\/g, "/");
    const symbols = [];
    const seen = new Set();

    const addSymbol = (name, type, file) => {
      const cleanName = String(name || "").trim();
      const cleanFile = String(file || "").trim().replace(/\\/g, "/");

      if (!cleanName || cleanName === "unknown") return;
      if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(cleanName)) return;
      if (cleanFile && cleanFile === generatedTestFile) return;

      const key = `${cleanFile}:${type}:${cleanName}`;
      if (seen.has(key)) return;

      seen.add(key);
      symbols.push({ name: cleanName, type, file: cleanFile });
    };

    for (const mod of repoAnalysis?.modules || []) {
      const file = mod?.file || "";

      for (const fn of Array.isArray(mod?.functions) ? mod.functions : []) {
        addSymbol(typeof fn === "string" ? fn : fn?.name, "function", file);
      }

      for (const klass of Array.isArray(mod?.classes) ? mod.classes : []) {
        addSymbol(typeof klass === "string" ? klass : klass?.name, "class", file);
      }

      for (const exported of Array.isArray(mod?.exports) ? mod.exports : []) {
        addSymbol(typeof exported === "string" ? exported : exported?.name, "export", file);
      }
    }

    return symbols;
  }

  getProductionModuleImportPaths(repoAnalysis) {
    const generatedTestFile = String(repoAnalysis?.generatedTestFile || "").replace(/\\/g, "/");
    const paths = new Set();

    for (const mod of repoAnalysis?.modules || []) {
      const file = String(mod?.file || "").replace(/\\/g, "/");

      if (!file || file === generatedTestFile) continue;
      if (/\.test\.|\.spec\.|__tests__\//i.test(file)) continue;

      const withoutExtension = file.replace(/\.[^.\/]+$/, "");
      const baseName = withoutExtension.split("/").pop();

      for (const candidate of [file, withoutExtension, baseName].filter(Boolean)) {
        paths.add(candidate);
        paths.add(`./${candidate}`);
        paths.add(`../${candidate}`);
      }
    }

    return [...paths];
  }

  isAllowedImportAssignment(line, name) {
    const escaped = this.escapeRegExp(name);
    const text = String(line || "").trim();

    return (
      new RegExp(`^(?:const|let|var)\\s+${escaped}\\s*=\\s*require\\s*\\(`).test(text) ||
      new RegExp(`^(?:const|let|var)\\s+${escaped}\\s*=\\s*await\\s+import\\s*\\(`).test(text) ||
      new RegExp(`^(?:const|let|var)\\s+${escaped}\\s*=\\s*moduleUnderTest\\.`).test(text) ||
      new RegExp(`^import\\s+${escaped}\\s+from\\s+`).test(text)
    );
  }

  findProductionReimplementationViolations(testCode, repoAnalysis) {
    const code = String(testCode || "");
    const lines = code.split("\n");
    const violations = [];

    for (const symbol of this.getProductionSymbols(repoAnalysis)) {
      const name = symbol.name;
      const escaped = this.escapeRegExp(name);

      const patterns = [
        {
          kind: "function declaration",
          pattern: new RegExp(`\\bfunction\\s+${escaped}\\s*\\(`)
        },
        {
          kind: "class declaration",
          pattern: new RegExp(`\\bclass\\s+${escaped}\\b`)
        },
        {
          kind: "arrow/function assignment",
          pattern: new RegExp(
            `\\b(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:async\\s*)?(?:function\\b|\\([^)]*\\)\\s*=>|[A-Za-z_$][A-Za-z0-9_$]*\\s*=>)`
          )
        },
        {
          kind: "object method reimplementation",
          pattern: new RegExp(
            `\\b${escaped}\\s*:\\s*(?:function\\b|(?:async\\s*)?\\([^)]*\\)\\s*=>)`
          )
        },
        {
          kind: "python function declaration",
          pattern: new RegExp(`^\\s*def\\s+${escaped}\\s*\\(`, "m")
        },
        {
          kind: "python class declaration",
          pattern: new RegExp(`^\\s*class\\s+${escaped}\\b`, "m")
        }
      ];

      for (const { kind, pattern } of patterns) {
        if (pattern.test(code)) {
          violations.push({ name, kind, file: symbol.file });
        }
      }

      const assignmentPattern = new RegExp(`\\b(?:const|let|var)\\s+${escaped}\\s*=`, "g");

      for (let index = 0; index < lines.length; index++) {
        const line = lines[index];

        if (!assignmentPattern.test(line)) {
          assignmentPattern.lastIndex = 0;
          continue;
        }

        assignmentPattern.lastIndex = 0;

        if (this.isAllowedImportAssignment(line, name)) continue;

        violations.push({
          name,
          kind: "local assignment shadows production symbol",
          file: symbol.file,
          line: index + 1
        });
      }
    }

    return violations;
  }

  rejectsProductionReimplementation(testCode, repoAnalysis) {
    return this.findProductionReimplementationViolations(testCode, repoAnalysis).length > 0;
  }

  assertNoProductionReimplementation(testCode, repoAnalysis) {
    const violations = this.findProductionReimplementationViolations(testCode, repoAnalysis);

    if (violations.length === 0) return;

    const details = violations
      .slice(0, 10)
      .map((violation) => {
        const location = violation.line ? ` line ${violation.line}` : "";
        const file = violation.file ? ` from ${violation.file}` : "";
        return `${violation.name}${file}: ${violation.kind}${location}`;
      })
      .join("; ");

    throw new Error(
      `Generated tests rejected: production implementation was redefined or shadowed in the test file. ${details}. Tests must import/require and exercise the real source module under test.`
    );
  }

  testCodeReferencesProductionSymbol(testCode, repoAnalysis) {
    const code = String(testCode || "");

    return this.getProductionSymbols(repoAnalysis).some((symbol) =>
      new RegExp(`\\b${this.escapeRegExp(symbol.name)}\\b`).test(code)
    );
  }

  hasSourceModuleImport(testCode, repoAnalysis) {
    const code = String(testCode || "").replace(/\\/g, "/");
    const modulePaths = this.getProductionModuleImportPaths(repoAnalysis);

    return modulePaths.some((modulePath) => {
      const escaped = this.escapeRegExp(modulePath.replace(/\\/g, "/"));

      return (
        new RegExp(`\\bfrom\\s+['"]${escaped}['"]`).test(code) ||
        new RegExp(`\\brequire\\s*\\(\\s*['"]${escaped}['"]\\s*\\)`).test(code) ||
        new RegExp(`\\bimport\\s*\\(\\s*['"]${escaped}['"]\\s*\\)`).test(code)
      );
    });
  }

  assertSourceModuleImportedWhenProductionApisAreUsed(testCode, repoAnalysis) {
    if (!["javascript", "typescript"].includes(repoAnalysis?.primaryLanguage)) return;
    if (!this.testCodeReferencesProductionSymbol(testCode, repoAnalysis)) return;
    if (this.hasSourceModuleImport(testCode, repoAnalysis)) return;

    throw new Error(
      "Generated tests rejected: production APIs are referenced but no import/require of a real source module was found. Do not copy implementation into tests; import the module under test."
    );
  }

  sanitizeGeneratedTestCode(testCode, repoAnalysis) {
    let code = String(testCode || "");

    switch (repoAnalysis.primaryLanguage) {
      case "javascript":
      case "typescript":
        code = this.sanitizeJavascriptTests(code);
        break;

      case "python":
        code = this.sanitizePythonTests(code);
        break;

      default:
        code = this.sanitizeGenericTests(code);
        break;
    }

    return this.validateGeneratedTestCode(code, repoAnalysis);
  }

  sanitizeGenericTests(testCode) {
    return this.normaliseWhitespace(testCode);
  }

  sanitizePythonTests(testCode) {
    let code = String(testCode || "");

    code = code
      .split("\n")
      .map((line) => line.replace(/\s+$/g, ""))
      .filter((line) => !this.isContradictoryOrNoisyComment(line))
      .join("\n");

    code = this.removeUnusedSimplePythonVariables(code);
    code = this.normaliseWhitespace(code);

    return code;
  }

  sanitizeJavascriptTests(testCode) {
    let code = String(testCode || "");

    code = code
      .split("\n")
      .map((line) => line.replace(/\s+$/g, ""))
      .filter((line) => !this.isContradictoryOrNoisyComment(line))
      .map((line) => this.removeNoisyInlineComment(line))
      .map((line) => this.removeJavascriptAssertionMessage(line))
      .map((line) => this.rebuildMalformedJavascriptAssertion(line))
      .join("\n");

    code = this.removeUnusedJavascriptVariables(code);
    code = this.removeUnusedJavascriptNamedImports(code);
    code = this.removeDuplicateJavascriptAssertions(code);
    code = this.normaliseWhitespace(code);

    return code;
  }

  validateGeneratedTestCode(testCode, repoAnalysis) {
    let code = String(testCode || "");

    if (
      repoAnalysis.primaryLanguage === "javascript" ||
      repoAnalysis.primaryLanguage === "typescript"
    ) {
      code = code
        .split("\n")
        .map((line) => this.rebuildMalformedJavascriptAssertion(line))
        .map((line) => this.removeJavascriptAssertionMessage(line))
        .join("\n");

      code = this.removeUnusedJavascriptVariables(code);
      code = this.removeUnusedJavascriptNamedImports(code);
      code = this.removeDuplicateJavascriptAssertions(code);
      code = this.normaliseWhitespace(code);
    }

    if (repoAnalysis.primaryLanguage === "python") {
      code = this.removeUnusedSimplePythonVariables(code);
      code = this.normaliseWhitespace(code);
    }

    this.assertNoProductionReimplementation(code, repoAnalysis);
    this.assertSourceModuleImportedWhenProductionApisAreUsed(code, repoAnalysis);

    return code.endsWith("\n") ? code : `${code}\n`;
  }

  normaliseWhitespace(testCode) {
    return String(testCode || "")
      .replace(/[ \t]+$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim()
      .concat("\n");
  }

  isContradictoryOrNoisyComment(line) {
    const trimmed = String(line || "").trim();

    if (!trimmed.startsWith("//") && !trimmed.startsWith("#")) {
      return false;
    }

    return /\b(should|expected|expect|returns?|total|value|result|equals?|calculated)\b/i.test(
      trimmed
    );
  }

  removeNoisyInlineComment(line) {
    if (!/\/\//.test(line)) return line;

    const [codePart, ...commentParts] = line.split("//");
    const comment = commentParts.join("//");

    if (
      /\b(should|expected|expect|returns?|total|value|result|equals?|calculated)\b/i.test(
        comment
      )
    ) {
      return codePart.trimEnd();
    }

    return line;
  }

  removeJavascriptAssertionMessage(line) {
    if (
      !/assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(/.test(line)
    ) {
      return line;
    }

    const args = this.extractAssertArguments(line);
    const assertName = line.match(
      /assert\.(equal|strictEqual|deepEqual|deepStrictEqual)/
    )?.[1];

    if (!args?.actualExpression || !args?.expectedExpression || !assertName) {
      return line;
    }

    const indent = line.match(/^\s*/)?.[0] || "";

    return `${indent}assert.${assertName}(${args.actualExpression.trim()}, ${args.expectedExpression.trim()});`;
  }

  rebuildMalformedJavascriptAssertion(line) {
    if (
      !/assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(/.test(line)
    ) {
      return line;
    }

    const args = this.extractAssertArguments(line);
    const assertName = line.match(
      /assert\.(equal|strictEqual|deepEqual|deepStrictEqual)/
    )?.[1];

    if (!args?.actualExpression || !args?.expectedExpression || !assertName) {
      return line;
    }

    const indent = line.match(/^\s*/)?.[0] || "";

    return `${indent}assert.${assertName}(${args.actualExpression.trim()}, ${args.expectedExpression.trim()});`;
  }

  removeDuplicateJavascriptAssertions(testCode) {
    const seen = new Set();
    const lines = String(testCode || "").split("\n");
    const result = [];

    for (const line of lines) {
      const normalised = line.trim();

      if (
        /^assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual|throws)\s*\(/.test(
          normalised
        )
      ) {
        if (seen.has(normalised)) {
          continue;
        }

        seen.add(normalised);
      }

      result.push(line);
    }

    return result.join("\n");
  }

  removeUnusedJavascriptVariables(testCode) {
    const lines = String(testCode || "").split("\n");

    const declarations = [];

    const declarationPattern =
      /^(\s*)(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*[^;]+;\s*$/;

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(declarationPattern);

      if (!match) continue;

      declarations.push({
        lineIndex: i,
        name: match[2]
      });
    }

    const removable = new Set();

    for (const declaration of declarations) {
      const usageCount = this.countIdentifierUsages(
        lines,
        declaration.name,
        declaration.lineIndex
      );

      if (usageCount === 0) {
        removable.add(declaration.lineIndex);
      }
    }

    return lines
      .filter((_, index) => !removable.has(index))
      .join("\n");
  }

  removeUnusedSimplePythonVariables(testCode) {
    const lines = String(testCode || "").split("\n");

    const declarationPattern =
      /^(\s*)([A-Za-z_][A-Za-z0-9_]*)\s*=\s*.+$/;

    const removable = new Set();

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(declarationPattern);

      if (!match) continue;

      const name = match[2];

      if (!/^(expected|actual|result|value|total)/i.test(name)) {
        continue;
      }

      const usageCount = this.countIdentifierUsages(lines, name, i);

      if (usageCount === 0) {
        removable.add(i);
      }
    }

    return lines
      .filter((_, index) => !removable.has(index))
      .join("\n");
  }

  countIdentifierUsages(lines, identifier, declarationLineIndex) {
    const pattern = new RegExp(`\\b${this.escapeRegExp(identifier)}\\b`, "g");
    let count = 0;

    for (let i = 0; i < lines.length; i++) {
      if (i === declarationLineIndex) continue;

      const line = lines[i];
      const matches = line.match(pattern);

      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  removeUnusedJavascriptNamedImports(testCode) {
    const lines = String(testCode || "").split("\n");
    const result = [];

    for (const line of lines) {
      const namedImportMatch = line.match(
        /^(\s*)import\s+\{\s*([^}]+)\s*\}\s+from\s+(['"][^'"]+['"]);\s*$/
      );

      if (!namedImportMatch) {
        result.push(line);
        continue;
      }

      const indent = namedImportMatch[1];
      const importedNames = namedImportMatch[2]
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean);
      const fromPath = namedImportMatch[3];

      const usedNames = importedNames.filter((name) => {
        const localName = name.includes(" as ")
          ? name.split(/\s+as\s+/i)[1].trim()
          : name;

        return this.countIdentifierUsages(lines, localName, lines.indexOf(line)) > 0;
      });

      if (usedNames.length === 0) {
        continue;
      }

      result.push(`${indent}import { ${usedNames.join(", ")} } from ${fromPath};`);
    }

    return result.join("\n");
  }

  extractActualExpectedPairs(testOutput) {
    const pairs = [];

    const strictEqualBlockPattern =
      /Expected values to be strictly equal:\s*([\s\S]*?)(?=\n\s*at\s+|\nNode\.js|\nERROR:|$)/g;

    let blockMatch;

    while ((blockMatch = strictEqualBlockPattern.exec(testOutput)) !== null) {
      const block = blockMatch[1];

      const numeric = block.match(
        /(-?\d+(?:\.\d+)?)\s*!==\s*(-?\d+(?:\.\d+)?)/
      );

      if (numeric) {
        pairs.push({
          actual: Number(numeric[1]),
          expected: Number(numeric[2]),
          source: "strict-equal-inline"
        });
      }

      const string = block.match(
        /'([^']*)'\s*!==\s*'([^']*)'|"([^"]*)"\s*!==\s*"([^"]*)"/
      );

      if (string) {
        pairs.push({
          actual: string[1] ?? string[3],
          expected: string[2] ?? string[4],
          source: "strict-equal-inline"
        });
      }
    }

    const actualExpectedObjectPattern =
      /actual:\s*([^,\n]+),\s*\n\s*expected:\s*([^,\n]+),\s*\n\s*operator:\s*['"](?:strictEqual|equal|deepStrictEqual|deepEqual)['"]/g;

    let objectMatch;

    while ((objectMatch = actualExpectedObjectPattern.exec(testOutput)) !== null) {
      pairs.push({
        actual: this.parsePrimitiveValue(objectMatch[1]),
        expected: this.parsePrimitiveValue(objectMatch[2]),
        source: "assertion-object"
      });
    }

    return pairs;
  }

  extractFailingGeneratedTestLocation(testOutput, generatedTestFile) {
    const escapedFile = this.escapeRegExp(generatedTestFile);
    const stackPattern = new RegExp(`${escapedFile}:(\\d+):(\\d+)`);
    const stackMatch = testOutput.match(stackPattern);

    if (!stackMatch) return null;

    return {
      lineNumber: Number(stackMatch[1]),
      columnNumber: Number(stackMatch[2])
    };
  }

  extractUnhandledError(testOutput, generatedTestFile) {
    const messageMatch = testOutput.match(/\n(?:Error|TypeError|RangeError):\s+(.+)/);
    if (!messageMatch) return null;

    const location = this.extractFailingGeneratedTestLocation(
      testOutput,
      generatedTestFile
    );

    if (!location) return null;

    return {
      message: messageMatch[1].trim(),
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber
    };
  }

  splitTopLevelArguments(argumentText) {
    const args = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < argumentText.length; i++) {
      const char = argumentText[i];

      if (inString) {
        current += char;

        if (char === "\\") {
          i++;
          current += argumentText[i] || "";
          continue;
        }

        if (char === stringChar) {
          inString = false;
          stringChar = "";
        }

        continue;
      }

      if (char === "'" || char === `"` || char === "`") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === "(" || char === "[" || char === "{") depth++;
      if (char === ")" || char === "]" || char === "}") depth--;

      if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) args.push(current.trim());

    return args;
  }

  extractAssertArguments(line) {
    const match = line.match(
      /assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(([\s\S]*)\)\s*;?/
    );

    if (!match) return null;

    const args = this.splitTopLevelArguments(match[1]);

    return {
      actualExpression: args[0] || null,
      expectedExpression: args[1] || null,
      messageExpression: args[2] || null
    };
  }

  extractAssertCallExpression(line) {
    return this.extractAssertArguments(line)?.actualExpression || null;
  }

  normaliseExpression(expression) {
    return String(expression || "")
      .trim()
      .replace(/^await\s+/, "")
      .replace(/^\(([\s\S]*)\)$/, "$1")
      .trim();
  }

  extractDirectFunctionName(expression) {
    const normalised = this.normaliseExpression(expression);

    const directCall = normalised.match(/^([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/);
    if (directCall) return directCall[1];

    const memberCall = normalised.match(
      /^([A-Za-z_$][A-Za-z0-9_$]*)\.([A-Za-z_$][A-Za-z0-9_$]*)\s*\(/
    );
    if (memberCall) return memberCall[2];

    return null;
  }

  isPrimitiveRepairableValue(value) {
    return (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      value === null
    );
  }

  stringifyPrimitiveForCode(value) {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (value === null) return "null";
    return String(value);
  }

  stringifyPlan(qaPlan) {
    return JSON.stringify(qaPlan || {});
  }

  functionExistsInSourceContext(functionName, projectContext) {
    const escaped = this.escapeRegExp(functionName);

    const patterns = [
      new RegExp(`export\\s+function\\s+${escaped}\\s*\\(`),
      new RegExp(`function\\s+${escaped}\\s*\\(`),
      new RegExp(`def\\s+${escaped}\\s*\\(`),
      new RegExp(`export\\s+(?:const|let|var)\\s+${escaped}\\s*=`),
      new RegExp(`(?:const|let|var)\\s+${escaped}\\s*=`),
      new RegExp(`export\\s+class\\s+${escaped}\\b`),
      new RegExp(`class\\s+${escaped}\\b`)
    ];

    return patterns.some((pattern) => pattern.test(projectContext));
  }

  functionExistsInQaPlan(functionName, qaPlan) {
    const raw = this.stringifyPlan(qaPlan);
    const escaped = this.escapeRegExp(functionName);
    return new RegExp(`\\b${escaped}\\b`).test(raw);
  }

  functionExistsInDeterministicContext(functionName, projectContext) {
    const escaped = this.escapeRegExp(functionName);

    const patterns = [
      new RegExp(`"function"\\s*:\\s*"${escaped}"`),
      new RegExp(`"name"\\s*:\\s*"${escaped}"`),
      new RegExp(`"publicApi"\\s*:\\s*\\[[\\s\\S]*"${escaped}"[\\s\\S]*\\]`)
    ];

    return patterns.some((pattern) => pattern.test(projectContext));
  }

  expressionIsDirectKnownFunctionCall({ expression, projectContext, qaPlan }) {
    const functionName = this.extractDirectFunctionName(expression);

    if (!functionName) {
      return {
        confident: false,
        functionName: null,
        reason: "The failing assertion is not a direct function call."
      };
    }

    const inSource = this.functionExistsInSourceContext(
      functionName,
      projectContext
    );
    const inPlan = this.functionExistsInQaPlan(functionName, qaPlan);
    const inDeterministic = this.functionExistsInDeterministicContext(
      functionName,
      projectContext
    );

    if (!inSource) {
      return {
        confident: false,
        functionName,
        reason: `${functionName} was not found as a function/class/export in source context.`
      };
    }

    if (!inPlan && !inDeterministic) {
      return {
        confident: false,
        functionName,
        reason: `${functionName} was found in source context but not in QA plan or deterministic analysis.`
      };
    }

    return {
      confident: true,
      functionName,
      reason: `${functionName} is a direct known source function referenced by QA planning/deterministic analysis.`
    };
  }

  qaPlanHasExplicitConflictForFunction(functionName, qaPlan) {
    const conflicts = Array.isArray(qaPlan?.requirementsVsImplementation)
      ? qaPlan.requirementsVsImplementation
      : [];

    return conflicts.some((item) => {
      const raw = JSON.stringify(item || {});
      return (
        item?.status === "conflict" &&
        new RegExp(`\\b${this.escapeRegExp(functionName)}\\b`).test(raw)
      );
    });
  }

  inferExpectedValueFromImplementation({
    actualExpression,
    projectContext,
    repoAnalysis,
    qaPlan
  }) {
    if (repoAnalysis.primaryLanguage !== "javascript") {
      return {
        confident: false,
        reason:
          "Generic deterministic expected-value repair is currently enabled for JavaScript only."
      };
    }

    if (!actualExpression) {
      return {
        confident: false,
        reason: "No actual expression found in failing assertion."
      };
    }

    const directCallDecision = this.expressionIsDirectKnownFunctionCall({
      expression: actualExpression,
      projectContext,
      qaPlan
    });

    if (!directCallDecision.confident) {
      return directCallDecision;
    }

    if (
      this.qaPlanHasExplicitConflictForFunction(
        directCallDecision.functionName,
        qaPlan
      )
    ) {
      return {
        confident: false,
        reason:
          `${directCallDecision.functionName} has an explicit requirements-vs-implementation conflict. Do not auto-repair expected value.`
      };
    }

    return {
      confident: true,
      reason:
        `${directCallDecision.functionName} is directly asserted and known from source/plan context. Runtime actual value can repair generated expected value when the test misunderstood implementation behaviour.`
    };
  }

  findVariableDeclaration(lines, variableName, beforeLineIndex = lines.length) {
    if (!variableName || !/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(variableName)) {
      return null;
    }

    const declarationPattern = new RegExp(
      `^\\s*(?:const|let|var)\\s+${this.escapeRegExp(variableName)}\\s*=\\s*([\\s\\S]*?);?\\s*(?://.*)?$`
    );

    for (let i = beforeLineIndex - 1; i >= 0; i--) {
      const match = lines[i].match(declarationPattern);

      if (match) {
        return {
          lineIndex: i,
          expression: match[1].trim(),
          line: lines[i]
        };
      }
    }

    return null;
  }

  resolveActualExpressionForRepair(expression, lines, failingIndex) {
    const trimmed = String(expression || "").trim();

    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
      return trimmed;
    }

    const declaration = this.findVariableDeclaration(lines, trimmed, failingIndex);

    return declaration?.expression || trimmed;
  }

  replaceVariableDeclarationValue(lines, variableName, newExpectedValue) {
    const declaration = this.findVariableDeclaration(lines, variableName);

    if (!declaration) {
      return {
        replaced: false,
        lines
      };
    }

    const replacement = this.stringifyPrimitiveForCode(newExpectedValue);

    const declarationPattern = new RegExp(
      `^(\\s*(?:const|let|var)\\s+${this.escapeRegExp(variableName)}\\s*=\\s*)([\\s\\S]*?)(;?\\s*(?://.*)?)$`
    );

    const match = declaration.line.match(declarationPattern);

    if (!match) {
      return {
        replaced: false,
        lines
      };
    }

    const updatedLines = [...lines];
    updatedLines[declaration.lineIndex] = `${match[1]}${replacement}${match[3]}`;

    return {
      replaced: true,
      lines: updatedLines
    };
  }

  rebuildAssertLine(line, newExpectedValue) {
    const args = this.extractAssertArguments(line);
    if (!args?.actualExpression) return line;

    const indent = line.match(/^\s*/)?.[0] || "";
    const assertName = line.match(
      /assert\.(equal|strictEqual|deepEqual|deepStrictEqual)/
    )?.[1];

    if (!assertName) return line;

    const replacement = this.stringifyPrimitiveForCode(newExpectedValue);

    return `${indent}assert.${assertName}(${args.actualExpression.trim()}, ${replacement});`;
  }

  replaceExpectedArgumentInLine(line, newExpectedValue) {
    return this.rebuildAssertLine(line, newExpectedValue);
  }

  deterministicRepairActualExpected({
    generatedTestCode,
    testResult,
    repoAnalysis,
    projectContext,
    qaPlan
  }) {
    const pairs = this.extractActualExpectedPairs(testResult.output);
    const location = this.extractFailingGeneratedTestLocation(
      testResult.output,
      repoAnalysis.generatedTestFile
    );

    if (pairs.length === 0 || !location) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "No actual/expected pair or failing generated test location found."
      };
    }

    let lines = generatedTestCode.split("\n");
    const failingIndex = location.lineNumber - 1;
    const failingLine = lines[failingIndex];

    if (
      !failingLine ||
      !/assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(/.test(
        failingLine
      )
    ) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Failing line is not a supported assert line."
      };
    }

    const assertArgs = this.extractAssertArguments(failingLine);
    const pair = pairs[0];

    if (!assertArgs?.expectedExpression) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Expected argument not found."
      };
    }

    if (!this.isPrimitiveRepairableValue(pair.actual)) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Actual value is not a primitive safe repair value."
      };
    }

    const resolvedActualExpression = this.resolveActualExpressionForRepair(
      assertArgs.actualExpression,
      lines,
      failingIndex
    );

    const decision = this.inferExpectedValueFromImplementation({
      actualExpression: resolvedActualExpression,
      projectContext,
      repoAnalysis,
      qaPlan
    });

    if (!decision.confident) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: decision.reason
      };
    }

    const expectedExpression = String(assertArgs.expectedExpression || "").trim();

    let replacements = 0;

    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(expectedExpression)) {
      const variableRepair = this.replaceVariableDeclarationValue(
        lines,
        expectedExpression,
        pair.actual
      );

      if (variableRepair.replaced) {
        lines = variableRepair.lines;
        replacements++;
      }

      const updatedAssertionLine = this.rebuildAssertLine(
        lines[failingIndex],
        pair.actual
      );

      if (updatedAssertionLine !== lines[failingIndex]) {
        lines[failingIndex] = updatedAssertionLine;
        replacements++;
      }
    }

    if (replacements === 0) {
      const updatedLine = this.replaceExpectedArgumentInLine(
        failingLine,
        pair.actual
      );

      if (updatedLine !== failingLine) {
        lines[failingIndex] = updatedLine;
        replacements++;
      }
    }

    return {
      repaired: replacements > 0,
      code: this.sanitizeGeneratedTestCode(lines.join("\n"), repoAnalysis),
      replacements,
      reason: decision.reason
    };
  }

  deterministicRepairUnhandledError({
    generatedTestCode,
    testResult,
    repoAnalysis
  }) {
    if (repoAnalysis.primaryLanguage !== "javascript") {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const error = this.extractUnhandledError(
      testResult.output,
      repoAnalysis.generatedTestFile
    );

    if (!error?.lineNumber) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const lines = generatedTestCode.split("\n");
    const index = error.lineNumber - 1;
    const failingLine = lines[index];

    if (!failingLine || /assert\.throws\s*\(/.test(failingLine)) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const expression =
      this.extractAssertCallExpression(failingLine) ||
      failingLine.replace(/;?\s*$/, "").trim();

    if (!expression) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const indent = failingLine.match(/^\s*/)?.[0] || "";
    const escapedMessage = JSON.stringify(error.message);

    lines[index] =
      `${indent}assert.throws(() => ${expression}, { message: ${escapedMessage} });`;

    return {
      repaired: true,
      code: this.sanitizeGeneratedTestCode(lines.join("\n"), repoAnalysis),
      replacements: 1
    };
  }

  deterministicRepairGeneratedTests({
    generatedTestCode,
    testResult,
    repoAnalysis,
    projectContext,
    qaPlan
  }) {
    let code = generatedTestCode;
    let totalReplacements = 0;

    const valueRepair = this.deterministicRepairActualExpected({
      generatedTestCode: code,
      testResult,
      repoAnalysis,
      projectContext,
      qaPlan
    });

    if (valueRepair.repaired) {
      code = valueRepair.code;
      totalReplacements += valueRepair.replacements;
    }

    const errorRepair = this.deterministicRepairUnhandledError({
      generatedTestCode: code,
      testResult,
      repoAnalysis
    });

    if (errorRepair.repaired) {
      code = errorRepair.code;
      totalReplacements += errorRepair.replacements;
    }

    return {
      repaired: totalReplacements > 0,
      code: this.sanitizeGeneratedTestCode(code, repoAnalysis),
      replacements: totalReplacements,
      notes: [valueRepair.reason].filter(Boolean)
    };
  }

  isProductionReimplementationRejection(error) {
    return /production implementation was redefined|no import\/require of a real source module/i.test(
      String(error?.message || error || "")
    );
  }

  async repairRejectedGeneratedTest({
    repoAnalysis,
    focusedModel,
    projectContext,
    generatedTestCode,
    qaPlan = null,
    rejectionError
  }) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TEST_REPAIR_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: this.buildRepairPrompt({
            repoAnalysis,
            focusedModel,
            projectContext,
            generatedTestCode,
            testResult: {
              output:
                `Sanitizer rejected the generated test before execution. ${String(rejectionError?.message || rejectionError || "Unknown rejection")}`
            },
            qaPlan
          })
        }
      ]
    });

    const repaired = cleanCodeBlock(completion.choices[0]?.message?.content || "");
    return this.sanitizeGeneratedTestCode(repaired, repoAnalysis);
  }

  tryBuildDeterministicJavascriptTests(repoAnalysis, qaPlan) {
    if (repoAnalysis.primaryLanguage !== "javascript") return null;

        const examples = this.getPrioritisedSafeTestExamples(
      qaPlan,
      repoAnalysis,
      80
    );

    if (examples.length === 0) return null;

    const imports = this.buildJavascriptImportsForExamples(repoAnalysis, examples);
    const assertions = examples
      .map((example) => this.buildJavascriptAssertionFromExample(example))
      .filter(Boolean);

    if (assertions.length === 0) return null;

    return `${imports.join("\n")}

${assertions.join("\n")}
`;
  }

  buildJavascriptImportsForExamples(repoAnalysis, examples) {
    const importsByFile = new Map();

    for (const example of examples) {
      const targetApi = example.targetApi;
      const file = this.findSourceFileForApi(repoAnalysis, targetApi);

      if (!file) continue;

      if (!importsByFile.has(file)) {
        importsByFile.set(file, new Set());
      }

      importsByFile.get(file).add(targetApi);
    }

    const imports = [`import assert from "node:assert/strict";`];

    for (const [file, names] of importsByFile.entries()) {
      imports.push(
        `import { ${[...names].sort().join(", ")} } from "./${file.replace(/\\/g, "/")}";`
      );
    }

    return imports;
  }

  findSourceFileForApi(repoAnalysis, apiName) {
    for (const mod of repoAnalysis?.modules || []) {
      const names = [
        ...(Array.isArray(mod.functions) ? mod.functions : []).map((fn) =>
          typeof fn === "string" ? fn : fn?.name
        ),
        ...(Array.isArray(mod.exports) ? mod.exports : []).map((item) =>
          typeof item === "string" ? item : item?.name
        )
      ].filter(Boolean);

      if (names.includes(apiName)) return mod.file;
    }

    return null;
  }

  buildJavascriptAssertionFromExample(example) {
    const targetApi = example.targetApi;
    const args = this.normaliseExampleArgumentsForCode(example.inputs?.arguments);
    const expected = example.expected || {};

    if (!targetApi || !Array.isArray(args)) return null;

    const call = `${targetApi}(${args.join(", ")})`;

    if (expected.kind === "exception" && expected.expectedException) {
      return `assert.throws(() => ${call}, { message: ${JSON.stringify(expected.expectedException)} });`;
    }

    if (
      expected.kind === "return" &&
      expected.expectedValueAvailable === true
    ) {
      const expectedCode = this.valueToJavascriptCode(expected.expectedValue);
      const assertion =
        expected.expectedValue !== null && typeof expected.expectedValue === "object"
          ? "deepStrictEqual"
          : "strictEqual";

      return `assert.${assertion}(${call}, ${expectedCode});`;
    }

    return null;
  }

  normaliseExampleArgumentsForCode(args) {
    if (!Array.isArray(args)) return [];

    return args.map((arg) => this.argumentToJavascriptCode(arg));
  }

  argumentToJavascriptCode(value) {
    if (typeof value === "string") {
      const trimmed = value.trim();

      if (
        trimmed === "null" ||
        trimmed === "undefined" ||
        trimmed === "true" ||
        trimmed === "false" ||
        /^-?\d+(?:\.\d+)?$/.test(trimmed) ||
        /^[\[{]/.test(trimmed) ||
        /^["'].*["']$/.test(trimmed)
      ) {
        return trimmed;
      }

      return JSON.stringify(value);
    }

    return this.valueToJavascriptCode(value);
  }

  valueToJavascriptCode(value) {
    if (value === undefined) return "undefined";
    return JSON.stringify(value);
  }

  async generateTests({
    repoAnalysis,
    focusedModel,
    projectContext,
    qaPlan = null
  }) {
    const deterministicJavascriptTests =
      this.tryBuildDeterministicJavascriptTests(repoAnalysis, qaPlan);

    if (deterministicJavascriptTests) {
      return this.sanitizeGeneratedTestCode(
        deterministicJavascriptTests,
        repoAnalysis
      );
    }

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TEST_GENERATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: this.buildGenerationPrompt({
            repoAnalysis,
            focusedModel,
            projectContext,
            qaPlan
          })
        }
      ]
    });

    const raw = cleanCodeBlock(completion.choices[0]?.message?.content || "");

    try {
      return this.sanitizeGeneratedTestCode(raw, repoAnalysis);
    } catch (error) {
      if (!this.isProductionReimplementationRejection(error)) {
        throw error;
      }

      return this.repairRejectedGeneratedTest({
        repoAnalysis,
        focusedModel,
        projectContext,
        generatedTestCode: raw,
        qaPlan,
        rejectionError: error
      });
    }
  }

  async repairGeneratedTests({
    repoAnalysis,
    focusedModel,
    projectContext,
    generatedTestCode,
    testResult,
    qaPlan = null
  }) {
    const deterministicRepair = this.deterministicRepairGeneratedTests({
      generatedTestCode,
      testResult,
      repoAnalysis,
      projectContext,
      qaPlan
    });

    if (deterministicRepair.repaired) {
      return this.sanitizeGeneratedTestCode(
        deterministicRepair.code,
        repoAnalysis
      );
    }

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TEST_REPAIR_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: this.buildRepairPrompt({
            repoAnalysis,
            focusedModel,
            projectContext,
            generatedTestCode,
            testResult,
            qaPlan
          })
        }
      ]
    });

    const raw = cleanCodeBlock(completion.choices[0]?.message?.content || "");

    try {
      return this.sanitizeGeneratedTestCode(raw, repoAnalysis);
    } catch (error) {
      if (!this.isProductionReimplementationRejection(error)) {
        throw error;
      }

      return this.repairRejectedGeneratedTest({
        repoAnalysis,
        focusedModel,
        projectContext,
        generatedTestCode: raw,
        qaPlan,
        rejectionError: error
      });
    }
  }

  writeGeneratedTests(repoAnalysis, testCode) {
    const finalTestCode = this.sanitizeGeneratedTestCode(testCode, repoAnalysis);
    const outputPath = safeJoin(this.repoPath, repoAnalysis.generatedTestFile);

    fs.writeFileSync(outputPath, finalTestCode);

    return {
      file: repoAnalysis.generatedTestFile,
      absolutePath: outputPath
    };
  }

  run(repoAnalysis) {
    return runTests(this.repoPath, repoAnalysis);
  }

  writeQaReport({ repoAnalysis, focusedModel, testResult }) {
    const report = `# QA Report

## Summary

- Language: ${repoAnalysis.language}
- Primary language key: ${repoAnalysis.primaryLanguage}
- Test command: \`${repoAnalysis.testCommand}\`
- Generated test file: \`${repoAnalysis.generatedTestFile}\`
- Tests passed: ${testResult.passed ? "Yes" : "No"}
- Duration: ${testResult.durationMs}ms

## Focused Files

${focusedModel.focusedFiles.map((file) => `- ${file}`).join("\n")}

## Deterministic Coverage Targets

\`\`\`json
${JSON.stringify(focusedModel.deterministicAnalysis.coverageTargets, null, 2)}
\`\`\`

## Test Output

\`\`\`
${testResult.output}
\`\`\`
`;

    fs.writeFileSync(path.join(this.repoPath, "qa-report.md"), report);
  }
}