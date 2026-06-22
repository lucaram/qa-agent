import BaseRegexParser from "./BaseRegexParser.js";

export default class JavascriptParser extends BaseRegexParser {
  stripJavaScriptStringsAndComments(code) {
    let output = "";
    let i = 0;
    let inString = false;
    let stringChar = "";
    let inLineComment = false;
    let inBlockComment = false;
    let inTemplateExpressionDepth = 0;

    while (i < code.length) {
      const char = code[i];
      const next = code[i + 1];

      if (inLineComment) {
        if (char === "\n") {
          inLineComment = false;
          output += "\n";
        } else {
          output += " ";
        }

        i++;
        continue;
      }

      if (inBlockComment) {
        if (char === "*" && next === "/") {
          output += "  ";
          i += 2;
          inBlockComment = false;
        } else {
          output += char === "\n" ? "\n" : " ";
          i++;
        }

        continue;
      }

      if (inString) {
        if (char === "\\") {
          output += " ";
          if (i + 1 < code.length) output += code[i + 1] === "\n" ? "\n" : " ";
          i += 2;
          continue;
        }

        if (stringChar === "`" && char === "$" && next === "{") {
          output += "${";
          i += 2;
          inTemplateExpressionDepth = 1;
          inString = false;
          continue;
        }

        if (char === stringChar) {
          output += " ";
          i++;
          inString = false;
          stringChar = "";
          continue;
        }

        output += char === "\n" ? "\n" : " ";
        i++;
        continue;
      }

      if (inTemplateExpressionDepth > 0) {
        if (char === "{") inTemplateExpressionDepth++;
        if (char === "}") inTemplateExpressionDepth--;

        output += char;
        i++;
        continue;
      }

      if (char === "/" && next === "/") {
        output += "  ";
        i += 2;
        inLineComment = true;
        continue;
      }

      if (char === "/" && next === "*") {
        output += "  ";
        i += 2;
        inBlockComment = true;
        continue;
      }

      if (char === "'" || char === `"` || char === "`") {
        output += " ";
        i++;
        inString = true;
        stringChar = char;
        continue;
      }

      output += char;
      i++;
    }

    return output;
  }

  lineNumberAt(code, index) {
    return code.slice(0, index).split("\n").length;
  }

  findStatementEnd(code, startIndex) {
    let depthParen = 0;
    let depthBrace = 0;
    let depthBracket = 0;

    for (let i = startIndex; i < code.length; i++) {
      const char = code[i];

      if (char === "(") depthParen++;
      if (char === ")") depthParen--;
      if (char === "{") depthBrace++;
      if (char === "}") depthBrace--;
      if (char === "[") depthBracket++;
      if (char === "]") depthBracket--;

      if (
        depthParen <= 0 &&
        depthBrace <= 0 &&
        depthBracket <= 0 &&
        (char === ";" || char === "\n")
      ) {
        return i;
      }
    }

    return code.length;
  }

  extractImports(code) {
    const imports = [];
    const safeCode = this.stripJavaScriptStringsAndComments(code);

    const patterns = [
      /\bimport\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?["'](.+?)["']/g,
      /\bimport\s*\(\s*["'](.+?)["']\s*\)/g,
      /\brequire\s*\(\s*["'](.+?)["']\s*\)/g,
      /\bexport\s+(?:type\s+)?(?:[^'"]+\s+from\s+)?["'](.+?)["']/g
    ];

    for (const pattern of patterns) {
      let match;

      while ((match = pattern.exec(code)) !== null) {
        const safeSlice = safeCode.slice(match.index, match.index + match[0].length);

        if (safeSlice.trim()) {
          imports.push(match[1]);
        }
      }
    }

    return this.unique(imports);
  }

  extractExports(code) {
    const exports = [];
    const safeCode = this.stripJavaScriptStringsAndComments(code);

    const namedPatterns = [
      /\bexport\s+(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
      /\bexport\s+(?:default\s+)?class\s+([A-Za-z_$][A-Za-z0-9_$]*)/g,
      /\bexport\s+(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)/g
    ];

    for (const pattern of namedPatterns) {
      let match;

      while ((match = pattern.exec(safeCode)) !== null) {
        exports.push(match[1]);
      }
    }

    const exportBlockPattern = /\bexport\s*{\s*([^}]+)\s*}/g;
    let match;

    while ((match = exportBlockPattern.exec(safeCode)) !== null) {
      const names = match[1]
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const parts = entry.split(/\s+as\s+/i).map((x) => x.trim());
          return parts[1] || parts[0];
        });

      exports.push(...names);
    }

    if (/\bexport\s+default\b/.test(safeCode)) {
      exports.push("default");
    }

    return this.unique(exports);
  }

  extractFunctionDeclarations(code, safeCode) {
    const definitions = [];
    const pattern =
      /\b(?:export\s+)?(?:default\s+)?(?:async\s+)?function\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*{/g;

    let match;

    while ((match = pattern.exec(safeCode)) !== null) {
      const name = match[1];
      const openingBraceIndex = safeCode.indexOf("{", match.index);
      const closingBraceIndex = this.findMatchingBrace(safeCode, openingBraceIndex);

      if (closingBraceIndex === -1) continue;

      definitions.push({
        name,
        type: match[0].includes("async") ? "async-function" : "function",
        startLine: this.lineNumberAt(code, match.index),
        endLine: this.lineNumberAt(code, closingBraceIndex),
        body: code.slice(openingBraceIndex + 1, closingBraceIndex)
      });
    }

    return definitions;
  }

  extractArrowFunctions(code, safeCode) {
    const definitions = [];

    const pattern =
      /\b(?:export\s+)?(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][A-Za-z0-9_$]*)\s*=>/g;

    let match;

    while ((match = pattern.exec(safeCode)) !== null) {
      const name = match[1];
      const afterArrowIndex = pattern.lastIndex;
      const remaining = safeCode.slice(afterArrowIndex).trimStart();
      const offset =
        afterArrowIndex + (safeCode.slice(afterArrowIndex).length - remaining.length);

      if (remaining.startsWith("{")) {
        const closingBraceIndex = this.findMatchingBrace(safeCode, offset);

        if (closingBraceIndex === -1) continue;

        definitions.push({
          name,
          type: match[0].includes("async") ? "async-arrow-block" : "arrow-block",
          startLine: this.lineNumberAt(code, match.index),
          endLine: this.lineNumberAt(code, closingBraceIndex),
          body: code.slice(offset + 1, closingBraceIndex)
        });

        continue;
      }

      const endIndex = this.findStatementEnd(safeCode, offset);

      definitions.push({
        name,
        type: match[0].includes("async") ? "async-arrow-expression" : "arrow-expression",
        startLine: this.lineNumberAt(code, match.index),
        endLine: this.lineNumberAt(code, endIndex),
        body: code.slice(offset, endIndex)
      });
    }

    return definitions;
  }

  extractObjectMethodFunctions(code, safeCode) {
    const definitions = [];

    const pattern =
      /(?:^|[,{]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*(?:async\s*)?\([^)]*\)\s*{/gm;

    let match;

    while ((match = pattern.exec(safeCode)) !== null) {
      const name = match[1];

      if (["if", "for", "while", "switch", "catch", "function"].includes(name)) {
        continue;
      }

      const openingBraceIndex = safeCode.indexOf("{", match.index);
      const closingBraceIndex = this.findMatchingBrace(safeCode, openingBraceIndex);

      if (closingBraceIndex === -1) continue;

      definitions.push({
        name,
        type: "object-method",
        startLine: this.lineNumberAt(code, match.index),
        endLine: this.lineNumberAt(code, closingBraceIndex),
        body: code.slice(openingBraceIndex + 1, closingBraceIndex)
      });
    }

    return definitions;
  }

  extractClassMethods(code, safeCode) {
    const definitions = [];
    const classPattern = /\bclass\s+([A-Za-z_$][A-Za-z0-9_$]*)[^{]*{/g;
    let classMatch;

    while ((classMatch = classPattern.exec(safeCode)) !== null) {
      const className = classMatch[1];
      const classOpen = safeCode.indexOf("{", classMatch.index);
      const classClose = this.findMatchingBrace(safeCode, classOpen);

      if (classClose === -1) continue;

      const classBody = safeCode.slice(classOpen + 1, classClose);
      const methodPattern =
        /(?:^|\n)\s*(?:async\s+)?(?:static\s+)?([A-Za-z_$][A-Za-z0-9_$]*)\s*\([^)]*\)\s*{/g;

      let methodMatch;

      while ((methodMatch = methodPattern.exec(classBody)) !== null) {
        const methodName = methodMatch[1];

        if (["if", "for", "while", "switch", "catch"].includes(methodName)) {
          continue;
        }

        const absoluteMethodIndex = classOpen + 1 + methodMatch.index;
        const openingBraceIndex = safeCode.indexOf("{", absoluteMethodIndex);
        const closingBraceIndex = this.findMatchingBrace(safeCode, openingBraceIndex);

        if (closingBraceIndex === -1 || closingBraceIndex > classClose) continue;

        definitions.push({
          name: `${className}.${methodName}`,
          type: "class-method",
          startLine: this.lineNumberAt(code, absoluteMethodIndex),
          endLine: this.lineNumberAt(code, closingBraceIndex),
          body: code.slice(openingBraceIndex + 1, closingBraceIndex)
        });
      }
    }

    return definitions;
  }

  extractFunctionDefinitions(code) {
    const safeCode = this.stripJavaScriptStringsAndComments(code);

    const definitions = [
      ...this.extractFunctionDeclarations(code, safeCode),
      ...this.extractArrowFunctions(code, safeCode),
      ...this.extractObjectMethodFunctions(code, safeCode),
      ...this.extractClassMethods(code, safeCode)
    ];

    const seen = new Set();

    return definitions.filter((definition) => {
      const key = `${definition.name}:${definition.startLine}:${definition.endLine}`;

      if (seen.has(key)) {
        return false;
      }

      seen.add(key);
      return true;
    });
  }
}