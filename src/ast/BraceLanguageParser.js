import BaseRegexParser from "./BaseRegexParser.js";

export default class BraceLanguageParser extends BaseRegexParser {
  constructor({ language, functionRegex, importPatterns = [], exportPatterns = [] }) {
    super();
    this.language = language;
    this.functionRegex = functionRegex;
    this.importPatterns = importPatterns;
    this.exportPatterns = exportPatterns;
  }

  extractImports(code) {
    const imports = [];

    for (const pattern of this.importPatterns) {
      let match;

      while ((match = pattern.exec(code)) !== null) {
        if (this.language === "go" && match[1]) {
          imports.push(
            ...match[1]
              .split("\n")
              .map((line) => line.trim().replace(/"/g, ""))
              .filter(Boolean)
          );
        } else {
          imports.push(match[1] || match[2]);
        }
      }
    }

    return this.unique(imports);
  }

  extractExports(code) {
    const exports = [];

    for (const pattern of this.exportPatterns) {
      let match;

      while ((match = pattern.exec(code)) !== null) {
        exports.push(match[1]);
      }
    }

    return this.unique(exports);
  }

  extractFunctionDefinitions(code) {
    const definitions = [];
    let match;

    while ((match = this.functionRegex.exec(code)) !== null) {
      const name = match[1];
      const openingBraceIndex = code.indexOf("{", match.index);
      const closingBraceIndex = this.findMatchingBrace(code, openingBraceIndex);

      if (closingBraceIndex !== -1) {
        definitions.push({
          name,
          type: `${this.language}-function`,
          startLine: code.slice(0, match.index).split("\n").length,
          body: code.slice(openingBraceIndex + 1, closingBraceIndex)
        });
      }
    }

    return definitions;
  }
}