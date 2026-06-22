import path from "path";
import { execSync } from "child_process";

import { toPosix } from "../utils/pathUtils.js";
import { isGeneratedArtifact, isTestFile } from "./fileClassifier.js";

export function getGitInfo(repoPath, sourceFiles) {
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd: repoPath,
      encoding: "utf8"
    }).trim();

    const statusOutput = execSync("git status --porcelain", {
      cwd: gitRoot,
      encoding: "utf8"
    });

    const changedRepoRelativeFiles = statusOutput
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => {
        let filePath = line.slice(3).trim();

        if (filePath.includes(" -> ")) {
          filePath = filePath.split(" -> ").pop().trim();
        }

        return toPosix(filePath);
      });

    const changedSourceFiles = [];

    for (const gitRelativeFile of changedRepoRelativeFiles) {
      const absoluteChangedFile = path.join(gitRoot, gitRelativeFile);
      const relativeToTargetRepo = toPosix(path.relative(repoPath, absoluteChangedFile));

      if (
        !relativeToTargetRepo.startsWith("..") &&
        !path.isAbsolute(relativeToTargetRepo) &&
        sourceFiles.includes(relativeToTargetRepo) &&
        !isTestFile(relativeToTargetRepo) &&
        !isGeneratedArtifact(relativeToTargetRepo)
      ) {
        changedSourceFiles.push(relativeToTargetRepo);
      }
    }

    return {
      available: true,
      gitRoot: toPosix(gitRoot),
      changedFiles: changedRepoRelativeFiles,
      changedSourceFiles: [...new Set(changedSourceFiles)].sort()
    };
  } catch {
    return {
      available: false,
      gitRoot: null,
      changedFiles: [],
      changedSourceFiles: []
    };
  }
}