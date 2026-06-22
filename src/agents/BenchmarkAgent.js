import fs from "fs";
import path from "path";

import { runTests } from "../runtime/commandRunner.js";

export default class BenchmarkAgent {
  constructor(repoPath) {
    this.repoPath = repoPath;
  }

  run(repoAnalysis) {
    const result = runTests(this.repoPath, repoAnalysis);

    const benchmark = {
      generatedAt: new Date().toISOString(),
      repoPath: this.repoPath,
      language: repoAnalysis.language,
      primaryLanguage: repoAnalysis.primaryLanguage,
      projectTypes: repoAnalysis.projectTypes,
      testCommand: repoAnalysis.testCommand,
      passed: result.passed,
      durationMs: result.durationMs,
      outputPreview: result.output.slice(0, 4000)
    };

    fs.writeFileSync(
      path.join(this.repoPath, "qa-benchmark.json"),
      JSON.stringify(benchmark, null, 2)
    );

    return {
      ...benchmark,
      testResult: result
    };
  }
}