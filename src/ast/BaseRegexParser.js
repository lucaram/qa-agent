export default class BaseRegexParser {
  parse({ file, language, code }) {
    return {
      file,
      language,
      code,
      imports: this.extractImports(code),
      exports: this.extractExports(code),
      functionDefinitions: this.extractFunctionDefinitions(code)
    };
  }

  extractImports() {
    return [];
  }

  extractExports() {
    return [];
  }

  extractFunctionDefinitions() {
    return [];
  }

  unique(values) {
    return [...new Set(values.filter(Boolean).map((x) => x.trim()))];
  }

  findMatchingBrace(code, openingBraceIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = "";
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = openingBraceIndex; i < code.length; i++) {
      const char = code[i];
      const next = code[i + 1];

      if (inLineComment) {
        if (char === "\n") inLineComment = false;
        continue;
      }

      if (inBlockComment) {
        if (char === "*" && next === "/") {
          inBlockComment = false;
          i++;
        }
        continue;
      }

      if (inString) {
        if (char === "\\") {
          i++;
          continue;
        }

        if (char === stringChar) {
          inString = false;
          stringChar = "";
        }

        continue;
      }

      if (char === "/" && next === "/") {
        inLineComment = true;
        i++;
        continue;
      }

      if (char === "/" && next === "*") {
        inBlockComment = true;
        i++;
        continue;
      }

      if (char === '"' || char === "'" || char === "`") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "{") depth++;

      if (char === "}") {
        depth--;
        if (depth === 0) return i;
      }
    }

    return -1;
  }
}