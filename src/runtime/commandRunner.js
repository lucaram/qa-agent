import { execSync } from "child_process";

export function runCommand(command, cwd) {
  const startedAt = Date.now();

  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: "pipe"
    });

    return {
      passed: true,
      command,
      durationMs: Date.now() - startedAt,
      output
    };
  } catch (err) {
    return {
      passed: false,
      command,
      durationMs: Date.now() - startedAt,
      output: `
STDOUT:
${err.stdout || ""}

STDERR:
${err.stderr || ""}

ERROR:
${err.message}
`
    };
  }
}

export function runTests(repoPath, repoAnalysis) {
  return runCommand(repoAnalysis.testCommand, repoPath);
}