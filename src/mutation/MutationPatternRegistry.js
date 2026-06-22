import genericPatterns from "./patterns/genericPatterns.js";
import javascriptPatterns from "./patterns/javascriptPatterns.js";
import pythonPatterns from "./patterns/pythonPatterns.js";
import javaPatterns from "./patterns/javaPatterns.js";
import csharpPatterns from "./patterns/csharpPatterns.js";
import goPatterns from "./patterns/goPatterns.js";
import phpPatterns from "./patterns/phpPatterns.js";
import rubyPatterns from "./patterns/rubyPatterns.js";
import kotlinPatterns from "./patterns/kotlinPatterns.js";
import swiftPatterns from "./patterns/swiftPatterns.js";
import rustPatterns from "./patterns/rustPatterns.js";

const registry = {
  javascript: javascriptPatterns,
  typescript: javascriptPatterns,
  python: pythonPatterns,
  java: javaPatterns,
  csharp: csharpPatterns,
  go: goPatterns,
  php: phpPatterns,
  ruby: rubyPatterns,
  kotlin: kotlinPatterns,
  swift: swiftPatterns,
  rust: rustPatterns
};

export function getMutationPatternSet(language) {
  return registry[language] || genericPatterns;
}

export function getMaxMutationsForLanguage(language) {
  if (language === "javascript" || language === "typescript") return 8;
  if (language === "python") return 10;
  return 5;
}