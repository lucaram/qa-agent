import fs from "fs";
import path from "path";

import { LANGUAGE_PROFILES } from "../config/languageProfiles.js";
import FileScanner from "../repository/FileScanner.js";

import AstParser from "../ast/AstParser.js";

import DeterministicAnalyser from "../analysis/DeterministicAnalyser.js";
import CallGraphBuilder from "../analysis/CallGraphBuilder.js";
import DependencyGraphBuilder from "../analysis/DependencyGraphBuilder.js";

import {
  ALL_SOURCE_EXTENSIONS,
  isDocFile,
  isTestFile
} from "../repository/fileClassifier.js";

import {
  detectLanguageFromFile,
  detectPrimaryLanguage
} from "../repository/languageDetector.js";

import {
  detectProjectType,
  detectTestCommand,
  testFileNameForLanguage
} from "../repository/projectDetector.js";

import { getGitInfo } from "../repository/gitAnalyzer.js";

import { safeJoin, toPosix } from "../utils/pathUtils.js";

export default class RepositoryAgent {
  constructor(repoPath) {
    this.repoPath = repoPath;
  }

  readFileSafe(relativePath) {
    return fs.readFileSync(safeJoin(this.repoPath, relativePath), "utf8");
  }

  resolveImport(fromFile, importPath) {
    if (!importPath.startsWith(".")) return null;

    const fromDir = path.dirname(fromFile);
    const candidateBase = toPosix(path.normalize(path.join(fromDir, importPath)));

    const candidates = [
      candidateBase,
      `${candidateBase}.js`,
      `${candidateBase}.mjs`,
      `${candidateBase}.cjs`,
      `${candidateBase}.ts`,
      `${candidateBase}.tsx`,
      `${candidateBase}.py`,
      `${candidateBase}.java`,
      `${candidateBase}.cs`,
      `${candidateBase}.go`,
      `${candidateBase}.php`,
      `${candidateBase}.rb`,
      `${candidateBase}.kt`,
      `${candidateBase}.kts`,
      `${candidateBase}.swift`,
      `${candidateBase}.rs`,
      `${candidateBase}.html`,
      `${candidateBase}.css`,
      `${candidateBase}.scss`,
      `${candidateBase}.sass`,
      `${candidateBase}/index.js`,
      `${candidateBase}/index.mjs`,
      `${candidateBase}/index.cjs`,
      `${candidateBase}/index.ts`,
      `${candidateBase}/index.tsx`
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(path.join(this.repoPath, candidate))) {
        return candidate;
      }
    }

    return candidateBase;
  }

  buildModules(rawModules, deterministicAnalysis, callGraphResult) {
    return rawModules.map((mod) => {
      const imports = mod.imports.map((imp) => ({
        raw: imp,
        resolved: this.resolveImport(mod.file, imp)
      }));

      return {
        file: mod.file,
        language: mod.language,
        imports,
        exports: mod.exports,
        functions: mod.functions,
        deterministicMetrics:
          deterministicAnalysis.files.find((fileMetric) => fileMetric.file === mod.file) || null,
        functionCalls: callGraphResult.moduleFunctionCalls[mod.file] || {}
      };
    });
  }

  analyseRepository() {
    const scanner = new FileScanner(this.repoPath);
    const astParser = new AstParser();

    const allFiles = scanner.scanFiles();

    const sourceFiles = allFiles.filter((file) =>
      ALL_SOURCE_EXTENSIONS.has(path.extname(file))
    );

    const docFiles = allFiles.filter((file) => isDocFile(file));
    const testFiles = sourceFiles.filter(isTestFile);

    const languageCounts = {};

    for (const key of Object.keys(LANGUAGE_PROFILES)) {
      languageCounts[key] = 0;
    }

    for (const file of sourceFiles) {
      const lang = detectLanguageFromFile(file);

      if (languageCounts[lang] !== undefined) {
        languageCounts[lang]++;
      }
    }

    const primaryLanguage = detectPrimaryLanguage(languageCounts);
    const projectTypes = detectProjectType(this.repoPath, allFiles);
    const testCommand = detectTestCommand(this.repoPath, allFiles, primaryLanguage);

    const rawModules = [];

    for (const file of sourceFiles) {
      if (isTestFile(file)) {
        continue;
      }

      const language = detectLanguageFromFile(file);
      const code = this.readFileSafe(file);

      const parsedModule = astParser.parse({
        file,
        language,
        code
      });

      rawModules.push(parsedModule);
    }

    const deterministicAnalyser = new DeterministicAnalyser(
      this.repoPath,
      this.readFileSafe.bind(this)
    );

    const deterministicAnalysis = deterministicAnalyser.analyse(
      rawModules,
      testFiles
    );

    const callGraphBuilder = new CallGraphBuilder();
    const callGraphResult = callGraphBuilder.build(rawModules);

    const modules = this.buildModules(
      rawModules,
      deterministicAnalysis,
      callGraphResult
    );

    const dependencyGraphBuilder = new DependencyGraphBuilder();
    const dependencyGraphResult = dependencyGraphBuilder.build(modules);

    const git = getGitInfo(
      this.repoPath,
      sourceFiles.filter((file) => !isTestFile(file))
    );

    return {
      language: LANGUAGE_PROFILES[primaryLanguage]?.label || "Unknown",
      primaryLanguage,
      languageCounts,
      projectTypes,
      testCommand,
      generatedTestFile: testFileNameForLanguage(primaryLanguage),
      deterministicAnalysis,
      files: {
        docs: docFiles,
        source: sourceFiles.filter((file) => !isTestFile(file)),
        tests: testFiles
      },
      git,
      modules,
      dependencyGraph: dependencyGraphResult.dependencyGraph,
      reverseDependencies: dependencyGraphResult.reverseDependencies,
      callGraph: callGraphResult.callGraph,
      entryPoints: dependencyGraphResult.entryPoints,
      importedFiles: dependencyGraphResult.importedFiles
    };
  }
}