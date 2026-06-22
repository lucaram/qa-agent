import BraceLanguageParser from "./BraceLanguageParser.js";

export default class SwiftParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "swift",
      functionRegex:
        /\bfunc\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:->\s*[A-Za-z0-9_<>,\?\s]+)?\s*{/g,
      importPatterns: [/^\s*import\s+([A-Za-z0-9_]+)$/gm],
      exportPatterns: [
        /\bfunc\s+([A-Za-z0-9_]+)\s*\(/g,
        /\bclass\s+([A-Za-z0-9_]+)/g,
        /\bstruct\s+([A-Za-z0-9_]+)/g
      ]
    });
  }
}