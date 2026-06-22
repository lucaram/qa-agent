import BraceLanguageParser from "./BraceLanguageParser.js";

export default class CSharpParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "csharp",
      functionRegex:
        /\b(?:public|private|protected|internal)?\s*(?:static\s+)?[A-Za-z0-9_<>,\[\]\?]+\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/g,
      importPatterns: [/^\s*using\s+([A-Za-z0-9_.]+);/gm],
      exportPatterns: [
        /\bpublic\s+(?:class|interface|enum|struct)\s+([A-Za-z0-9_]+)/g,
        /\bpublic\s+(?:static\s+)?[A-Za-z0-9_<>,\[\]\?]+\s+([A-Za-z0-9_]+)\s*\(/g
      ]
    });
  }
}