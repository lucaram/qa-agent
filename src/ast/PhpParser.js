import BraceLanguageParser from "./BraceLanguageParser.js";

export default class PhpParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "php",
      functionRegex: /\bfunction\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/g,
      importPatterns: [
        /^\s*use\s+([A-Za-z0-9_\\]+);/gm,
        /require_once\s+['"](.+?)['"]/g
      ],
      exportPatterns: [
        /\bfunction\s+([A-Za-z0-9_]+)\s*\(/g,
        /\bclass\s+([A-Za-z0-9_]+)/g
      ]
    });
  }
}