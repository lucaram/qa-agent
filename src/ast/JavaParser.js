import BraceLanguageParser from "./BraceLanguageParser.js";

export default class JavaParser extends BraceLanguageParser {
  constructor() {
    super({
      language: "java",
      functionRegex:
        /\b(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z0-9_<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[A-Za-z0-9_,\s]+)?\s*{/g,
      importPatterns: [/^\s*import\s+([A-Za-z0-9_.]+);/gm],
      exportPatterns: [
        /\bpublic\s+(?:class|interface|enum)\s+([A-Za-z0-9_]+)/g,
        /\bpublic\s+(?:static\s+)?[A-Za-z0-9_<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(/g
      ]
    });
  }
}