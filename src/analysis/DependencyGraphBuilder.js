export default class DependencyGraphBuilder {
  build(modules) {
    const importedFiles = new Set();

    for (const mod of modules) {
      for (const imp of mod.imports) {
        if (imp.resolved) {
          importedFiles.add(imp.resolved);
        }
      }
    }

    const reverseDependencies = {};

    for (const mod of modules) {
      reverseDependencies[mod.file] = [];
    }

    for (const mod of modules) {
      for (const imp of mod.imports) {
        if (imp.resolved && reverseDependencies[imp.resolved]) {
          reverseDependencies[imp.resolved].push(mod.file);
        }
      }
    }

    const dependencyGraph = modules.map((mod) => ({
      file: mod.file,
      language: mod.language,
      imports: mod.imports
    }));

    const entryPoints = modules
      .filter((mod) => mod.exports.length > 0 || mod.functions.length > 0)
      .map((mod) => ({
        file: mod.file,
        language: mod.language,
        exports: mod.exports,
        functions: mod.functions,
        isTopLevel: !importedFiles.has(mod.file),
        imports: mod.imports.map((x) => x.resolved).filter(Boolean),
        importedBy: reverseDependencies[mod.file] || []
      }));

    return {
      dependencyGraph,
      reverseDependencies,
      entryPoints,
      importedFiles: [...importedFiles].sort()
    };
  }
}