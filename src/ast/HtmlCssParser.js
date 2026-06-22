import BaseRegexParser from "./BaseRegexParser.js";

export default class HtmlCssParser extends BaseRegexParser {
  extractImports(code) {
    const imports = [];
    const patterns = [
      /<script[^>]+src=["'](.+?)["']/g,
      /@import\s+["'](.+?)["']/g
    ];

    for (const pattern of patterns) {
      let match;

      while ((match = pattern.exec(code)) !== null) {
        imports.push(match[1]);
      }
    }

    return this.unique(imports);
  }

  extractExports() {
    return [];
  }

  extractFunctionDefinitions() {
    return [];
  }
}