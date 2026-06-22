import "dotenv/config";
import OpenAI from "openai";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const client = new OpenAI();

const args = process.argv.slice(2);

const fixMode = args.includes("--fix");
const requestedChangedMode = args.includes("--changed");
const mutationMode = args.includes("--mutation");
const benchmarkMode = args.includes("--benchmark");
const initCiMode = args.includes("--init-ci");
const fullScanMode = args.includes("--all");

const targetArgIndex = args.indexOf("--target");
const targetFile =
  targetArgIndex !== -1 && args[targetArgIndex + 1]
    ? args[targetArgIndex + 1]
    : null;

const repoPathArg = args.find((arg, index) => {
  if (arg.startsWith("--")) return false;
  if (index > 0 && args[index - 1] === "--target") return false;
  return true;
});

const repoPath = path.resolve(repoPathArg || process.cwd());

let activeChangedMode = requestedChangedMode;
let autoChangedMode = false;

if (!fs.existsSync(repoPath)) {
  console.log(`❌ Repository path does not exist: ${repoPath}`);
  process.exit(1);
}

const IGNORE_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  "build",
  "coverage",
  ".next",
  "out",
  "bin",
  "obj",
  "target",
  ".venv",
  "venv",
  "__pycache__",
  ".pytest_cache",
  ".qa-agent-backups",
  ".qa-agent-sandbox"
]);

const DOC_FILES = new Set([
  "README.md",
  "readme.md",
  "package.json",
  "CHANGELOG.md",
  "CONTRIBUTING.md",
  "requirements.txt",
  "pyproject.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "go.mod",
  "composer.json",
  "Gemfile",
  "Cargo.toml",
  "Package.swift"
]);

const LANGUAGE_PROFILES = {
  javascript: {
    label: "JavaScript / Node",
    extensions: [".js", ".mjs", ".cjs"],
    testFileName: "test.js",
    defaultTestCommand: "npm test",
    testInstruction:
      "Generate Node.js tests. Prefer the existing project test framework if clear; otherwise use node:assert/strict."
  },
  typescript: {
    label: "TypeScript / React",
    extensions: [".ts", ".tsx"],
    testFileName: "agent.generated.test.ts",
    defaultTestCommand: "npm test",
    testInstruction:
      "Generate TypeScript tests. Prefer Vitest/Jest/React Testing Library if the project uses them."
  },
  python: {
    label: "Python",
    extensions: [".py"],
    testFileName: "test_agent_generated.py",
    defaultTestCommand: "python -m pytest",
    testInstruction:
      "Generate Python pytest tests. Use pytest style. Import discovered functions/classes from the target modules."
  },
  java: {
    label: "Java",
    extensions: [".java"],
    testFileName: "AgentGeneratedTest.java",
    defaultTestCommand: "mvn test",
    testInstruction: "Generate Java JUnit tests. Prefer JUnit 5."
  },
  csharp: {
    label: "C# / .NET",
    extensions: [".cs"],
    testFileName: "AgentGeneratedTests.cs",
    defaultTestCommand: "dotnet test",
    testInstruction:
      "Generate C# tests. Prefer xUnit unless the project clearly uses NUnit or MSTest."
  },
  go: {
    label: "Go",
    extensions: [".go"],
    testFileName: "agent_generated_test.go",
    defaultTestCommand: "go test ./...",
    testInstruction: "Generate Go tests using the standard testing package."
  },
  php: {
    label: "PHP",
    extensions: [".php"],
    testFileName: "AgentGeneratedTest.php",
    defaultTestCommand: "vendor/bin/phpunit",
    testInstruction: "Generate PHPUnit tests. Use discovered classes/functions only."
  },
  ruby: {
    label: "Ruby",
    extensions: [".rb"],
    testFileName: "agent_generated_test.rb",
    defaultTestCommand: "ruby agent_generated_test.rb",
    testInstruction: "Generate Ruby tests. Prefer RSpec if present; otherwise use minitest."
  },
  kotlin: {
    label: "Kotlin",
    extensions: [".kt", ".kts"],
    testFileName: "AgentGeneratedTest.kt",
    defaultTestCommand: "./gradlew test",
    testInstruction: "Generate Kotlin tests. Prefer JUnit with Gradle."
  },
  swift: {
    label: "Swift",
    extensions: [".swift"],
    testFileName: "AgentGeneratedTests.swift",
    defaultTestCommand: "swift test",
    testInstruction: "Generate Swift XCTest tests."
  },
  rust: {
    label: "Rust",
    extensions: [".rs"],
    testFileName: "agent_generated_tests.rs",
    defaultTestCommand: "cargo test",
    testInstruction: "Generate Rust tests using #[test]. Prefer adding tests compatible with cargo test."
  },
  htmlcss: {
    label: "HTML / CSS",
    extensions: [".html", ".css", ".scss", ".sass"],
    testFileName: "agent-generated-ui-notes.md",
    defaultTestCommand: "npm test",
    testInstruction:
      "For HTML/CSS, generate test guidance or simple DOM/accessibility checks if a JS test framework exists."
  }
};

const ALL_SOURCE_EXTENSIONS = new Set(
  Object.values(LANGUAGE_PROFILES).flatMap((profile) => profile.extensions)
);

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function cleanCodeBlock(text) {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```js\s*/i, "")
    .replace(/^```javascript\s*/i, "")
    .replace(/^```ts\s*/i, "")
    .replace(/^```typescript\s*/i, "")
    .replace(/^```python\s*/i, "")
    .replace(/^```java\s*/i, "")
    .replace(/^```csharp\s*/i, "")
    .replace(/^```go\s*/i, "")
    .replace(/^```php\s*/i, "")
    .replace(/^```ruby\s*/i, "")
    .replace(/^```kotlin\s*/i, "")
    .replace(/^```swift\s*/i, "")
    .replace(/^```rust\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/i, "")
    .trim();
}

function detectLanguageFromFile(file) {
  const ext = path.extname(file);

  for (const [key, profile] of Object.entries(LANGUAGE_PROFILES)) {
    if (profile.extensions.includes(ext)) return key;
  }

  return "unknown";
}

function isDocFile(file) {
  const base = path.basename(file);
  return DOC_FILES.has(base) || base.endsWith(".csproj");
}

function isTestFile(file) {
  const lower = toPosix(file).toLowerCase();

  return (
    lower === "test.js" ||
    lower.includes("__tests__/") ||
    lower.endsWith(".test.js") ||
    lower.endsWith(".spec.js") ||
    lower.endsWith(".test.ts") ||
    lower.endsWith(".spec.ts") ||
    lower.endsWith(".test.tsx") ||
    lower.endsWith(".spec.tsx") ||
    lower.startsWith("test_") ||
    lower.endsWith("_test.py") ||
    lower.includes("/test_") ||
    lower.endsWith("test.java") ||
    lower.endsWith("tests.java") ||
    lower.endsWith("test.cs") ||
    lower.endsWith("tests.cs") ||
    lower.endsWith("_test.go") ||
    lower.endsWith("_test.rb") ||
    lower.endsWith("spec.rb") ||
    lower.endsWith("test.php") ||
    lower.endsWith("test.kt") ||
    lower.endsWith("tests.swift") ||
    lower.endsWith("_test.rs")
  );
}

function isGeneratedArtifact(file) {
  const lower = toPosix(file).toLowerCase();

  return (
    lower === "qa-report.md" ||
    lower === "repository-analysis.md" ||
    lower === "qa-dashboard.json" ||
    lower === "qa-benchmark.json" ||
    lower === "mutation-report.md" ||
    lower.includes(".qa-agent-backups/") ||
    lower.includes(".qa-agent-sandbox/")
  );
}

function isSourceFile(file) {
  return ALL_SOURCE_EXTENSIONS.has(path.extname(file));
}

function safeJoin(base, relativePath) {
  if (path.isAbsolute(relativePath) || relativePath.includes("..")) {
    throw new Error(`Unsafe path rejected: ${relativePath}`);
  }

  return path.join(base, relativePath);
}

function scanFiles(dir) {
  const results = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) walk(fullPath);
        continue;
      }

      const relativePath = toPosix(path.relative(repoPath, fullPath));
      const ext = path.extname(entry.name);

      if (ALL_SOURCE_EXTENSIONS.has(ext) || isDocFile(relativePath)) {
        results.push(relativePath);
      }
    }
  }

  walk(dir);
  return results.sort();
}

function readFileSafe(relativePath) {
  return fs.readFileSync(safeJoin(repoPath, relativePath), "utf8");
}

function stripCommentsAndStrings(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/#.*$/gm, "")
    .replace(/(['"`])(?:\\.|(?!\1)[\s\S])*\1/g, '""');
}

function countLeadingSpaces(line) {
  const match = line.match(/^(\s*)/);
  return match ? match[1].replace(/\t/g, "    ").length : 0;
}

function findMatchingBrace(code, openingBraceIndex) {
  let depth = 0;
  let inString = false;
  let stringChar = "";
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = openingBraceIndex; i < code.length; i++) {
    const char = code[i];
    const next = code[i + 1];

    if (inLineComment) {
      if (char === "\n") inLineComment = false;
      continue;
    }

    if (inBlockComment) {
      if (char === "*" && next === "/") {
        inBlockComment = false;
        i++;
      }
      continue;
    }

    if (inString) {
      if (char === "\\") {
        i++;
        continue;
      }

      if (char === stringChar) {
        inString = false;
        stringChar = "";
      }

      continue;
    }

    if (char === "/" && next === "/") {
      inLineComment = true;
      i++;
      continue;
    }

    if (char === "/" && next === "*") {
      inBlockComment = true;
      i++;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === "{") depth++;

    if (char === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }

  return -1;
}

function findRubyEndIndex(lines, startLineIndex) {
  let depth = 0;

  for (let i = startLineIndex; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    if (/^(def|class|module|if|unless|case|while|until|for|begin|do)\b/.test(trimmed)) {
      depth++;
    }

    if (trimmed === "end") {
      depth--;
      if (depth === 0) return i;
    }
  }

  return lines.length - 1;
}

function extractPythonFunctionDefinitions(code) {
  const definitions = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)def\s+([A-Za-z0-9_]+)\s*\(/);

    if (!match) continue;

    const indent = countLeadingSpaces(match[1]);
    const name = match[2];
    const bodyLines = [];

    for (let j = i + 1; j < lines.length; j++) {
      const currentLine = lines[j];
      const trimmed = currentLine.trim();

      if (trimmed === "") {
        bodyLines.push(currentLine);
        continue;
      }

      const currentIndent = countLeadingSpaces(currentLine);
      if (currentIndent <= indent) break;

      bodyLines.push(currentLine);
    }

    definitions.push({
      name,
      type: "python-function",
      startLine: i + 1,
      body: bodyLines.join("\n")
    });
  }

  return definitions;
}

function extractRubyFunctionDefinitions(code) {
  const definitions = [];
  const lines = code.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(/^\s*def\s+([A-Za-z0-9_!?=]+)/);

    if (!match) continue;

    const name = match[1];
    const endIndex = findRubyEndIndex(lines, i);

    definitions.push({
      name,
      type: "ruby-function",
      startLine: i + 1,
      body: lines.slice(i + 1, endIndex).join("\n")
    });
  }

  return definitions;
}

function extractBraceLanguageFunctionDefinitions(code, language) {
  const definitions = [];

  const regexByLanguage = {
    java: /\b(?:public|private|protected)?\s*(?:static\s+)?[A-Za-z0-9_<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:throws\s+[A-Za-z0-9_,\s]+)?\s*{/g,
    csharp: /\b(?:public|private|protected|internal)?\s*(?:static\s+)?[A-Za-z0-9_<>,\[\]\?]+\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/g,
    go: /\bfunc\s+(?:\([^)]+\)\s*)?([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:[A-Za-z0-9_\*\[\]\.]+)?\s*{/g,
    php: /\bfunction\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*{/g,
    kotlin: /\bfun\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?::\s*[A-Za-z0-9_<>,\?\s]+)?\s*{/g,
    swift: /\bfunc\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:->\s*[A-Za-z0-9_<>,\?\s]+)?\s*{/g,
    rust: /\b(?:pub\s+)?fn\s+([A-Za-z0-9_]+)\s*\([^)]*\)\s*(?:->\s*[A-Za-z0-9_<>,:&\s]+)?\s*{/g
  };

  const regex = regexByLanguage[language];
  if (!regex) return definitions;

  let match;

  while ((match = regex.exec(code)) !== null) {
    const name = match[1];
    const openingBraceIndex = code.indexOf("{", match.index);
    const closingBraceIndex = findMatchingBrace(code, openingBraceIndex);

    if (closingBraceIndex !== -1) {
      definitions.push({
        name,
        type: `${language}-function`,
        startLine: code.slice(0, match.index).split("\n").length,
        body: code.slice(openingBraceIndex + 1, closingBraceIndex)
      });
    }
  }

  return definitions;
}

function extractJavaScriptOrTypeScriptFunctionDefinitions(code) {
  const definitions = [];

  const normalFunctionRegex =
    /(export\s+)?function\s+([A-Za-z0-9_$]+)\s*\([^)]*\)\s*{/g;

  let match;

  while ((match = normalFunctionRegex.exec(code)) !== null) {
    const name = match[2];
    const openingBraceIndex = code.indexOf("{", match.index);
    const closingBraceIndex = findMatchingBrace(code, openingBraceIndex);

    if (closingBraceIndex !== -1) {
      definitions.push({
        name,
        type: "function",
        startLine: code.slice(0, match.index).split("\n").length,
        body: code.slice(openingBraceIndex + 1, closingBraceIndex)
      });
    }
  }

  const arrowFunctionRegex =
    /(export\s+)?(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z0-9_$]+)\s*=>/g;

  while ((match = arrowFunctionRegex.exec(code)) !== null) {
    const name = match[2];
    const afterArrowIndex = arrowFunctionRegex.lastIndex;
    const remaining = code.slice(afterArrowIndex).trimStart();
    const offset =
      afterArrowIndex + (code.slice(afterArrowIndex).length - remaining.length);

    if (remaining.startsWith("{")) {
      const openingBraceIndex = offset;
      const closingBraceIndex = findMatchingBrace(code, openingBraceIndex);

      if (closingBraceIndex !== -1) {
        definitions.push({
          name,
          type: "arrow-block",
          startLine: code.slice(0, match.index).split("\n").length,
          body: code.slice(openingBraceIndex + 1, closingBraceIndex)
        });
      }
    } else {
      const semicolonIndex = code.indexOf(";", offset);
      const newlineIndex = code.indexOf("\n", offset);
      const endCandidates = [semicolonIndex, newlineIndex].filter((x) => x !== -1);
      const endIndex =
        endCandidates.length > 0 ? Math.min(...endCandidates) : code.length;

      definitions.push({
        name,
        type: "arrow-expression",
        startLine: code.slice(0, match.index).split("\n").length,
        body: code.slice(offset, endIndex)
      });
    }
  }

  return definitions;
}

function extractFunctionDefinitions(code, language) {
  if (language === "javascript" || language === "typescript") {
    return extractJavaScriptOrTypeScriptFunctionDefinitions(code);
  }

  if (language === "python") return extractPythonFunctionDefinitions(code);
  if (language === "ruby") return extractRubyFunctionDefinitions(code);

  if (["java", "csharp", "go", "php", "kotlin", "swift", "rust"].includes(language)) {
    return extractBraceLanguageFunctionDefinitions(code, language);
  }

  return [];
}

function extractFunctionCallsFromDefinitions(definitions, knownFunctionNames) {
  const calls = {};

  for (const def of definitions) {
    calls[def.name] = [];

    const safeBody = stripCommentsAndStrings(def.body);

    for (const possibleCall of knownFunctionNames) {
      if (possibleCall === def.name) continue;

      const callRegex = new RegExp(`\\b${possibleCall}\\s*\\(`, "g");

      if (callRegex.test(safeBody)) {
        calls[def.name].push(possibleCall);
      }
    }
  }

  return calls;
}

function extractImportsGeneric(code, language) {
  const imports = [];

  const regexesByLanguage = {
    javascript: [
      /import\s+(?:[^'"]+\s+from\s+)?["'](.+?)["']/g,
      /import\(["'](.+?)["']\)/g,
      /require\(["'](.+?)["']\)/g
    ],
    typescript: [
      /import\s+(?:[^'"]+\s+from\s+)?["'](.+?)["']/g,
      /import\(["'](.+?)["']\)/g
    ],
    python: [
      /^\s*import\s+([A-Za-z0-9_.,\s]+)/gm,
      /^\s*from\s+([A-Za-z0-9_.]+)\s+import\s+/gm
    ],
    java: [/^\s*import\s+([A-Za-z0-9_.]+);/gm],
    csharp: [/^\s*using\s+([A-Za-z0-9_.]+);/gm],
    go: [/import\s+(?:\(\s*([\s\S]*?)\s*\)|"([^"]+)")/g],
    php: [/^\s*use\s+([A-Za-z0-9_\\]+);/gm, /require_once\s+['"](.+?)['"]/g],
    ruby: [/^\s*require(?:_relative)?\s+['"](.+?)['"]/gm],
    kotlin: [/^\s*import\s+([A-Za-z0-9_.]+)$/gm],
    swift: [/^\s*import\s+([A-Za-z0-9_]+)$/gm],
    rust: [/^\s*use\s+([A-Za-z0-9_:]+);/gm, /^\s*mod\s+([A-Za-z0-9_]+);/gm],
    htmlcss: [/<script[^>]+src=["'](.+?)["']/g, /@import\s+["'](.+?)["']/g]
  };

  const regexes = regexesByLanguage[language] || [];

  for (const regex of regexes) {
    let match;
    while ((match = regex.exec(code)) !== null) {
      if (language === "go" && match[1]) {
        const blockImports = match[1]
          .split("\n")
          .map((line) => line.trim().replace(/"/g, ""))
          .filter(Boolean);
        imports.push(...blockImports);
      } else {
        imports.push(match[1] || match[2]);
      }
    }
  }

  return [...new Set(imports.filter(Boolean).map((x) => x.trim()))];
}

function extractExportsGeneric(code, language) {
  const exports = [];

  const regexesByLanguage = {
    javascript: [
      /export\s+function\s+([A-Za-z0-9_$]+)/g,
      /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g,
      /export\s+class\s+([A-Za-z0-9_$]+)/g,
      /export\s*{\s*([^}]+)\s*}/g
    ],
    typescript: [
      /export\s+function\s+([A-Za-z0-9_$]+)/g,
      /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)/g,
      /export\s+class\s+([A-Za-z0-9_$]+)/g,
      /export\s+interface\s+([A-Za-z0-9_$]+)/g,
      /export\s+type\s+([A-Za-z0-9_$]+)/g,
      /export\s*{\s*([^}]+)\s*}/g
    ],
    python: [
      /^\s*def\s+([A-Za-z0-9_]+)\s*\(/gm,
      /^\s*class\s+([A-Za-z0-9_]+)\s*[:(]/gm
    ],
    java: [
      /\bpublic\s+(?:class|interface|enum)\s+([A-Za-z0-9_]+)/g,
      /\bpublic\s+(?:static\s+)?[A-Za-z0-9_<>,\[\]]+\s+([A-Za-z0-9_]+)\s*\(/g
    ],
    csharp: [
      /\bpublic\s+(?:class|interface|enum|struct)\s+([A-Za-z0-9_]+)/g,
      /\bpublic\s+(?:static\s+)?[A-Za-z0-9_<>,\[\]\?]+\s+([A-Za-z0-9_]+)\s*\(/g
    ],
    go: [
      /\bfunc\s+([A-Z][A-Za-z0-9_]*)\s*\(/g,
      /\btype\s+([A-Z][A-Za-z0-9_]*)\s+/g
    ],
    php: [/\bfunction\s+([A-Za-z0-9_]+)\s*\(/g, /\bclass\s+([A-Za-z0-9_]+)/g],
    ruby: [/^\s*def\s+([A-Za-z0-9_!?=]+)\s*/gm, /^\s*class\s+([A-Za-z0-9_:]+)\s*/gm],
    kotlin: [/\bfun\s+([A-Za-z0-9_]+)\s*\(/g, /\bclass\s+([A-Za-z0-9_]+)/g],
    swift: [
      /\bfunc\s+([A-Za-z0-9_]+)\s*\(/g,
      /\bclass\s+([A-Za-z0-9_]+)/g,
      /\bstruct\s+([A-Za-z0-9_]+)/g
    ],
    rust: [/\bpub\s+fn\s+([A-Za-z0-9_]+)\s*\(/g, /\bpub\s+struct\s+([A-Za-z0-9_]+)/g],
    htmlcss: []
  };

  for (const regex of regexesByLanguage[language] || []) {
    let match;
    while ((match = regex.exec(code)) !== null) {
      if (match[1]?.includes(",")) {
        const names = match[1]
          .split(",")
          .map((x) => x.trim().split(/\s+as\s+/i).pop().trim())
          .filter(Boolean);
        exports.push(...names);
      } else {
        exports.push(match[1]);
      }
    }
  }

  if (
    (language === "javascript" || language === "typescript") &&
    /export\s+default\s+/g.test(code)
  ) {
    exports.push("default");
  }

  return [...new Set(exports.filter(Boolean))];
}

function countMatches(text, regex) {
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

function extractConditionSnippets(body, language) {
  const snippets = [];
  const patterns = [
    /\bif\s*\(([^)]*)\)/g,
    /\belse\s+if\s*\(([^)]*)\)/g,
    /\bwhile\s*\(([^)]*)\)/g,
    /\bfor\s*\(([^)]*)\)/g,
    /\bcatch\s*\(([^)]*)\)/g,
    /^\s*if\s+(.+):/gm,
    /^\s*elif\s+(.+):/gm,
    /^\s*while\s+(.+):/gm,
    /^\s*for\s+(.+):/gm,
    /^\s*except\s+(.+):/gm,
    /\bwhen\s*\(([^)]*)\)/g,
    /\bguard\s+(.+)\s+else/g,
    /\bmatch\s+(.+)\s*{/g,
    /\bcase\s+([^:]+):/g
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(body)) !== null) {
      snippets.push(match[1].trim());
    }
  }

  return [...new Set(snippets.filter(Boolean))];
}

function extractBranchInventory(body, language) {
  const safeBody = stripCommentsAndStrings(body);

  return {
    ifCount: countMatches(safeBody, /\bif\b/g),
    elseIfCount: countMatches(safeBody, /\belse\s+if\b|\belif\b/g),
    elseCount: countMatches(safeBody, /\belse\b/g),
    switchOrMatchCount: countMatches(safeBody, /\bswitch\b|\bmatch\b|\bwhen\b/g),
    caseCount: countMatches(safeBody, /\bcase\b/g),
    ternaryCount: countMatches(safeBody, /\?/g),
    booleanAndCount: countMatches(safeBody, /&&|\band\b|&\&/g),
    booleanOrCount: countMatches(safeBody, /\|\||\bor\b/g),
    conditions: extractConditionSnippets(safeBody, language)
  };
}

function extractLoopInventory(body) {
  const safeBody = stripCommentsAndStrings(body);

  return {
    forCount: countMatches(safeBody, /\bfor\b/g),
    whileCount: countMatches(safeBody, /\bwhile\b/g),
    doWhileCount: countMatches(safeBody, /\bdo\b/g),
    foreachCount: countMatches(safeBody, /\bforeach\b/g),
    mapFilterReduceCount: countMatches(safeBody, /\.map\s*\(|\.filter\s*\(|\.reduce\s*\(/g)
  };
}

function extractExceptionInventory(body) {
  const safeBody = stripCommentsAndStrings(body);

  return {
    throwCount: countMatches(safeBody, /\bthrow\b/g),
    raiseCount: countMatches(safeBody, /\braise\b/g),
    tryCount: countMatches(safeBody, /\btry\b/g),
    catchCount: countMatches(safeBody, /\bcatch\b|\bexcept\b/g),
    finallyCount: countMatches(safeBody, /\bfinally\b/g)
  };
}

function estimateCyclomaticComplexity(branches, loops, exceptions) {
  return (
    1 +
    branches.ifCount +
    branches.elseIfCount +
    branches.caseCount +
    branches.ternaryCount +
    branches.booleanAndCount +
    branches.booleanOrCount +
    branches.switchOrMatchCount +
    loops.forCount +
    loops.whileCount +
    loops.doWhileCount +
    loops.foreachCount +
    exceptions.catchCount
  );
}

function buildLikelyTestTargets(def, language, branches, loops, exceptions) {
  const targets = [];

  for (const condition of branches.conditions) {
    targets.push({
      type: "condition",
      function: def.name,
      target: condition,
      suggestion: `Cover true and false outcomes for condition: ${condition}`
    });
  }

  if (loops.forCount || loops.whileCount || loops.foreachCount || loops.mapFilterReduceCount) {
    targets.push({
      type: "loop",
      function: def.name,
      target: "loop behaviour",
      suggestion: "Cover empty input, single item, multiple items, and boundary cases."
    });
  }

  if (exceptions.throwCount || exceptions.raiseCount) {
    targets.push({
      type: "exception",
      function: def.name,
      target: "exception path",
      suggestion: "Cover invalid input path and verify exception type/message where specified."
    });
  }

  if (exceptions.tryCount || exceptions.catchCount) {
    targets.push({
      type: "error-handling",
      function: def.name,
      target: "try/catch or try/except path",
      suggestion: "Cover success path and handled failure path."
    });
  }

  const lowered = def.name.toLowerCase();

  if (lowered.includes("divide")) {
    targets.push({
      type: "domain-edge-case",
      function: def.name,
      target: "division by zero",
      suggestion: "Cover zero divisor and non-zero divisor behaviour."
    });
  }

  if (lowered.includes("subtract")) {
    targets.push({
      type: "domain-edge-case",
      function: def.name,
      target: "operand order",
      suggestion: "Cover non-commutative operand order, including a > b and a < b."
    });
  }

  if (lowered.includes("factorial")) {
    targets.push({
      type: "domain-edge-case",
      function: def.name,
      target: "factorial boundaries",
      suggestion: "Cover 0, 1, positive value, and negative invalid input."
    });
  }

  return targets;
}

function analyseFunctionMetrics(def, language) {
  const branches = extractBranchInventory(def.body, language);
  const loops = extractLoopInventory(def.body);
  const exceptions = extractExceptionInventory(def.body);
  const safeBody = stripCommentsAndStrings(def.body);

  return {
    name: def.name,
    type: def.type,
    startLine: def.startLine || null,
    cyclomaticComplexity: estimateCyclomaticComplexity(branches, loops, exceptions),
    branches,
    loops,
    exceptions,
    recursion: new RegExp(`\\b${def.name}\\s*\\(`).test(safeBody),
    hasReturn: /\breturn\b/.test(safeBody),
    likelyTestTargets: buildLikelyTestTargets(def, language, branches, loops, exceptions)
  };
}

function detectExistingTestIntents(testFiles) {
  const intents = [];

  for (const file of testFiles) {
    if (!fs.existsSync(path.join(repoPath, file))) continue;

    const code = readFileSafe(file);
    const testNamePatterns = [
      /test\s*\(\s*["'`](.*?)["'`]/g,
      /it\s*\(\s*["'`](.*?)["'`]/g,
      /def\s+(test_[A-Za-z0-9_]+)/g,
      /function\s+(test[A-Za-z0-9_]+)/g,
      /\bvoid\s+(Test[A-Za-z0-9_]+)\s*\(/g,
      /\bfunc\s+Test([A-Za-z0-9_]+)\s*\(/g
    ];

    for (const pattern of testNamePatterns) {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        intents.push({
          file,
          name: match[1],
          normalised: match[1].toLowerCase().replace(/[^a-z0-9]+/g, " ").trim()
        });
      }
    }
  }

  return intents;
}

function buildDeterministicAnalysis(rawModules, testFiles) {
  const functionMetrics = [];

  for (const mod of rawModules) {
    const metrics = mod.functionDefinitions.map((def) =>
      analyseFunctionMetrics(def, mod.language)
    );

    functionMetrics.push({
      file: mod.file,
      language: mod.language,
      publicApi: [...new Set([...(mod.exports || []), ...(mod.functions || [])])],
      functions: metrics
    });
  }

  const allTargets = functionMetrics.flatMap((fileMetric) =>
    fileMetric.functions.flatMap((fn) =>
      fn.likelyTestTargets.map((target) => ({
        file: fileMetric.file,
        language: fileMetric.language,
        function: fn.name,
        ...target
      }))
    )
  );

  const existingTestIntents = detectExistingTestIntents(testFiles);

  return {
    summary: {
      totalFunctions: functionMetrics.reduce((sum, file) => sum + file.functions.length, 0),
      highComplexityFunctions: functionMetrics
        .flatMap((file) =>
          file.functions
            .filter((fn) => fn.cyclomaticComplexity >= 4)
            .map((fn) => ({
              file: file.file,
              function: fn.name,
              cyclomaticComplexity: fn.cyclomaticComplexity
            }))
        ),
      totalCoverageTargets: allTargets.length,
      existingTestIntentCount: existingTestIntents.length
    },
    files: functionMetrics,
    coverageTargets: allTargets,
    existingTestIntents
  };
}

function resolveImport(fromFile, importPath) {
  if (!importPath.startsWith(".")) return null;

  const fromDir = path.dirname(fromFile);
  const candidateBase = toPosix(path.normalize(path.join(fromDir, importPath)));

  const candidates = [
    candidateBase,
    `${candidateBase}.js`,
    `${candidateBase}.mjs`,
    `${candidateBase}.cjs`,
    `${candidateBase}.ts`,
    `${candidateBase}.tsx`,
    `${candidateBase}.py`,
    `${candidateBase}.go`,
    `${candidateBase}.php`,
    `${candidateBase}.rb`,
    `${candidateBase}.rs`,
    `${candidateBase}/index.js`,
    `${candidateBase}/index.mjs`,
    `${candidateBase}/index.ts`,
    `${candidateBase}/index.tsx`
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(repoPath, candidate))) return candidate;
  }

  return candidateBase;
}

function detectProjectType(allFiles) {
  const has = (file) => allFiles.includes(file);
  const hasExt = (ext) => allFiles.some((file) => file.endsWith(ext));
  const packageJson = has("package.json") ? readFileSafe("package.json") : "";

  const projectTypes = [];

  if (
    packageJson.includes("react") ||
    allFiles.some((f) => f.endsWith(".tsx") || f.endsWith(".jsx"))
  ) {
    projectTypes.push("React frontend");
  }

  if (packageJson.includes("next")) projectTypes.push("Next.js frontend/backend");
  if (packageJson.includes("express")) projectTypes.push("Node/Express backend");
  if (has("requirements.txt") || has("pyproject.toml") || hasExt(".py")) projectTypes.push("Python");
  if (has("pom.xml")) projectTypes.push("Java Maven");
  if (has("build.gradle") || has("build.gradle.kts")) projectTypes.push("Java/Kotlin Gradle");
  if (allFiles.some((f) => f.endsWith(".csproj"))) projectTypes.push(".NET / C#");
  if (has("go.mod")) projectTypes.push("Go module");
  if (has("composer.json")) projectTypes.push("PHP Composer");
  if (has("Gemfile")) projectTypes.push("Ruby");
  if (has("Cargo.toml")) projectTypes.push("Rust Cargo");
  if (has("Package.swift")) projectTypes.push("Swift Package");

  return projectTypes.length > 0 ? projectTypes : ["Unknown / generic source project"];
}

function detectPrimaryLanguage(languageCounts) {
  const entries = Object.entries(languageCounts).filter(([, count]) => count > 0);

  if (entries.length === 0) return "unknown";

  entries.sort((a, b) => b[1] - a[1]);
  return entries[0][0];
}

function detectTestCommand(allFiles, primaryLanguage) {
  const packageJsonPath = path.join(repoPath, "package.json");

  if (fs.existsSync(packageJsonPath)) {
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
      if (packageJson.scripts?.test) return "npm test";
    } catch {}
  }

  if (allFiles.includes("pyproject.toml") || allFiles.includes("requirements.txt")) {
    return "python -m pytest";
  }

  if (allFiles.includes("pom.xml")) return "mvn test";
  if (allFiles.includes("build.gradle") || allFiles.includes("build.gradle.kts")) return "./gradlew test";
  if (allFiles.some((file) => file.endsWith(".csproj"))) return "dotnet test";
  if (allFiles.includes("go.mod")) return "go test ./...";
  if (allFiles.includes("composer.json")) return "vendor/bin/phpunit";
  if (allFiles.includes("Gemfile")) return "bundle exec rspec";
  if (allFiles.includes("Cargo.toml")) return "cargo test";
  if (allFiles.includes("Package.swift")) return "swift test";

  return LANGUAGE_PROFILES[primaryLanguage]?.defaultTestCommand || "npm test";
}

function testFileNameForLanguage(primaryLanguage) {
  return LANGUAGE_PROFILES[primaryLanguage]?.testFileName || "agent-generated-test.txt";
}

function getGitInfo(sourceFiles) {
  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      cwd: repoPath,
      encoding: "utf8"
    }).trim();

    const statusOutput = execSync("git status --porcelain", {
      cwd: gitRoot,
      encoding: "utf8"
    });

    const changedRepoRelativeFiles = statusOutput
      .split("\n")
      .map((line) => line.trimEnd())
      .filter(Boolean)
      .map((line) => {
        let filePath = line.slice(3).trim();

        if (filePath.includes(" -> ")) {
          filePath = filePath.split(" -> ").pop().trim();
        }

        return toPosix(filePath);
      });

    const changedSourceFiles = [];

    for (const gitRelativeFile of changedRepoRelativeFiles) {
      const absoluteChangedFile = path.join(gitRoot, gitRelativeFile);
      const relativeToTargetRepo = toPosix(path.relative(repoPath, absoluteChangedFile));

      if (
        !relativeToTargetRepo.startsWith("..") &&
        !path.isAbsolute(relativeToTargetRepo) &&
        sourceFiles.includes(relativeToTargetRepo) &&
        !isTestFile(relativeToTargetRepo) &&
        !isGeneratedArtifact(relativeToTargetRepo)
      ) {
        changedSourceFiles.push(relativeToTargetRepo);
      }
    }

    return {
      available: true,
      gitRoot: toPosix(gitRoot),
      changedFiles: changedRepoRelativeFiles,
      changedSourceFiles: [...new Set(changedSourceFiles)].sort()
    };
  } catch {
    return {
      available: false,
      gitRoot: null,
      changedFiles: [],
      changedSourceFiles: []
    };
  }
}

function analyseRepository() {
  const allFiles = scanFiles(repoPath);
  const sourceFiles = allFiles.filter((file) =>
    ALL_SOURCE_EXTENSIONS.has(path.extname(file))
  );
  const docFiles = allFiles.filter((file) => isDocFile(file));
  const testFiles = sourceFiles.filter(isTestFile);

  const languageCounts = {};

  for (const key of Object.keys(LANGUAGE_PROFILES)) {
    languageCounts[key] = 0;
  }

  for (const file of sourceFiles) {
    const lang = detectLanguageFromFile(file);
    if (languageCounts[lang] !== undefined) languageCounts[lang]++;
  }

  const primaryLanguage = detectPrimaryLanguage(languageCounts);
  const projectTypes = detectProjectType(allFiles);
  const testCommand = detectTestCommand(allFiles, primaryLanguage);

  const rawModules = [];

  for (const file of sourceFiles) {
    if (isTestFile(file)) continue;

    const language = detectLanguageFromFile(file);
    const code = readFileSafe(file);
    const functionDefinitions = extractFunctionDefinitions(code, language);

    rawModules.push({
      file,
      language,
      code,
      imports: extractImportsGeneric(code, language),
      exports: extractExportsGeneric(code, language),
      functions: functionDefinitions.map((fn) => fn.name),
      functionDefinitions
    });
  }

  const deterministicAnalysis = buildDeterministicAnalysis(rawModules, testFiles);

  const allKnownFunctions = [
    ...new Set(rawModules.flatMap((mod) => mod.functions))
  ];

  const modules = rawModules.map((mod) => {
    const imports = mod.imports.map((imp) => ({
      raw: imp,
      resolved: resolveImport(mod.file, imp)
    }));

    return {
      file: mod.file,
      language: mod.language,
      imports,
      exports: mod.exports,
      functions: mod.functions,
      deterministicMetrics:
        deterministicAnalysis.files.find((fileMetric) => fileMetric.file === mod.file) || null,
      functionCalls: extractFunctionCallsFromDefinitions(
        mod.functionDefinitions,
        allKnownFunctions
      )
    };
  });

  const importedFiles = new Set();

  for (const mod of modules) {
    for (const imp of mod.imports) {
      if (imp.resolved) importedFiles.add(imp.resolved);
    }
  }

  const reverseDependencies = {};

  for (const mod of modules) reverseDependencies[mod.file] = [];

  for (const mod of modules) {
    for (const imp of mod.imports) {
      if (imp.resolved && reverseDependencies[imp.resolved]) {
        reverseDependencies[imp.resolved].push(mod.file);
      }
    }
  }

  const functionToFile = {};

  for (const mod of modules) {
    for (const fn of mod.functions) functionToFile[fn] = mod.file;
  }

  const callGraph = [];

  for (const mod of modules) {
    for (const [caller, callees] of Object.entries(mod.functionCalls)) {
      for (const callee of callees) {
        callGraph.push({
          caller,
          callerFile: mod.file,
          callee,
          calleeFile: functionToFile[callee] || "unknown"
        });
      }
    }
  }

  const entryPoints = modules
    .filter((mod) => mod.exports.length > 0 || mod.functions.length > 0)
    .map((mod) => ({
      file: mod.file,
      language: mod.language,
      exports: mod.exports,
      functions: mod.functions,
      isTopLevel: !importedFiles.has(mod.file),
      imports: mod.imports.map((x) => x.resolved).filter(Boolean),
      importedBy: reverseDependencies[mod.file] || []
    }));

  const git = getGitInfo(sourceFiles.filter((file) => !isTestFile(file)));

  return {
    language: LANGUAGE_PROFILES[primaryLanguage]?.label || "Unknown",
    primaryLanguage,
    languageCounts,
    projectTypes,
    testCommand,
    generatedTestFile: testFileNameForLanguage(primaryLanguage),
    deterministicAnalysis,
    files: {
      docs: docFiles,
      source: sourceFiles.filter((file) => !isTestFile(file)),
      tests: testFiles
    },
    git,
    modules,
    dependencyGraph: modules.map((mod) => ({
      file: mod.file,
      language: mod.language,
      imports: mod.imports
    })),
    reverseDependencies,
    callGraph,
    entryPoints,
    importedFiles: [...importedFiles].sort()
  };
}

function findModule(repoAnalysis, file) {
  return repoAnalysis.modules.find((mod) => mod.file === file);
}

function getImportClosure(repoAnalysis, startFiles) {
  const visited = new Set();
  const stack = [...startFiles];

  while (stack.length > 0) {
    const file = stack.pop();
    if (!file || visited.has(file)) continue;

    visited.add(file);

    const mod = findModule(repoAnalysis, file);
    if (!mod) continue;

    for (const imp of mod.imports) {
      if (imp.resolved && !visited.has(imp.resolved)) {
        stack.push(imp.resolved);
      }
    }
  }

  return [...visited].sort();
}

function getCallerClosure(repoAnalysis, startFiles, depth = 2) {
  const callers = new Set();
  let current = new Set(startFiles);

  for (let i = 0; i < depth; i++) {
    const next = new Set();

    for (const file of current) {
      const directCallers = repoAnalysis.reverseDependencies[file] || [];

      for (const caller of directCallers) {
        if (!callers.has(caller)) {
          callers.add(caller);
          next.add(caller);
        }
      }
    }

    current = next;
  }

  return [...callers].sort();
}

function getCallGraphRelatedFiles(repoAnalysis, startFiles) {
  const related = new Set();

  for (const edge of repoAnalysis.callGraph) {
    if (startFiles.includes(edge.callerFile) || startFiles.includes(edge.calleeFile)) {
      related.add(edge.callerFile);
      related.add(edge.calleeFile);
    }
  }

  return [...related].sort();
}

function activateAutoChangedModeIfUseful(repoAnalysis) {
  if (
    !fullScanMode &&
    !targetFile &&
    !requestedChangedMode &&
    repoAnalysis.git.available &&
    repoAnalysis.git.changedSourceFiles.length > 0
  ) {
    activeChangedMode = true;
    autoChangedMode = true;
  }
}

function chooseTargetFiles(repoAnalysis) {
  if (targetFile && requestedChangedMode) {
    console.log("❌ Use either --target or --changed, not both.");
    process.exit(1);
  }

  if (targetFile) {
    const normalisedTarget = toPosix(targetFile);

    if (!repoAnalysis.files.source.includes(normalisedTarget)) {
      console.log(`❌ Target file not found in source files: ${normalisedTarget}`);
      process.exit(1);
    }

    return [normalisedTarget];
  }

  if (activeChangedMode) {
    if (!repoAnalysis.git.available) {
      console.log("ℹ️ Git is not available. Falling back to full focused scan.");
      activeChangedMode = false;
    } else if (repoAnalysis.git.changedSourceFiles.length === 0) {
      if (requestedChangedMode) {
        console.log("❌ No changed source files found inside target project.");
        console.log("Run git status to confirm changed files.");
        process.exit(1);
      }

      activeChangedMode = false;
      autoChangedMode = false;
    } else {
      return repoAnalysis.git.changedSourceFiles;
    }
  }

  const topLevelEntryFiles = repoAnalysis.entryPoints
    .filter((entry) => entry.isTopLevel)
    .map((entry) => entry.file);

  if (topLevelEntryFiles.length > 0) return topLevelEntryFiles;

  return repoAnalysis.entryPoints.map((entry) => entry.file);
}

function filterDeterministicAnalysisForFocusedFiles(repoAnalysis, focusedFiles) {
  const focusedSet = new Set(focusedFiles);

  return {
    ...repoAnalysis.deterministicAnalysis,
    files: repoAnalysis.deterministicAnalysis.files.filter((file) =>
      focusedSet.has(file.file)
    ),
    coverageTargets: repoAnalysis.deterministicAnalysis.coverageTargets.filter((target) =>
      focusedSet.has(target.file)
    )
  };
}

function buildFocusedContext(repoAnalysis) {
  activateAutoChangedModeIfUseful(repoAnalysis);

  const targetFiles = chooseTargetFiles(repoAnalysis);
  const dependencyFiles = getImportClosure(repoAnalysis, targetFiles);
  const callerFiles = getCallerClosure(repoAnalysis, targetFiles, 2);
  const callGraphRelatedFiles = getCallGraphRelatedFiles(repoAnalysis, [
    ...targetFiles,
    ...dependencyFiles,
    ...callerFiles
  ]);

  const focusedFiles = [
    ...new Set([
      ...repoAnalysis.files.docs,
      ...targetFiles,
      ...dependencyFiles,
      ...callerFiles,
      ...callGraphRelatedFiles,
      ...repoAnalysis.files.tests
    ])
  ].filter((file) => fs.existsSync(path.join(repoPath, file)));

  const focusedDeterministicAnalysis =
    filterDeterministicAnalysisForFocusedFiles(repoAnalysis, focusedFiles);

  const focusedModel = {
    mode: activeChangedMode
      ? autoChangedMode
        ? "auto git-changed multi-language focused context with deterministic analysis"
        : "git-changed multi-language focused context with deterministic analysis"
      : repoAnalysis.git.available
        ? "git detected but no changed source files; full multi-language focused context with deterministic analysis"
        : "no git detected; full multi-language focused context with deterministic analysis",
    targetSelection: activeChangedMode
      ? autoChangedMode
        ? "auto git changed files"
        : "git changed files"
      : targetFile
        ? "manual target"
        : "top-level entry points",
    targetFiles,
    dependencyFiles,
    callerFiles,
    callGraphRelatedFiles,
    existingTests: repoAnalysis.files.tests,
    focusedFiles,
    deterministicAnalysis: focusedDeterministicAnalysis
  };

  let context = "";

  context += "\n\n===== REPOSITORY ANALYSIS =====\n";
  context += JSON.stringify(repoAnalysis, null, 2);

  context += "\n\n===== FOCUSED CONTEXT MODEL =====\n";
  context += JSON.stringify(focusedModel, null, 2);

  context += "\n\n===== DETERMINISTIC TEST TARGETS =====\n";
  context += JSON.stringify(focusedDeterministicAnalysis, null, 2);

  for (const file of focusedFiles) {
    context += `\n\n===== ${file} =====\n`;
    context += readFileSafe(file);
  }

  return { projectContext: context, focusedModel };
}

function runCommand(command, cwd = repoPath) {
  const startedAt = Date.now();

  try {
    const output = execSync(command, {
      cwd,
      encoding: "utf8",
      stdio: "pipe"
    });

    return {
      passed: true,
      command,
      durationMs: Date.now() - startedAt,
      output
    };
  } catch (err) {
    return {
      passed: false,
      command,
      durationMs: Date.now() - startedAt,
      output: `
STDOUT:
${err.stdout || ""}

STDERR:
${err.stderr || ""}

ERROR:
${err.message}
`
    };
  }
}

function runTests(repoAnalysis) {
  return runCommand(repoAnalysis.testCommand);
}

function createBackup(files) {
  const backupRoot = path.join(repoPath, ".qa-agent-backups", nowStamp());
  fs.mkdirSync(backupRoot, { recursive: true });

  const backedUp = [];

  for (const file of files) {
    const absolutePath = safeJoin(repoPath, file);
    if (!fs.existsSync(absolutePath)) continue;

    const backupPath = path.join(backupRoot, file);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.copyFileSync(absolutePath, backupPath);

    backedUp.push({
      file,
      backupPath: toPosix(path.relative(repoPath, backupPath))
    });
  }

  return {
    backupRoot: toPosix(path.relative(repoPath, backupRoot)),
    files: backedUp
  };
}



function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDashboardValue(value) {
  if (value === null || value === undefined) return "Not available";
  if (Array.isArray(value)) return value.length === 0 ? "None" : value.join(", ");
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

function writeHtmlDashboard(dashboard) {
  const status = dashboard.testResult
    ? dashboard.testResult.passed
      ? "PASS"
      : "FAIL"
    : "NOT RUN";

  const statusClass =
    status === "PASS" ? "pass" : status === "FAIL" ? "fail" : "neutral";

  const changedSourceFiles = dashboard.git?.changedSourceFiles || [];
  const focusedFiles = dashboard.focusedModel?.focusedFiles || [];
  const targetFiles = dashboard.focusedModel?.targetFiles || [];
  const highComplexity =
    dashboard.deterministicSummary?.highComplexityFunctions || [];

  const mutationScore =
    dashboard.mutationResult?.mutationScore === null ||
    dashboard.mutationResult?.mutationScore === undefined
      ? "Not run"
      : `${dashboard.mutationResult.mutationScore}%`;

  const mutationStatus = dashboard.mutationResult
    ? `${dashboard.mutationResult.killed}/${dashboard.mutationResult.candidatesExecuted} killed`
    : "Not run";

  const testDuration =
    dashboard.testResult?.durationMs !== undefined
      ? `${dashboard.testResult.durationMs} ms`
      : "Not run";

  const listItems = (items) =>
    items.length === 0
      ? `<li class="muted">None</li>`
      : items.map((item) => `<li>${escapeHtml(item)}</li>`).join("");

  const highComplexityRows =
    highComplexity.length === 0
      ? `<tr><td colspan="3" class="muted">None</td></tr>`
      : highComplexity
          .map(
            (item) => `
              <tr>
                <td>${escapeHtml(item.file)}</td>
                <td>${escapeHtml(item.function)}</td>
                <td>${escapeHtml(item.cyclomaticComplexity)}</td>
              </tr>
            `
          )
          .join("");

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>QA Agent Dashboard</title>
  <style>
    :root {
      --bg: #0f172a;
      --panel: rgba(15, 23, 42, 0.86);
      --panel-strong: rgba(30, 41, 59, 0.94);
      --border: rgba(148, 163, 184, 0.24);
      --text: #e5e7eb;
      --muted: #94a3b8;
      --pass: #22c55e;
      --fail: #ef4444;
      --neutral: #f59e0b;
      --accent: #38bdf8;
      --purple: #a78bfa;
      --shadow: 0 24px 80px rgba(0, 0, 0, 0.35);
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      min-height: 100vh;
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background:
        radial-gradient(circle at top left, rgba(56, 189, 248, 0.18), transparent 34rem),
        radial-gradient(circle at top right, rgba(167, 139, 250, 0.16), transparent 32rem),
        linear-gradient(135deg, #020617 0%, var(--bg) 48%, #111827 100%);
      color: var(--text);
      padding: 32px;
    }

    .page {
      max-width: 1180px;
      margin: 0 auto;
    }

    .hero {
      display: flex;
      justify-content: space-between;
      gap: 24px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .title-block h1 {
      margin: 0;
      font-size: clamp(2rem, 4vw, 3.4rem);
      letter-spacing: -0.05em;
      line-height: 1;
    }

    .title-block p {
      margin: 12px 0 0;
      color: var(--muted);
      max-width: 760px;
      line-height: 1.6;
    }

    .status-pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 12px 18px;
      border-radius: 999px;
      font-weight: 800;
      letter-spacing: 0.08em;
      border: 1px solid var(--border);
      box-shadow: var(--shadow);
      white-space: nowrap;
    }

    .status-pill.pass {
      color: #dcfce7;
      background: rgba(34, 197, 94, 0.18);
      border-color: rgba(34, 197, 94, 0.38);
    }

    .status-pill.fail {
      color: #fee2e2;
      background: rgba(239, 68, 68, 0.18);
      border-color: rgba(239, 68, 68, 0.42);
    }

    .status-pill.neutral {
      color: #fef3c7;
      background: rgba(245, 158, 11, 0.18);
      border-color: rgba(245, 158, 11, 0.42);
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 16px;
      margin: 24px 0;
    }

    .card {
      background: var(--panel);
      border: 1px solid var(--border);
      border-radius: 24px;
      padding: 20px;
      box-shadow: var(--shadow);
      backdrop-filter: blur(14px);
    }

    .metric-label {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.11em;
      margin-bottom: 8px;
    }

    .metric-value {
      font-size: 1.65rem;
      font-weight: 800;
      letter-spacing: -0.04em;
      overflow-wrap: anywhere;
    }

    .metric-value.small {
      font-size: 1rem;
      line-height: 1.4;
      letter-spacing: 0;
    }

    .section {
      margin-top: 16px;
    }

    .section h2 {
      margin: 0 0 14px;
      font-size: 1.15rem;
      letter-spacing: -0.02em;
    }

    .two-col {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }

    ul {
      margin: 0;
      padding-left: 20px;
      color: var(--text);
      line-height: 1.8;
    }

    .muted {
      color: var(--muted);
    }

    table {
      width: 100%;
      border-collapse: collapse;
      overflow: hidden;
      border-radius: 16px;
    }

    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--border);
      vertical-align: top;
    }

    th {
      color: var(--muted);
      font-size: 0.78rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      background: rgba(15, 23, 42, 0.45);
    }

    tr:last-child td {
      border-bottom: none;
    }

    code {
      color: #bae6fd;
      background: rgba(56, 189, 248, 0.09);
      border: 1px solid rgba(56, 189, 248, 0.16);
      padding: 2px 6px;
      border-radius: 8px;
    }

    .footer {
      margin-top: 24px;
      color: var(--muted);
      font-size: 0.9rem;
      text-align: center;
    }

    @media (max-width: 980px) {
      .grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .hero,
      .two-col {
        grid-template-columns: 1fr;
        flex-direction: column;
      }
    }

    @media (max-width: 560px) {
      body {
        padding: 18px;
      }

      .grid {
        grid-template-columns: 1fr;
      }

      .card {
        border-radius: 18px;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="title-block">
        <h1>QA Agent Dashboard</h1>
        <p>
          Automated quality snapshot generated from repository analysis, Git changed files,
          deterministic branch analysis, test execution and optional mutation testing.
        </p>
      </div>
      <div class="status-pill ${statusClass}">${escapeHtml(status)}</div>
    </section>

    <section class="grid">
      <div class="card">
        <div class="metric-label">Language</div>
        <div class="metric-value">${escapeHtml(dashboard.language)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Functions analysed</div>
        <div class="metric-value">${escapeHtml(dashboard.deterministicSummary?.totalFunctions ?? 0)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Coverage targets</div>
        <div class="metric-value">${escapeHtml(dashboard.deterministicSummary?.totalCoverageTargets ?? 0)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Mutation score</div>
        <div class="metric-value">${escapeHtml(mutationScore)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Project type</div>
        <div class="metric-value small">${escapeHtml(formatDashboardValue(dashboard.projectTypes))}</div>
      </div>

      <div class="card">
        <div class="metric-label">Test command</div>
        <div class="metric-value small"><code>${escapeHtml(dashboard.testCommand)}</code></div>
      </div>

      <div class="card">
        <div class="metric-label">Test duration</div>
        <div class="metric-value">${escapeHtml(testDuration)}</div>
      </div>

      <div class="card">
        <div class="metric-label">Mutation status</div>
        <div class="metric-value small">${escapeHtml(mutationStatus)}</div>
      </div>
    </section>

    <section class="two-col section">
      <div class="card">
        <h2>Git changed source files</h2>
        <ul>
          ${listItems(changedSourceFiles)}
        </ul>
      </div>

      <div class="card">
        <h2>Target files</h2>
        <ul>
          ${listItems(targetFiles)}
        </ul>
      </div>
    </section>

    <section class="two-col section">
      <div class="card">
        <h2>Focused files</h2>
        <ul>
          ${listItems(focusedFiles)}
        </ul>
      </div>

      <div class="card">
        <h2>Run metadata</h2>
        <table>
          <tr>
            <th>Field</th>
            <th>Value</th>
          </tr>
          <tr>
            <td>Generated at</td>
            <td>${escapeHtml(dashboard.generatedAt)}</td>
          </tr>
          <tr>
            <td>Repository path</td>
            <td>${escapeHtml(dashboard.repoPath)}</td>
          </tr>
          <tr>
            <td>Primary language key</td>
            <td>${escapeHtml(dashboard.primaryLanguage)}</td>
          </tr>
          <tr>
            <td>Generated test file</td>
            <td>${escapeHtml(dashboard.generatedTestFile)}</td>
          </tr>
          <tr>
            <td>Git detected</td>
            <td>${escapeHtml(formatDashboardValue(dashboard.git?.available))}</td>
          </tr>
          <tr>
            <td>Target selection</td>
            <td>${escapeHtml(dashboard.focusedModel?.targetSelection)}</td>
          </tr>
        </table>
      </div>
    </section>

    <section class="card section">
      <h2>High complexity functions</h2>
      <table>
        <tr>
          <th>File</th>
          <th>Function</th>
          <th>Complexity</th>
        </tr>
        ${highComplexityRows}
      </table>
    </section>

    <div class="footer">
      Generated by QA Agent · JSON source: <code>qa-dashboard.json</code>
    </div>
  </main>
</body>
</html>`;

  fs.writeFileSync(path.join(repoPath, "qa-dashboard.html"), html);
}

function writeDashboard(repoAnalysis, focusedModel, testResult = null, mutationResult = null) {
  const dashboard = {
    generatedAt: new Date().toISOString(),
    repoPath,
    language: repoAnalysis.language,
    primaryLanguage: repoAnalysis.primaryLanguage,
    projectTypes: repoAnalysis.projectTypes,
    testCommand: repoAnalysis.testCommand,
    generatedTestFile: repoAnalysis.generatedTestFile,
    git: repoAnalysis.git,
    focusedModel,
    deterministicSummary: repoAnalysis.deterministicAnalysis.summary,
    testResult: testResult
      ? {
          passed: testResult.passed,
          command: testResult.command,
          durationMs: testResult.durationMs
        }
      : null,
    mutationResult
  };

  fs.writeFileSync(
    path.join(repoPath, "qa-dashboard.json"),
    JSON.stringify(dashboard, null, 2)
  );

  writeHtmlDashboard(dashboard);
}

function writeRepositoryAnalysis(repoAnalysis, focusedModel) {
  const report = `# Repository Analysis

## Language Summary

\`\`\`json
${JSON.stringify({
  primaryLanguage: repoAnalysis.primaryLanguage,
  language: repoAnalysis.language,
  languageCounts: repoAnalysis.languageCounts,
  projectTypes: repoAnalysis.projectTypes,
  testCommand: repoAnalysis.testCommand,
  generatedTestFile: repoAnalysis.generatedTestFile
}, null, 2)}
\`\`\`

## Deterministic Analysis Summary

\`\`\`json
${JSON.stringify(repoAnalysis.deterministicAnalysis.summary, null, 2)}
\`\`\`

## Focused Context

\`\`\`json
${JSON.stringify(focusedModel, null, 2)}
\`\`\`

## Full Repository Model

\`\`\`json
${JSON.stringify(repoAnalysis, null, 2)}
\`\`\`
`;

  fs.writeFileSync(path.join(repoPath, "repository-analysis.md"), report);
}

function initialiseGitHubActions(repoAnalysis) {
  const workflowDir = path.join(repoPath, ".github", "workflows");
  fs.mkdirSync(workflowDir, { recursive: true });

  const workflowPath = path.join(workflowDir, "qa-agent.yml");

  const workflow = `name: QA Agent

on:
  pull_request:
  push:
    branches: [ main, master ]

jobs:
  qa-agent:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install agent dependencies
        run: npm install

      - name: Setup Python
        if: contains('${repoAnalysis.primaryLanguage}', 'python')
        uses: actions/setup-python@v5
        with:
          python-version: '3.x'

      - name: Install Python dependencies
        if: contains('${repoAnalysis.primaryLanguage}', 'python')
        run: |
          if [ -f requirements.txt ]; then pip install -r requirements.txt; fi
          pip install pytest

      - name: Run QA Agent
        run: node agent.js . --changed
`;

  fs.writeFileSync(workflowPath, workflow);
  console.log("✅ GitHub Actions workflow created: .github/workflows/qa-agent.yml");
}

function generateMutationCandidatesForFile(file, content, language) {
  const candidates = [];

  const patterns = [
    { name: "plus-to-minus", from: /\+/g, to: "-" },
    { name: "minus-to-plus", from: /-/g, to: "+" },
    { name: "multiply-to-divide", from: /\*/g, to: "/" },
    { name: "divide-to-multiply", from: /\//g, to: "*" },
    { name: "equals-to-not-equals", from: /==/g, to: "!=" },
    { name: "not-equals-to-equals", from: /!=/g, to: "==" },
    { name: "greater-to-less", from: />/g, to: "<" },
    { name: "less-to-greater", from: /</g, to: ">" },
    { name: "true-to-false", from: /\btrue\b/g, to: "false" },
    { name: "false-to-true", from: /\bfalse\b/g, to: "true" },
    { name: "return-zero", from: /return\s+([^;\n]+)/g, to: "return 0" },
    { name: "python-raise-to-return-zero", from: /raise\s+[A-Za-z0-9_]+\(.*?\)/g, to: "return 0" }
  ];

  for (const pattern of patterns) {
    let match;
    const source = stripCommentsAndStrings(content);

    while ((match = pattern.from.exec(source)) !== null) {
      const originalSlice = content.slice(match.index, match.index + match[0].length);
      if (!originalSlice.trim()) continue;

      const mutatedContent =
        content.slice(0, match.index) +
        originalSlice.replace(pattern.from, pattern.to) +
        content.slice(match.index + match[0].length);

      if (mutatedContent !== content) {
        candidates.push({
          file,
          language,
          mutation: pattern.name,
          index: match.index,
          original: originalSlice,
          replacement: originalSlice.replace(pattern.from, pattern.to),
          content: mutatedContent
        });
      }

      if (candidates.length >= 20) break;
    }

    if (candidates.length >= 20) break;
  }

  return candidates;
}

function runMutationTesting(repoAnalysis, focusedModel) {
  const mutationCandidates = [];

  for (const file of focusedModel.targetFiles) {
    if (!repoAnalysis.files.source.includes(file)) continue;

    const language = detectLanguageFromFile(file);
    const content = readFileSafe(file);
    mutationCandidates.push(...generateMutationCandidatesForFile(file, content, language));
  }

  const limited = mutationCandidates.slice(0, 15);
  const results = [];

  for (const candidate of limited) {
    const absolutePath = safeJoin(repoPath, candidate.file);
    const original = fs.readFileSync(absolutePath, "utf8");

    try {
      fs.writeFileSync(absolutePath, candidate.content);
      const result = runTests(repoAnalysis);

      results.push({
        file: candidate.file,
        mutation: candidate.mutation,
        original: candidate.original,
        replacement: candidate.replacement,
        killed: !result.passed,
        testCommand: result.command,
        durationMs: result.durationMs
      });
    } finally {
      fs.writeFileSync(absolutePath, original);
    }
  }

  const killed = results.filter((r) => r.killed).length;
  const survived = results.filter((r) => !r.killed).length;

  const report = {
    generatedAt: new Date().toISOString(),
    candidatesGenerated: mutationCandidates.length,
    candidatesExecuted: results.length,
    killed,
    survived,
    mutationScore:
      results.length === 0 ? null : Math.round((killed / results.length) * 10000) / 100,
    results
  };

  const md = `# Mutation Report

## Summary

- Candidates generated: ${report.candidatesGenerated}
- Candidates executed: ${report.candidatesExecuted}
- Killed: ${report.killed}
- Survived: ${report.survived}
- Mutation score: ${report.mutationScore === null ? "N/A" : `${report.mutationScore}%`}

## Results

\`\`\`json
${JSON.stringify(report.results, null, 2)}
\`\`\`
`;

  fs.writeFileSync(path.join(repoPath, "mutation-report.md"), md);
  return report;
}

function runBenchmark(repoAnalysis, focusedModel) {
  const testRun = runTests(repoAnalysis);
  const benchmark = {
    generatedAt: new Date().toISOString(),
    language: repoAnalysis.language,
    sourceFiles: repoAnalysis.files.source.length,
    testFiles: repoAnalysis.files.tests.length,
    functionsAnalysed: repoAnalysis.deterministicAnalysis.summary.totalFunctions,
    coverageTargets: repoAnalysis.deterministicAnalysis.summary.totalCoverageTargets,
    highComplexityFunctions: repoAnalysis.deterministicAnalysis.summary.highComplexityFunctions,
    testCommand: testRun.command,
    testsPassed: testRun.passed,
    testDurationMs: testRun.durationMs,
    focusedFiles: focusedModel.focusedFiles
  };

  fs.writeFileSync(
    path.join(repoPath, "qa-benchmark.json"),
    JSON.stringify(benchmark, null, 2)
  );

  return benchmark;
}

async function generateTests(projectContext, repoAnalysis, focusedModel) {
  const profile = LANGUAGE_PROFILES[repoAnalysis.primaryLanguage];

  const prompt = `
You are a Senior QA Automation Engineer.

You are testing a multi-language software project.

Primary language:
${repoAnalysis.language}

Project types:
${repoAnalysis.projectTypes.join(", ")}

Test command:
${repoAnalysis.testCommand}

Generated test file:
${repoAnalysis.generatedTestFile}

Language-specific instruction:
${profile?.testInstruction || "Generate appropriate tests for the detected language."}

Deterministic analysis:
${JSON.stringify(focusedModel.deterministicAnalysis, null, 2)}

Important rules:
- Use the repository analysis, Git changed files when present, dependency graph, reverse dependency graph, call graph, and deterministic analysis.
- Treat deterministicAnalysis.coverageTargets as the primary list of missing/important behaviours to test.
- Generate tests that cover each meaningful branch/condition/loop/exception target.
- Do NOT generate overlapping tests that assert the same behaviour in multiple ways.
- Do NOT create redundant tests like checking a return value inside a pytest.raises block after the exception should already have occurred.
- Prefer parameterized/table-driven tests where multiple cases exercise the same behaviour.
- One behaviour = one test or one parameterized test group.
- Do NOT invent function names/classes/modules.
- Use actual discovered exports/functions/classes.
- Prefer testing top-level functions/classes that orchestrate dependencies.
- If target files are Git-changed files, focus on regression tests for changed behaviour and impacted callers.
- If existing tests are present, improve coverage instead of duplicating identical tests.
- Return ONLY valid code for the generated test file.
- Do NOT wrap the output in markdown.
- The generated file will be saved as: ${repoAnalysis.generatedTestFile}

Project context:
${projectContext}
`;

  const response = await client.responses.create({
    model: "gpt-5.2",
    input: prompt
  });

  return cleanCodeBlock(response.output_text);
}

async function generateQaReport(projectContext, testCode, testOutput, repoAnalysis) {
  const prompt = `
You are a Senior QA Engineer.

The generated tests failed.

Analyse whether the failure is likely caused by:
1. a bug in the application code
2. a bug in the generated test
3. unclear requirements
4. test command/environment mismatch

Produce a clear QA defect report.

Include:
- Summary
- Detected language and project type
- Test command used
- Deterministic analysis summary
- Repository understanding
- Git changed files considered
- Focused files inspected
- Dependency/call graph reasoning
- Failed behaviour
- Expected behaviour
- Actual behaviour
- Likely root cause
- Severity
- Suggested fix
- Whether the test appears valid
- Whether any generated tests look redundant/overlapping
- Which source file(s) are likely affected

Detected language:
${repoAnalysis.language}

Test command:
${repoAnalysis.testCommand}

Deterministic analysis:
${JSON.stringify(repoAnalysis.deterministicAnalysis, null, 2)}

Project context:
${projectContext}

Generated test file:
${repoAnalysis.generatedTestFile}

Generated test code:
${testCode}

Test output:
${testOutput}
`;

  const response = await client.responses.create({
    model: "gpt-5.2",
    input: prompt
  });

  return response.output_text;
}

async function generateFixes(projectContext, report, testOutput, repoAnalysis) {
  const prompt = `
You are a Senior Software Engineer and QA Automation Engineer.

The tests failed and a QA report was produced.

Fix the application code.

Important rules:
- Return ONLY valid JSON.
- Do NOT return markdown.
- Do NOT explain anything.
- Do NOT modify generated test files unless the QA report says the generated test is wrong.
- Only modify source files that need changes.
- Preserve public function/class/module names unless genuinely wrong.
- Preserve imports unless genuinely wrong.
- Prefer the smallest safe code change.
- Your JSON must have this exact shape:

{
  "files": [
    {
      "path": "relative/path/to/source-file",
      "content": "full updated file content"
    }
  ]
}

Detected language:
${repoAnalysis.language}

Test command:
${repoAnalysis.testCommand}

Project context:
${projectContext}

QA report:
${report}

Test output:
${testOutput}
`;

  const response = await client.responses.create({
    model: "gpt-5.2",
    input: prompt
  });

  const jsonText = cleanCodeBlock(response.output_text);

  try {
    return JSON.parse(jsonText);
  } catch {
    console.log("❌ AI did not return valid JSON.");
    console.log(jsonText);
    process.exit(1);
  }
}

async function generateFinalQaReport({
  projectContext,
  preFixReport,
  fixPayload,
  appliedFixes,
  postFixTestResult,
  repoAnalysis,
  backup
}) {
  const prompt = `
You are a Senior QA Engineer.

A QA agent generated tests, found defects, applied a fix, and reran the tests.

Create the final qa-report.md.

It must include:
- Original defect summary
- Detected language and project type
- Test command used
- Deterministic analysis summary
- Git changed files considered
- Backup location
- Files changed by the agent
- What was changed
- Why the fix was needed
- Whether the fix was verified
- Post-fix test result
- Residual risks
- Final status: PASS or FAIL

Detected language:
${repoAnalysis.language}

Test command:
${repoAnalysis.testCommand}

Backup:
${JSON.stringify(backup, null, 2)}

Deterministic analysis:
${JSON.stringify(repoAnalysis.deterministicAnalysis.summary, null, 2)}

Project context after fix:
${projectContext}

Original QA report:
${preFixReport}

Fix payload requested by AI:
${JSON.stringify(fixPayload, null, 2)}

Applied fixes:
${JSON.stringify(appliedFixes, null, 2)}

Post-fix test result:
${postFixTestResult.output}
`;

  const response = await client.responses.create({
    model: "gpt-5.2",
    input: prompt
  });

  return response.output_text;
}

function applyFixes(fixPayload, repoAnalysis) {
  if (!fixPayload.files || !Array.isArray(fixPayload.files)) {
    console.log("❌ Invalid fix payload. Missing files array.");
    process.exit(1);
  }

  const sourceSet = new Set(repoAnalysis.files.source);
  const filesToBackup = [];

  for (const file of fixPayload.files) {
    if (!file.path || typeof file.content !== "string") {
      console.log("❌ Invalid file fix entry.");
      process.exit(1);
    }

    if (file.path.includes("..") || path.isAbsolute(file.path)) {
      console.log(`❌ Unsafe file path rejected: ${file.path}`);
      process.exit(1);
    }

    if (!sourceSet.has(file.path)) {
      console.log(`❌ Refusing to modify non-source or unknown file: ${file.path}`);
      process.exit(1);
    }

    filesToBackup.push(file.path);
  }

  const backup = createBackup(filesToBackup);
  const appliedFixes = [];

  for (const file of fixPayload.files) {
    const absolutePath = safeJoin(repoPath, file.path);

    if (!fs.existsSync(absolutePath)) {
      console.log(`❌ Refusing to create unknown source file: ${file.path}`);
      process.exit(1);
    }

    const before = fs.readFileSync(absolutePath, "utf8");

    fs.writeFileSync(absolutePath, file.content);

    appliedFixes.push({
      path: file.path,
      changed: before !== file.content,
      before,
      after: file.content
    });

    console.log(`✅ Updated ${file.path}`);
  }

  return { appliedFixes, backup };
}

console.log("🔎 Analysing repository...");

let repoAnalysis = analyseRepository();
let { projectContext, focusedModel } = buildFocusedContext(repoAnalysis);

writeRepositoryAnalysis(repoAnalysis, focusedModel);
writeDashboard(repoAnalysis, focusedModel);

if (initCiMode) {
  initialiseGitHubActions(repoAnalysis);
}

console.log("✅ repository-analysis.md created.");
console.log("✅ qa-dashboard.json created.");

console.log("\nRepository summary:");
console.log(`Detected language: ${repoAnalysis.language}`);
console.log(`Primary language key: ${repoAnalysis.primaryLanguage}`);
console.log(`Project type: ${repoAnalysis.projectTypes.join(", ")}`);
console.log(`Test command: ${repoAnalysis.testCommand}`);
console.log(`Generated test file: ${repoAnalysis.generatedTestFile}`);
console.log(`Source files: ${repoAnalysis.files.source.length}`);
console.log(`Existing test files: ${repoAnalysis.files.tests.length}`);
console.log(`Entry points: ${repoAnalysis.entryPoints.length}`);
console.log(`Call graph edges: ${repoAnalysis.callGraph.length}`);

console.log("\nDeterministic analysis:");
console.log(`Functions analysed: ${repoAnalysis.deterministicAnalysis.summary.totalFunctions}`);
console.log(`Coverage targets: ${repoAnalysis.deterministicAnalysis.summary.totalCoverageTargets}`);
console.log(`Existing test intents: ${repoAnalysis.deterministicAnalysis.summary.existingTestIntentCount}`);

if (repoAnalysis.deterministicAnalysis.summary.highComplexityFunctions.length > 0) {
  console.log("High complexity functions:");
  for (const fn of repoAnalysis.deterministicAnalysis.summary.highComplexityFunctions) {
    console.log(`- ${fn.file} :: ${fn.function} complexity ${fn.cyclomaticComplexity}`);
  }
}

console.log("\nLanguage counts:");
for (const [lang, count] of Object.entries(repoAnalysis.languageCounts)) {
  if (count > 0) console.log(`- ${lang}: ${count}`);
}

console.log("\nGit decision:");
if (!repoAnalysis.git.available) {
  console.log("Git detected: no");
  console.log("Path selected: full focused scan");
} else {
  console.log("Git detected: yes");
  console.log(`Git root: ${repoAnalysis.git.gitRoot}`);
  console.log(`Changed source files in target project: ${repoAnalysis.git.changedSourceFiles.length}`);

  for (const file of repoAnalysis.git.changedSourceFiles) {
    console.log(`- ${file}`);
  }

  console.log(`Path selected: ${focusedModel.targetSelection}`);
}

console.log("\nFocused files:");
for (const file of focusedModel.focusedFiles) {
  console.log(`- ${file}`);
}

if (benchmarkMode) {
  console.log("\n📊 Running benchmark...");
  const benchmark = runBenchmark(repoAnalysis, focusedModel);
  console.log("✅ qa-benchmark.json created.");
  console.log(`Tests passed: ${benchmark.testsPassed}`);
  console.log(`Duration: ${benchmark.testDurationMs}ms`);
}

console.log("\nGenerating tests...");
const testCode = await generateTests(projectContext, repoAnalysis, focusedModel);

fs.writeFileSync(path.join(repoPath, repoAnalysis.generatedTestFile), testCode);
console.log(`✅ ${repoAnalysis.generatedTestFile} created.`);

console.log("\nRunning tests...");
let testResult = runTests(repoAnalysis);
writeDashboard(repoAnalysis, focusedModel, testResult);

if (mutationMode) {
  console.log("\n🧬 Running mutation testing...");
  const mutationResult = runMutationTesting(repoAnalysis, focusedModel);
  writeDashboard(repoAnalysis, focusedModel, testResult, mutationResult);
  console.log("✅ mutation-report.md created.");
  console.log(
    `Mutation score: ${mutationResult.mutationScore === null ? "N/A" : `${mutationResult.mutationScore}%`}`
  );
}

if (testResult.passed) {
  console.log(testResult.output);

  const cleanReport = `# QA Report

## Final status
PASS

## Summary
All generated tests passed. No QA defects were detected in the focused context.

## Detected language
${repoAnalysis.language}

## Project type
${repoAnalysis.projectTypes.join(", ")}

## Test command
${repoAnalysis.testCommand}

## Generated test file
${repoAnalysis.generatedTestFile}

## Deterministic analysis
- Functions analysed: ${repoAnalysis.deterministicAnalysis.summary.totalFunctions}
- Coverage targets identified: ${repoAnalysis.deterministicAnalysis.summary.totalCoverageTargets}
- Existing test intents found: ${repoAnalysis.deterministicAnalysis.summary.existingTestIntentCount}

## Target selection
${focusedModel.targetSelection}

## Target files
${focusedModel.targetFiles.map((file) => `- ${file}`).join("\n")}

## Git status
Git detected: ${repoAnalysis.git.available ? "yes" : "no"}

## Git changed source files
${repoAnalysis.git.changedSourceFiles.length > 0 ? repoAnalysis.git.changedSourceFiles.map((file) => `- ${file}`).join("\n") : "None detected"}

## Test output

\`\`\`text
${testResult.output}
\`\`\`
`;

  fs.writeFileSync(path.join(repoPath, "qa-report.md"), cleanReport);

  console.log("✅ All tests passed. No QA defects detected.");
  console.log("✅ qa-report.md updated.");
  process.exit(0);
}

console.log("❌ Tests failed.");
console.log(testResult.output);

console.log("\nGenerating QA report...");
const report = await generateQaReport(
  projectContext,
  testCode,
  testResult.output,
  repoAnalysis
);

fs.writeFileSync(path.join(repoPath, "qa-report.md"), report);

console.log("\n===== QA REPORT =====\n");
console.log(report);
console.log("\n✅ qa-report.md created.");

if (!fixMode) {
  console.log("\nℹ️ Fix mode not enabled.");
  console.log("Run this to allow the agent to fix the code:");
  console.log(`node agent.js ${repoPath} --fix`);
  process.exit(1);
}

console.log("\n🛠️ Fix mode enabled. Generating source-code fixes...");

const fixPayload = await generateFixes(
  projectContext,
  report,
  testResult.output,
  repoAnalysis
);

const { appliedFixes, backup } = applyFixes(fixPayload, repoAnalysis);

console.log("\nRe-analysing repository after fix...");

repoAnalysis = analyseRepository();
({ projectContext, focusedModel } = buildFocusedContext(repoAnalysis));
writeRepositoryAnalysis(repoAnalysis, focusedModel);

console.log("\nRe-running tests...");
testResult = runTests(repoAnalysis);
writeDashboard(repoAnalysis, focusedModel, testResult);

console.log("\nUpdating qa-report.md with fix result...");

const finalReport = await generateFinalQaReport({
  projectContext,
  preFixReport: report,
  fixPayload,
  appliedFixes: appliedFixes.map((fix) => ({
    path: fix.path,
    changed: fix.changed,
    before: fix.before,
    after: fix.after
  })),
  postFixTestResult: testResult,
  repoAnalysis,
  backup
});

fs.writeFileSync(path.join(repoPath, "qa-report.md"), finalReport);

console.log("✅ qa-report.md updated with fix audit trail.");

if (testResult.passed) {
  console.log(testResult.output);
  console.log("✅ Auto-fix successful. All tests now pass.");
  process.exit(0);
}

console.log("❌ Auto-fix attempted, but tests still fail.");
console.log(testResult.output);
process.exit(1);