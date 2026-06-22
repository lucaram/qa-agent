import BaseRegexParser from "./BaseRegexParser.js";

export default class RubyParser extends BaseRegexParser {
  extractImports(code) {
    const imports = [];
    const pattern = /^\s*require(?:_relative)?\s+['"](.+?)['"]/gm;

    let match;
    while ((match = pattern.exec(code)) !== null) {
      imports.push(match[1]);
    }

    return this.unique(imports);
  }

  extractExports(code) {
    const exports = [];
    const patterns = [
      /^\s*def\s+([A-Za-z0-9_!?=]+)\s*/gm,
      /^\s*class\s+([A-Za-z0-9_:]+)\s*/gm
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        exports.push(match[1]);
      }
    }

    return this.unique(exports);
  }

  findRubyEndIndex(lines, startLineIndex) {
    let depth = 0;

    for (let i = startLineIndex; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (/^(def|class|module|if|unless|case|while|until|for|begin|do)\b/.test(trimmed)) {
        depth++;
      }

      if (trimmed === "end") {
        depth--;

        if (depth === 0) {
          return i;
        }
      }
    }

    return lines.length - 1;
  }

  extractFunctionDefinitions(code) {
    const definitions = [];
    const lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(/^\s*def\s+([A-Za-z0-9_!?=]+)/);

      if (!match) continue;

      const name = match[1];
      const endIndex = this.findRubyEndIndex(lines, i);

      definitions.push({
        name,
        type: "ruby-function",
        startLine: i + 1,
        body: lines.slice(i + 1, endIndex).join("\n")
      });
    }

    return definitions;
  }
}