import fs from "fs";
import path from "path";

import { safeJoin } from "../utils/pathUtils.js";

export default class OutputAgent {
  constructor(repoPath) {
    this.repoPath = repoPath;
    this.outputFolderName = "QA-Agent";
    this.dependenciesFolderName = "dependencies";
    this.otherGeneratedFilesFolderName = "other-generated-files";
  }

  get outputPath() {
    return safeJoin(this.repoPath, this.outputFolderName);
  }

  get dependenciesPath() {
    return path.join(this.outputPath, this.dependenciesFolderName);
  }

  get otherGeneratedFilesPath() {
    return path.join(this.outputPath, this.otherGeneratedFilesFolderName);
  }

  ensureFolder(folderPath) {
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
  }

  exists(relativePath) {
    try {
      return fs.existsSync(safeJoin(this.repoPath, relativePath));
    } catch {
      return false;
    }
  }

  isDirectory(relativePath) {
    try {
      return fs.statSync(safeJoin(this.repoPath, relativePath)).isDirectory();
    } catch {
      return false;
    }
  }

  copyFileToFolder(relativePath, targetFolder) {
    const source = safeJoin(this.repoPath, relativePath);

    if (!fs.existsSync(source) || fs.statSync(source).isDirectory()) {
      return false;
    }

    const destination = path.join(targetFolder, path.basename(relativePath));
    fs.copyFileSync(source, destination);

    return true;
  }

  moveFileToFolder(relativePath, targetFolder) {
    const source = safeJoin(this.repoPath, relativePath);

    if (!fs.existsSync(source) || fs.statSync(source).isDirectory()) {
      return false;
    }

    this.ensureFolder(targetFolder);

    const destination = path.join(targetFolder, path.basename(relativePath));

    if (fs.existsSync(destination)) {
      fs.rmSync(destination, { force: true });
    }

    fs.renameSync(source, destination);

    return true;
  }

  copyDirectoryToFolder(relativePath, targetFolder) {
    const source = safeJoin(this.repoPath, relativePath);

    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
      return false;
    }

    this.ensureFolder(targetFolder);

    const destination = path.join(targetFolder, path.basename(relativePath));

    if (fs.existsSync(destination)) {
      fs.rmSync(destination, { recursive: true, force: true });
    }

    fs.cpSync(source, destination, { recursive: true });

    return true;
  }

  moveDirectoryToFolder(relativePath, targetFolder) {
    const source = safeJoin(this.repoPath, relativePath);

    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
      return false;
    }

    this.ensureFolder(targetFolder);

    const destination = path.join(targetFolder, path.basename(relativePath));

    if (fs.existsSync(destination)) {
      fs.rmSync(destination, { recursive: true, force: true });
    }

    fs.renameSync(source, destination);

    return true;
  }

  getPrimaryOutputFiles(repoAnalysis) {
    return [
      "qa-dashboard.html",
      "planning-report.md",
      repoAnalysis?.generatedTestFile
    ].filter(Boolean);
  }

  getOtherGeneratedFiles() {
    return [
      "mutation-report.md",
      "qa-benchmark.json",
      "qa-dashboard.json",
      "qa-report.md",
      "repository-analysis.md"
    ];
  }

  getDependencyFiles(repoAnalysis) {
    const primaryLanguage = String(repoAnalysis?.primaryLanguage || "").toLowerCase();

    const common = [
      "package-lock.json",
      "yarn.lock",
      "pnpm-lock.yaml",
      "npm-shrinkwrap.json",
      ".pytest_cache",
      "__pycache__",
      ".mypy_cache",
      ".ruff_cache",
      ".coverage",
      "htmlcov",
      "coverage",
      "dist",
      "build",
      "target",
      ".gradle",
      ".idea",
      ".vscode"
    ];

    const byLanguage = {
      javascript: [
        "package.json",
        "node_modules",
        "jest.config.js",
        "jest.config.cjs",
        "jest.config.mjs",
        "vitest.config.js",
        "vitest.config.ts",
        "mocha.config.js"
      ],
      typescript: [
        "package.json",
        "tsconfig.json",
        "node_modules",
        "jest.config.js",
        "jest.config.ts",
        "vitest.config.js",
        "vitest.config.ts"
      ],
      python: [
        "requirements.txt",
        "pyproject.toml",
        "setup.py",
        "setup.cfg",
        "Pipfile",
        "poetry.lock",
        "__pycache__",
        ".pytest_cache"
      ],
      java: [
        "pom.xml",
        "build.gradle",
        "build.gradle.kts",
        "settings.gradle",
        "settings.gradle.kts",
        ".gradle",
        "target",
        "build"
      ],
      csharp: [
        "*.csproj",
        "*.sln",
        "bin",
        "obj",
        "TestResults",
        "packages.lock.json"
      ],
      "c#": [
        "*.csproj",
        "*.sln",
        "bin",
        "obj",
        "TestResults",
        "packages.lock.json"
      ],
      go: ["go.mod", "go.sum", "vendor"],
      php: [
        "composer.json",
        "composer.lock",
        "vendor",
        "phpunit.xml",
        "phpunit.xml.dist"
      ],
      ruby: ["Gemfile", "Gemfile.lock", ".bundle", "spec", "test"],
      rust: ["Cargo.toml", "Cargo.lock", "target"],
      swift: ["Package.swift", "Package.resolved", ".build"],
      kotlin: [
        "build.gradle.kts",
        "build.gradle",
        "settings.gradle.kts",
        "settings.gradle",
        ".gradle",
        "build"
      ],
      htmlcss: [
        "package.json",
        "node_modules",
        "playwright.config.js",
        "playwright.config.ts",
        "cypress.config.js",
        "cypress.config.ts"
      ]
    };

    return [...new Set([...(byLanguage[primaryLanguage] || []), ...common])];
  }

  expandGlobPattern(pattern) {
    if (!pattern.includes("*")) {
      return [pattern];
    }

    const files = fs.readdirSync(this.repoPath);

    const regex = new RegExp(
      `^${pattern
        .split("*")
        .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
        .join(".*")}$`
    );

    return files.filter((file) => regex.test(file));
  }

  moveGeneratedOutputs(repoAnalysis, result) {
    for (const file of this.getPrimaryOutputFiles(repoAnalysis)) {
      for (const candidate of this.expandGlobPattern(file)) {
        if (this.moveFileToFolder(candidate, this.outputPath)) {
          result.movedPrimaryOutputs.push(candidate);
        }
      }
    }

    for (const file of this.getOtherGeneratedFiles()) {
      for (const candidate of this.expandGlobPattern(file)) {
        if (this.moveFileToFolder(candidate, this.otherGeneratedFilesPath)) {
          result.movedOtherGeneratedFiles.push(candidate);
        }
      }
    }
  }

  copyDependencies(repoAnalysis, dependencyResult, result) {
    const dependencyFiles = [
      ...this.getDependencyFiles(repoAnalysis),
      ...(dependencyResult?.createdFiles || []),
      ...(dependencyResult?.updatedFiles || [])
    ];

    const uniqueFiles = [...new Set(dependencyFiles)];

    for (const item of uniqueFiles) {
      for (const candidate of this.expandGlobPattern(item)) {
        if (
          candidate === this.outputFolderName ||
          candidate.startsWith(`${this.outputFolderName}${path.sep}`) ||
          candidate.startsWith(`${this.outputFolderName}/`)
        ) {
          continue;
        }

        if (!this.exists(candidate)) {
          continue;
        }

        const wasGeneratedByDependencyAgent =
          dependencyResult?.createdFiles?.includes(candidate) ||
          dependencyResult?.updatedFiles?.includes(candidate);

        if (wasGeneratedByDependencyAgent) {
          if (this.isDirectory(candidate)) {
            if (this.moveDirectoryToFolder(candidate, this.dependenciesPath)) {
              result.movedDependencies.push(candidate);
            }
          } else if (this.moveFileToFolder(candidate, this.dependenciesPath)) {
            result.movedDependencies.push(candidate);
          }

          continue;
        }

        if (this.isDirectory(candidate)) {
          if (this.copyDirectoryToFolder(candidate, this.dependenciesPath)) {
            result.copiedDependencies.push(candidate);
          }
        } else if (this.copyFileToFolder(candidate, this.dependenciesPath)) {
          result.copiedDependencies.push(candidate);
        }
      }
    }
  }

  moveRuntimeArtifacts(result) {
    const runtimeArtifacts = [
      "__pycache__",
      ".pytest_cache",
      ".mypy_cache",
      ".ruff_cache",
      ".coverage",
      "htmlcov",
      "coverage",
      "TestResults",
      "bin",
      "obj",
      "target",
      ".gradle",
      ".build"
    ];

    for (const artifact of runtimeArtifacts) {
      if (
        !this.exists(artifact) ||
        artifact === this.outputFolderName ||
        artifact.startsWith(`${this.outputFolderName}/`)
      ) {
        continue;
      }

      if (this.isDirectory(artifact)) {
        if (this.moveDirectoryToFolder(artifact, this.dependenciesPath)) {
          result.movedRuntimeArtifacts.push(artifact);
        }
      } else if (this.moveFileToFolder(artifact, this.dependenciesPath)) {
        result.movedRuntimeArtifacts.push(artifact);
      }
    }
  }

  writeManifest({ repoAnalysis, dependencyResult, result }) {
    const manifest = {
      generatedAt: new Date().toISOString(),
      outputFolder: this.outputFolderName,
      dependenciesFolder: `${this.outputFolderName}/${this.dependenciesFolderName}`,
      otherGeneratedFilesFolder: `${this.outputFolderName}/${this.otherGeneratedFilesFolderName}`,
      language: repoAnalysis?.language,
      primaryLanguage: repoAnalysis?.primaryLanguage,
      testCommand: repoAnalysis?.testCommand,
      generatedTestFile: repoAnalysis?.generatedTestFile,
      movedPrimaryOutputs: result.movedPrimaryOutputs,
      movedOtherGeneratedFiles: result.movedOtherGeneratedFiles,
      copiedDependencies: result.copiedDependencies,
      movedDependencies: result.movedDependencies,
      movedRuntimeArtifacts: result.movedRuntimeArtifacts,
      dependencyAgent: dependencyResult || null
    };

    this.ensureFolder(this.otherGeneratedFilesPath);

    fs.writeFileSync(
      path.join(this.otherGeneratedFilesPath, "qa-agent-manifest.json"),
      `${JSON.stringify(manifest, null, 2)}\n`
    );

    result.createdManifest = "other-generated-files/qa-agent-manifest.json";
  }

  run({ repoAnalysis, dependencyResult = null }) {
    const result = {
      generatedAt: new Date().toISOString(),
      outputPath: this.outputPath,
      dependenciesPath: this.dependenciesPath,
      otherGeneratedFilesPath: this.otherGeneratedFilesPath,
      movedPrimaryOutputs: [],
      movedOtherGeneratedFiles: [],
      copiedDependencies: [],
      movedDependencies: [],
      movedRuntimeArtifacts: [],
      createdManifest: null
    };

    this.ensureFolder(this.outputPath);
    this.ensureFolder(this.dependenciesPath);
    this.ensureFolder(this.otherGeneratedFilesPath);

    this.moveGeneratedOutputs(repoAnalysis, result);
    this.copyDependencies(repoAnalysis, dependencyResult, result);
    this.moveRuntimeArtifacts(result);
    this.writeManifest({ repoAnalysis, dependencyResult, result });

    return result;
  }
}