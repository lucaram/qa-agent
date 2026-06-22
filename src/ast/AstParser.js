import JavascriptParser from "./JavascriptParser.js";
import TypescriptParser from "./TypescriptParser.js";
import PythonParser from "./PythonParser.js";
import JavaParser from "./JavaParser.js";
import CSharpParser from "./CSharpParser.js";
import GoParser from "./GoParser.js";
import PhpParser from "./PhpParser.js";
import RubyParser from "./RubyParser.js";
import KotlinParser from "./KotlinParser.js";
import SwiftParser from "./SwiftParser.js";
import RustParser from "./RustParser.js";
import HtmlCssParser from "./HtmlCssParser.js";

export default class AstParser {
  constructor() {
    this.parsers = {
      javascript: new JavascriptParser(),
      typescript: new TypescriptParser(),
      python: new PythonParser(),
      java: new JavaParser(),
      csharp: new CSharpParser(),
      go: new GoParser(),
      php: new PhpParser(),
      ruby: new RubyParser(),
      kotlin: new KotlinParser(),
      swift: new SwiftParser(),
      rust: new RustParser(),
      htmlcss: new HtmlCssParser()
    };
  }

  parse({ file, language, code }) {
    const parser = this.parsers[language];

    if (!parser) {
      return {
        file,
        language,
        code,
        imports: [],
        exports: [],
        functions: [],
        functionDefinitions: []
      };
    }

    const parsed = parser.parse({
      file,
      language,
      code
    });

    return {
      ...parsed,
      functions: parsed.functionDefinitions.map((fn) => fn.name)
    };
  }
}