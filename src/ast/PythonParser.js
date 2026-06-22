import BaseRegexParser from "./BaseRegexParser.js";
import { countLeadingSpaces } from "../utils/stringUtils.js";

export default class PythonParser extends BaseRegexParser {
  stripPythonStringsAndComments(code) {
    let output = "";
    let i = 0;
    let inString = false;
    let quote = "";
    let triple = false;

    while (i < code.length) {
      const char = code[i];
      const nextTwo = code.slice(i, i + 3);

      if (!inString && char === "#") {
        while (i < code.length && code[i] !== "\n") {
          output += " ";
          i++;
        }
        continue;
      }

      if (!inString && (nextTwo === `'''` || nextTwo === `"""`)) {
        inString = true;
        quote = nextTwo;
        triple = true;
        output += "   ";
        i += 3;
        continue;
      }

      if (!inString && (char === "'" || char === `"`)) {
        inString = true;
        quote = char;
        triple = false;
        output += " ";
        i++;
        continue;
      }

      if (inString) {
        if (char === "\\") {
          output += " ";
          if (i + 1 < code.length) output += " ";
          i += 2;
          continue;
        }

        if (triple && code.slice(i, i + 3) === quote) {
          output += "   ";
          i += 3;
          inString = false;
          quote = "";
          triple = false;
          continue;
        }

        if (!triple && char === quote) {
          output += " ";
          i++;
          inString = false;
          quote = "";
          continue;
        }

        output += char === "\n" ? "\n" : " ";
        i++;
        continue;
      }

      output += char;
      i++;
    }

    return output;
  }

  getLogicalLine(lines, startIndex) {
    let line = lines[startIndex];
    let endIndex = startIndex;
    let openParens = 0;
    let openBrackets = 0;
    let openBraces = 0;

    const updateDepth = (text) => {
      for (const char of text) {
        if (char === "(") openParens++;
        if (char === ")") openParens--;
        if (char === "[") openBrackets++;
        if (char === "]") openBrackets--;
        if (char === "{") openBraces++;
        if (char === "}") openBraces--;
      }
    };

    updateDepth(line);

    while (
      endIndex + 1 < lines.length &&
      (line.trimEnd().endsWith("\\") ||
        openParens > 0 ||
        openBrackets > 0 ||
        openBraces > 0)
    ) {
      endIndex++;
      line += `\n${lines[endIndex]}`;
      updateDepth(lines[endIndex]);
    }

    return {
      text: line,
      endIndex
    };
  }

  getBlockBody(lines, startLineIndex, parentIndent) {
    const bodyLines = [];
    let endLineIndex = startLineIndex;

    for (let i = startLineIndex + 1; i < lines.length; i++) {
      const currentLine = lines[i];

      if (currentLine.trim() === "") {
        bodyLines.push(currentLine);
        endLineIndex = i;
        continue;
      }

      const currentIndent = countLeadingSpaces(currentLine);

      if (currentIndent <= parentIndent) {
        break;
      }

      bodyLines.push(currentLine);
      endLineIndex = i;
    }

    return {
      body: bodyLines.join("\n"),
      endLine: endLineIndex + 1
    };
  }

  extractImports(code) {
    const imports = [];
    const safeCode = this.stripPythonStringsAndComments(code);
    const lines = safeCode.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!trimmed || trimmed.startsWith("#")) {
        continue;
      }

      const logical = this.getLogicalLine(lines, i);
      i = logical.endIndex;

      const text = logical.text
        .replace(/\\\n/g, " ")
        .replace(/\n/g, " ")
        .replace(/[()]/g, " ")
        .trim();

      const importMatch = text.match(/^import\s+(.+)$/);

      if (importMatch) {
        const importedNames = importMatch[1]
          .split(",")
          .map((item) => item.trim().split(/\s+as\s+/i)[0].trim())
          .filter(Boolean);

        imports.push(...importedNames);
        continue;
      }

      const fromMatch = text.match(/^from\s+([A-Za-z0-9_.]+|\.+[A-Za-z0-9_.]*)\s+import\s+(.+)$/);

      if (fromMatch) {
        imports.push(fromMatch[1]);
      }
    }

    return this.unique(imports);
  }

  extractExports(code) {
    const exports = [];
    const safeCode = this.stripPythonStringsAndComments(code);
    const lines = safeCode.split("\n");

    for (let i = 0; i < lines.length; i++) {
      const logical = this.getLogicalLine(lines, i);
      const line = logical.text;
      const trimmed = line.trim();

      i = logical.endIndex;

      const indent = countLeadingSpaces(line);

      if (indent !== 0) {
        continue;
      }

      const defMatch = trimmed.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);

      if (defMatch) {
        exports.push(defMatch[1]);
        continue;
      }

      const classMatch = trimmed.match(/^class\s+([A-Za-z_][A-Za-z0-9_]*)\s*(?:\(|:)/);

      if (classMatch) {
        exports.push(classMatch[1]);
      }
    }

    return this.unique(exports);
  }

  extractFunctionDefinitions(code) {
    const definitions = [];
    const safeCode = this.stripPythonStringsAndComments(code);
    const originalLines = code.split("\n");
    const safeLines = safeCode.split("\n");

    for (let i = 0; i < safeLines.length; i++) {
      const logical = this.getLogicalLine(safeLines, i);
      const logicalText = logical.text.trim();

      const match = logicalText.match(/^(?:async\s+)?def\s+([A-Za-z_][A-Za-z0-9_]*)\s*\(/);

      if (!match) {
        continue;
      }

      const line = safeLines[i];
      const indent = countLeadingSpaces(line);
      const name = match[1];
      const body = this.getBlockBody(originalLines, logical.endIndex, indent);

      definitions.push({
        name,
        type: logicalText.startsWith("async def")
          ? "python-async-function"
          : "python-function",
        startLine: i + 1,
        endLine: body.endLine,
        indent,
        body: body.body
      });

      i = body.endLine - 1;
    }

    return definitions;
  }
}