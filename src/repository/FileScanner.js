import fs from "fs";
import path from "path";

import { IGNORE_DIRS, DOC_FILES } from "../config/constants.js";
import { LANGUAGE_PROFILES } from "../config/languageProfiles.js";
import { toPosix } from "../utils/pathUtils.js";

const ALL_SOURCE_EXTENSIONS = new Set(
  Object.values(LANGUAGE_PROFILES).flatMap(p => p.extensions)
);

export default class FileScanner {

  constructor(repoPath) {
    this.repoPath = repoPath;
  }

  scanFiles() {

    const results = [];

    const walk = (dir) => {

      const entries = fs.readdirSync(dir, {
        withFileTypes: true
      });

      for (const entry of entries) {

        const full = path.join(dir, entry.name);

        if (entry.isDirectory()) {

          if (!IGNORE_DIRS.has(entry.name)) {
            walk(full);
          }

          continue;
        }

        const relative = toPosix(
          path.relative(this.repoPath, full)
        );

        const ext = path.extname(entry.name);

        if (
          ALL_SOURCE_EXTENSIONS.has(ext) ||
          DOC_FILES.has(entry.name)
        ) {
          results.push(relative);
        }

      }

    };

    walk(this.repoPath);

    return results.sort();

  }

}