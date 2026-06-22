import BraceLanguageParser from "./BraceLanguageParser.js";

export default class RustParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "rust",
      functionRegex:
        /\b(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:->\s*[A-Za-z0-9_<>,:&\s]+)?\s*{/g,
      importPatterns: [
        /^\s*use\s+([A-Za-z0-9_:]+);/gm,
        /^\s*mod\s+([A-Za-z0-9_]+);/gm
      ],
      exportPatterns: [
        /\bpub\s+fn\s+([A-Za-z0-9_]+)\s*\(/g,
        /\bpub\s+struct\s+([A-Za-z0-9_]+)/g
      ]
    });
  }
}