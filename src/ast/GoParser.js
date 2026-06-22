import BraceLanguageParser from "./BraceLanguageParser.js";

export default class GoParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "go",
      functionRegex:
        /\bfunc\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:[A-Za-z0-9_\*\[\]\.]+)?\s*{/g,
      importPatterns: [/import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g],
      exportPatterns: [
        /\bfunc\s+([A-Z][A-Za-z0-9_]*)\s*\(/g,
        /\btype\s+([A-Z][A-Za-z0-9_]*)\s+/g
      ]
    });
  }
}