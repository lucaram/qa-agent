import BraceLanguageParser from "./BraceLanguageParser.js";

export default class KotlinParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "kotlin",
      functionRegex:
        /\bfun\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>,\?\s]+)?\s*{/g,
      importPatterns: [/^\s*import\s+([A-Za-z0-9_.]+)$/gm],
      exportPatterns: [
        /\bfun\s+([A-Za-z0-9_]+)\s*\(/g,
        /\bclass\s+([A-Za-z0-9_]+)/g
      ]
    });
  }
}