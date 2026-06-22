import path from "path";

import { DOC_FILES } from "../config/constants.js";
import { LANGUAGE_PROFILES } from "../config/languageProfiles.js";
import { toPosix } from "../utils/pathUtils.js";

export const ALL_SOURCE_EXTENSIONS = new Set(
  Object.values(LANGUAGE_PROFILES).flatMap((profile) => profile.extensions)
);

export function isDocFile(file) {
  const base = path.basename(file);

  return DOC_FILES.has(base) || base.endsWith(".csproj");
}

export function isTestFile(file) {
  const lower = toPosix(file).toLowerCase();

  return (
    lower === "test.js" ||
    lower.includes("__tests__/") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.js") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".spec.tsx") ||
    lower.startsWith("test_") ||
    lower.endsWith("_test.py") ||
    lower.includes("/test_") ||
    lower.endsWith("test.java") ||
    lower.endsWith("tests.java") ||
    lower.endsWith("test.cs") ||
    lower.endsWith("tests.cs") ||
    lower.endsWith("_test.go") ||
    lower.endsWith("_test.rb") ||
    lower.endsWith("spec.rb") ||
    lower.endsWith("test.php") ||
    lower.endsWith("test.kt") ||
    lower.endsWith("tests.swift") ||
    lower.endsWith("_test.rs")
  );
}

export function isGeneratedArtifact(file) {
  const lower = toPosix(file).toLowerCase();

  return (
    lower === "qa-report.md" ||
    lower === "repository-analysis.md" ||
    lower === "qa-dashboard.json" ||
    lower === "qa-dashboard.html" ||
    lower === "qa-benchmark.json" ||
    lower === "mutation-report.md" ||
    lower.includes(".qa-agent-backups/") ||
    lower.includes(".qa-agent-sandbox/")
  );
}

export function isSourceFile(file) {
  return ALL_SOURCE_EXTENSIONS.has(path.extname(file));
}