import fs from "fs";
import path from "path";

export function writeDashboardJson(
  repoPath,
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

  return dashboard;
}
