export const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  "bin",
  "obj",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".pytest_cache",
  ".qa-agent-backups",
  ".qa-agent-sandbox"
]);

export const DOC_FILES = new Set([
  "README.md",
  "readme.md",
  "package.json",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Cargo.toml",
  "Package.swift"
]);