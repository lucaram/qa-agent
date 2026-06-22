import fs from "fs";

import { cleanCodeBlock } from "../utils/stringUtils.js";
import { createBackup } from "../runtime/backupManager.js";
import { safeJoin } from "../utils/pathUtils.js";
import { runTests } from "../runtime/commandRunner.js";

export default class FixAgent {
  constructor(repoPath, openAiClient, readFileSafe) {
    this.repoPath = repoPath;
    this.client = openAiClient;
    this.readFileSafe = readFileSafe;
  }

  async proposeFix({
    repoAnalysis,
    focusedModel,
    projectContext,
    testResult
  }) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior software engineer. Return only JSON with shape {\"files\":[{\"path\":\"relative/path\",\"content\":\"full updated file content\"}],\"summary\":\"...\"}. Do not include markdown fences."
        },
        {
          role: "user",
          content: `
Tests are failing. Propose the smallest safe fix.

Primary language: ${repoAnalysis.primaryLanguage}
Detected language: ${repoAnalysis.language}
Test command: ${repoAnalysis.testCommand}

Focused model:
${JSON.stringify(focusedModel, null, 2)}

Test output:
${testResult.output}

Repository context:
${projectContext}
`
        }
      ]
    });

    const raw = cleanCodeBlock(completion.choices[0]?.message?.content || "{}");

    try {
      return JSON.parse(raw);
    } catch {
      return {
        files: [],
        summary: "Unable to parse model fix response as JSON."
      };
    }
  }

  applyFix(fixProposal) {
    const files = Array.isArray(fixProposal.files)
      ? fixProposal.files
      : [];

    const changedFiles = files
      .filter((file) => file?.path && typeof file.content === "string")
      .map((file) => file.path);

    const backup = createBackup(this.repoPath, changedFiles);

    for (const file of files) {
      if (!file?.path || typeof file.content !== "string") {
        continue;
      }

      const absolutePath = safeJoin(this.repoPath, file.path);
      fs.writeFileSync(absolutePath, file.content);
    }

    return {
      changedFiles,
      backup,
      summary: fixProposal.summary || ""
    };
  }

  runTests(repoAnalysis) {
    return runTests(this.repoPath, repoAnalysis);
  }
}