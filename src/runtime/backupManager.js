import fs from "fs";
import path from "path";

import { nowStamp, safeJoin, toPosix } from "../utils/pathUtils.js";

export function createBackup(repoPath, files) {
  const backupRoot = path.join(repoPath, ".qa-agent-backups", nowStamp());

  fs.mkdirSync(backupRoot, {
    recursive: true
  });

  const backedUp = [];

  for (const file of files) {
    const absolutePath = safeJoin(repoPath, file);

    if (!fs.existsSync(absolutePath)) {
      continue;
    }

    const backupPath = path.join(backupRoot, file);

    fs.mkdirSync(path.dirname(backupPath), {
      recursive: true
    });

    fs.copyFileSync(absolutePath, backupPath);

    backedUp.push({
      file,
      backupPath: toPosix(path.relative(repoPath, backupPath))
    });
  }

  return {
    backupRoot: toPosix(path.relative(repoPath, backupRoot)),
    files: backedUp
  };
}
