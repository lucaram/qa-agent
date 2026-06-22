export const LANGUAGE_PROFILES = {
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
    testInstruction:
      "Generate Rust tests using #[test]. Prefer adding tests compatible with cargo test."
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