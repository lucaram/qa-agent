import fs from "fs";
import path from "path";

export function writeRepositoryAnalysis(repoPath, repoAnalysis, focusedModel) {
  const report = `# Repository Analysis

## Language Summary

\`\`\`json
${JSON.stringify(
  {
    primaryLanguage: repoAnalysis.primaryLanguage,
    language: repoAnalysis.language,
    languageCounts: repoAnalysis.languageCounts,
    projectTypes: repoAnalysis.projectTypes,
    testCommand: repoAnalysis.testCommand,
    generatedTestFile: repoAnalysis.generatedTestFile
  },
  null,
  2
)}
\`\`\`

## Deterministic Analysis Summary

\`\`\`json
${JSON.stringify(repoAnalysis.deterministicAnalysis.summary, null, 2)}
\`\`\`

## Focused Context

\`\`\`json
${JSON.stringify(focusedModel, null, 2)}
\`\`\`

## Full Repository Model

\`\`\`json
${JSON.stringify(repoAnalysis, null, 2)}
\`\`\`
`;

  fs.writeFileSync(path.join(repoPath, "repository-analysis.md"), report);
}