import JavascriptParser from "./JavascriptParser.js";

export default class TypescriptParser extends JavascriptParser {
  extractExports(code) {
    const exports = super.extractExports(code);

    const patterns = [
      /export\s+interface\s+([A-Za-z0-9_$]+)/g,
      /export\s+type\s+([A-Za-z0-9_$]+)/g
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        exports.push(match[1]);
      }
    }

    return this.unique(exports);
  }
}