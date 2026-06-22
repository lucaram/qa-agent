import fs from "fs";
import path from "path";

import { LANGUAGE_PROFILES } from "../config/languageProfiles.js";

function readFileIfExists(repoPath, file) {
  const fullPath = path.join(repoPath, file);

  if (!fs.existsSync(fullPath)) {
    return "";
  }

  return fs.readFileSync(fullPath, "utf8");
}

export function detectProjectType(repoPath, allFiles) {
  const has = (file) => allFiles.includes(file);
  const hasExt = (ext) => allFiles.some((file) => file.endsWith(ext));
  const packageJson = readFileIfExists(repoPath, "package.json");

  const projectTypes = [];

  if (
    packageJson.includes("react") ||
    allFiles.some((f) => f.endsWith(".tsx") || f.endsWith(".jsx"))
  ) {
    projectTypes.push("React frontend");
  }

  if (packageJson.includes("next")) {
    projectTypes.push("Next.js frontend/backend");
  }

  if (packageJson.includes("express")) {
    projectTypes.push("Node/Express backend");
  }

  if (has("requirements.txt") || has("pyproject.toml") || hasExt(".py")) {
    projectTypes.push("Python");
  }

  if (has("pom.xml")) projectTypes.push("Java Maven");
  if (has("build.gradle") || has("build.gradle.kts")) projectTypes.push("Java/Kotlin Gradle");
  if (allFiles.some((f) => f.endsWith(".csproj"))) projectTypes.push(".NET / C#");
  if (has("go.mod")) projectTypes.push("Go module");
  if (has("composer.json")) projectTypes.push("PHP Composer");
  if (has("Gemfile")) projectTypes.push("Ruby");
  if (has("Cargo.toml")) projectTypes.push("Rust Cargo");
  if (has("Package.swift")) projectTypes.push("Swift Package");

  return projectTypes.length > 0
    ? projectTypes
    : ["Unknown / generic source project"];
}

export function detectTestCommand(repoPath, allFiles, primaryLanguage) {
  const packageJsonPath = path.join(repoPath, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (packageJson.scripts?.test) {
        return "npm test";
      }
    } catch {}
  }

  if (allFiles.includes("pyproject.toml") || allFiles.includes("requirements.txt")) {
    return "python -m pytest";
  }

  if (allFiles.includes("pom.xml")) return "mvn test";
  if (allFiles.includes("build.gradle") || allFiles.includes("build.gradle.kts")) return "./gradlew test";
  if (allFiles.some((file) => file.endsWith(".csproj"))) return "dotnet test";
  if (allFiles.includes("go.mod")) return "go test ./...";
  if (allFiles.includes("composer.json")) return "vendor/bin/phpunit";
  if (allFiles.includes("Gemfile")) return "bundle exec rspec";
  if (allFiles.includes("Cargo.toml")) return "cargo test";
  if (allFiles.includes("Package.swift")) return "swift test";

  return LANGUAGE_PROFILES[primaryLanguage]?.defaultTestCommand || "npm test";
}

export function testFileNameForLanguage(primaryLanguage) {
  return LANGUAGE_PROFILES[primaryLanguage]?.testFileName || "agent-generated-test.txt";
}