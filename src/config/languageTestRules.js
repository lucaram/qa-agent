function buildRules({
  language,
  framework,
  imports = [],
  allowed = [],
  forbidden = [],
  exceptions = [],
  notes = []
}) {
  return `
========================
${language.toUpperCase()} TEST RULES
========================

Generate ${language} test code only.

Preferred framework:
- ${framework}

Required imports:
${imports.length ? imports.map((i) => `- ${i}`).join("\n") : "- Use repository conventions"}

Allowed constructs:
${allowed.length ? allowed.map((a) => `- ${a}`).join("\n") : "- Repository defaults"}

Exception handling:
${exceptions.length ? exceptions.map((e) => `- ${e}`).join("\n") : "- Follow repository implementation"}

Never use:
${forbidden.length ? forbidden.map((f) => `- ${f}`).join("\n") : "- Syntax or frameworks from another language"}

Additional notes:
${notes.length ? notes.map((n) => `- ${n}`).join("\n") : "- None"}
`;
}

const GLOBAL_TEST_RULES = `
========================
GLOBAL TEST GENERATION RULES
========================

Apply these rules to every language:

- Generate tests only for behaviour supported by source code, deterministic analysis, QA plan, or explicit documentation.
- Do not invent validation that does not exist.
- Do not invent exceptions that are not explicitly raised, returned, documented, or guarded by source code.
- Do not infer input type restrictions unless the implementation validates types or the QA plan/documents require them.
- Test application behaviour, not accidental runtime/interpreter/compiler behaviour.
- Do not create tests for unsupported input types unless the app explicitly handles those inputs.
- If behaviour is ambiguous, prefer documented requirements when available.
- If documentation is missing, use current implementation behaviour as the source of truth.
- If source code and documentation conflict, preserve the documented requirement and let the test expose the defect.
- Keep exception-path tests separate from normal return-value tests.
- Do not place invalid inputs inside normal happy-path tests.
- Do not mix programming languages.
- Do not mix testing frameworks.
- Do not invent a test framework.
- Use the detected repository test command as the execution contract.
- Generated tests must be directly executable by the detected test command.
- Prefer meaningful behavioural assertions over shallow import/existence tests.
- Prefer deterministic tests with fixed inputs and outputs.
- Avoid tests that depend on time, randomness, network, filesystem, environment variables, or external services unless the app explicitly depends on them and the behaviour can be isolated.
- For generated tests, prefer small, focused cases that cover public APIs, branches, exception paths, edge cases, dependency flows and mutation-sensitive behaviours.
`;

const LANGUAGE_RULES = {
  javascript: buildRules({
    language: "JavaScript",
    framework: "Node.js / Jest / Vitest / Mocha (detect automatically)",
    imports: [
      'import assert from "node:assert/strict" only for plain Node tests',
      "Repository framework imports only when Jest/Vitest/Mocha is detected"
    ],
    allowed: [
      "assert.strictEqual",
      "assert.deepStrictEqual",
      "assert.throws",
      "describe/it only when a framework exists"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "xUnit",
      "C# syntax",
      "PHPUnit",
      "Rust syntax",
      "Go syntax",
      "Swift syntax",
      "Kotlin syntax"
    ],
    exceptions: [
      "Use assert.throws for exception paths in plain Node tests.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "If command is node test.js, never generate Jest/Mocha/Vitest syntax.",
      "Do not use describe(), it(), test() or expect() unless the repository explicitly uses a framework."
    ]
  }),

  typescript: buildRules({
    language: "TypeScript",
    framework: "Vitest / Jest / Mocha / Node runner (detect automatically)",
    imports: [
      "Use repository framework imports when a framework is detected",
      'Use node:assert/strict only when plain Node-compatible tests are configured'
    ],
    allowed: [
      "TypeScript syntax",
      "typed imports",
      "async tests",
      "framework assertions only when framework exists"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "xUnit",
      "C# syntax",
      "PHPUnit",
      "Rust syntax",
      "Go syntax",
      "Swift syntax",
      "Kotlin syntax"
    ],
    exceptions: [
      "Use the configured TypeScript test framework's exception assertion.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent Vitest/Jest/Mocha if package.json or the test command does not indicate it.",
      "Generated tests must be compatible with the repository TypeScript execution setup."
    ]
  }),

  python: buildRules({
    language: "Python",
    framework: "pytest",
    imports: [
      "import pytest",
      "module imports from the Python source files"
    ],
    allowed: [
      "pytest.raises",
      "plain assert"
    ],
    forbidden: [
      "node:assert/strict",
      "JavaScript syntax",
      "describe()",
      "it()",
      "expect()",
      "Jest",
      "Mocha",
      "Vitest",
      "JUnit",
      "Java syntax",
      "xUnit",
      "C# syntax",
      "PHPUnit"
    ],
    exceptions: [
      "Use pytest.raises for every exception path.",
      "Only test exceptions explicitly raised or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent type-validation tests unless the source code or QA plan explicitly validates input types.",
      "Do not expect TypeError, ValueError, RuntimeError or any other exception unless it is explicitly raised by the application or required by the QA plan.",
      "If Python itself raises an exception as a side-effect of an unsupported operation, do not generate a test for it unless the application intentionally exposes that behaviour.",
      "Prefer application behaviour over interpreter behaviour."
    ]
  }),

  java: buildRules({
    language: "Java",
    framework: "JUnit 5 unless the repository clearly uses another Java test framework",
    imports: [
      "org.junit.jupiter.api.Test",
      "org.junit.jupiter.api.Assertions"
    ],
    allowed: [
      "@Test",
      "Assertions.assertEquals",
      "Assertions.assertTrue",
      "Assertions.assertFalse",
      "Assertions.assertThrows"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "Jest",
      "Mocha",
      "Vitest",
      "xUnit",
      "C# syntax",
      "PHPUnit"
    ],
    exceptions: [
      "Use Assertions.assertThrows for exception paths.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent Spring, Mockito, or integration-test setup unless the repository uses them.",
      "Prefer unit tests for public methods unless the QA plan requires integration coverage."
    ]
  }),

  csharp: buildRules({
    language: "C#",
    framework: "xUnit unless NUnit or MSTest is clearly detected",
    imports: [
      "using Xunit; for xUnit",
      "repository namespace imports"
    ],
    allowed: [
      "[Fact]",
      "[Theory]",
      "Assert.Equal",
      "Assert.True",
      "Assert.False",
      "Assert.Throws"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "Jest",
      "Mocha",
      "Vitest",
      "PHPUnit"
    ],
    exceptions: [
      "Use Assert.Throws for exception paths.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent mocks, dependency injection, ASP.NET test server or database setup unless the repository requires it.",
      "Use NUnit or MSTest only if the project clearly uses them."
    ]
  }),

  go: buildRules({
    language: "Go",
    framework: "testing",
    imports: ['import "testing"'],
    allowed: [
      "func TestXxx(t *testing.T)",
      "t.Fatalf",
      "t.Errorf",
      "table-driven tests"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Check returned errors explicitly.",
      "Only test errors explicitly returned or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not use third-party assertion libraries unless already present.",
      "Prefer table-driven tests for multiple input/output cases."
    ]
  }),

  php: buildRules({
    language: "PHP",
    framework: "PHPUnit",
    imports: ["use PHPUnit\\Framework\\TestCase;"],
    allowed: [
      "assertEquals",
      "assertSame",
      "expectException",
      "expectExceptionMessage"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "Jest",
      "JavaScript syntax",
      "node:assert/strict",
      "JUnit",
      "Java syntax",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Use expectException for exception paths.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent Laravel/Symfony test setup unless the repository clearly uses it."
    ]
  }),

  ruby: buildRules({
    language: "Ruby",
    framework: "RSpec or Minitest depending on repository",
    allowed: [
      "RSpec expect syntax when RSpec is detected",
      "Minitest assert_equal when Minitest is detected"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Use raise_error in RSpec or assert_raises in Minitest.",
      "Only test exceptions explicitly raised or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent Rails test setup unless Rails is clearly present.",
      "Use the style already present in the repository where possible."
    ]
  }),

  rust: buildRules({
    language: "Rust",
    framework: "cargo test",
    imports: [
      "#[cfg(test)]",
      "mod tests"
    ],
    allowed: [
      "#[test]",
      "assert_eq!",
      "assert!",
      "should_panic only for explicitly panicking behaviour"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "Jest",
      "JavaScript syntax",
      "JUnit",
      "Java syntax",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Use #[should_panic] only when the code explicitly panics.",
      "Prefer Result/Option assertions when the API returns Result or Option."
    ],
    notes: [
      "Do not invent external crates unless already present.",
      "Keep tests inside a cfg(test) module unless repository convention differs."
    ]
  }),

  swift: buildRules({
    language: "Swift",
    framework: "XCTest",
    imports: ["import XCTest"],
    allowed: [
      "XCTAssertEqual",
      "XCTAssertTrue",
      "XCTAssertFalse",
      "XCTAssertThrowsError"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "JUnit",
      "Java syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Use XCTAssertThrowsError for exception paths.",
      "Only test thrown errors explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent iOS UI testing unless the repository clearly uses it."
    ]
  }),

  kotlin: buildRules({
    language: "Kotlin",
    framework: "JUnit5 / kotlin.test depending on repository",
    imports: [
      "org.junit.jupiter.api.Test when JUnit5 is detected",
      "kotlin.test assertions when kotlin.test is detected"
    ],
    allowed: [
      "assertEquals",
      "assertTrue",
      "assertFalse",
      "assertFailsWith"
    ],
    forbidden: [
      "pytest",
      "Python syntax",
      "node:assert/strict",
      "JavaScript syntax",
      "Jest",
      "Mocha",
      "Vitest",
      "xUnit",
      "C# syntax"
    ],
    exceptions: [
      "Use assertFailsWith for exception paths.",
      "Only test exceptions explicitly thrown or clearly guarded by source code or QA plan."
    ],
    notes: [
      "Do not invent Android instrumentation tests unless the repository clearly uses Android test setup."
    ]
  }),

  htmlcss: buildRules({
    language: "HTML/CSS",
    framework: "Playwright / Cypress / DOM testing only when configured",
    allowed: [
      "Accessibility checks",
      "DOM assertions",
      "Visual regression checks",
      "Snapshot tests only when configured"
    ],
    forbidden: [
      "Unit tests for CSS-only behaviour",
      "Business logic assertions where no business logic exists",
      "pytest",
      "JUnit",
      "node:assert/strict unless JavaScript test runner exists"
    ],
    notes: [
      "Focus on rendered behaviour rather than implementation.",
      "Do not invent browser automation unless Playwright, Cypress or a DOM test framework is present.",
      "For pure static HTML/CSS with no test runner, report that automated test generation requires a configured runner."
    ]
  })
};

export function getLanguageTestRules(primaryLanguage) {
  const key = String(primaryLanguage || "").toLowerCase();

  const languageRules =
    LANGUAGE_RULES[key] ??
    buildRules({
      language: key || "Unknown",
      framework: "Repository-native test framework",
      forbidden: [
        "Syntax from another language",
        "Testing frameworks not present in the repository"
      ],
      notes: [
        "Use only the repository's native testing framework.",
        "Never mix languages.",
        "Never invent a testing framework."
      ]
    });

  return `${GLOBAL_TEST_RULES}

${languageRules}`;
}

export default LANGUAGE_RULES;