import DeterministicValueBuilder from "./DeterministicValueBuilder.js";

export default class DeterministicTestDataBuilder {
  constructor() {
    this.valueBuilder = new DeterministicValueBuilder();
  }

  buildTestExamples(deterministicAnalysis) {
    const examples = [];

    for (const fileAnalysis of deterministicAnalysis?.files || []) {
      for (const fn of fileAnalysis.functions || []) {
        const parameters = this.extractParameters(fn);

        examples.push(
          ...this.buildReturnExamples({
            file: fileAnalysis.file,
            language: fileAnalysis.language,
            fn,
            parameters
          })
        );

        examples.push(
          ...this.buildExceptionExamples({
            file: fileAnalysis.file,
            language: fileAnalysis.language,
            fn,
            parameters
          })
        );
      }
    }

    return examples;
  }

  extractParameters(fn) {
    if (Array.isArray(fn.parameters)) return fn.parameters;
    if (Array.isArray(fn.params)) return fn.params;

    return [];
  }

  buildReturnExamples({ file, language, fn, parameters }) {
    if (!fn.hasReturn) return [];

    const validArgs = this.valueBuilder.buildValidArgs(fn.name, parameters);

    return [
      {
        id: `${fn.name.toLowerCase()}-deterministic-return`,
        priority: 1,
        targetApi: fn.name,
        testName: `Deterministic example: ${fn.name} return behaviour`,
        testType: "unit",
        scenario: `Call ${fn.name} with valid representative inputs.`,
        inputs: {
          args: validArgs,
          setup: "",
          description: `Call ${fn.name} with valid representative inputs.`
        },
        expected: {
          kind: "return",
          expectedValueAvailable: false,
          expectedValue: null,
          expectedCalculation: null,
          expectedBehaviour:
            "Returns the value produced by the implementation for the representative inputs.",
          expectedException: null,
          assertionHint:
            "Assert return value only when the deterministic evaluator has computed an exact expected value."
        },
        reliability: {
          safeForDirectGeneration: false,
          confidence: "medium",
          reason:
            "Representative inputs were generated semantically, but no exact return value was computed."
        },
        source: "deterministic-test-data-builder",
        covers: ["publicApi", "returnPath"],
        evidence: [
          `Generated valid representative arguments for ${fn.name} in ${file}.`
        ],
        metadata: {
          file,
          language,
          parameters
        }
      }
    ];
  }

  buildExceptionExamples({ file, language, fn, parameters }) {
    const examples = [];

    for (const target of fn.likelyTestTargets || []) {
      if (target.type !== "condition" && target.type !== "exception") {
        continue;
      }

      const condition = target.target || "";
      const invalidArgs = this.valueBuilder.buildInvalidArgsForCondition(
        fn.name,
        parameters,
        condition
      );

      const expectedException = this.inferExceptionMessage(fn.body, condition);

      if (!expectedException) {
        continue;
      }

      examples.push({
        id: `${fn.name.toLowerCase()}-deterministic-${this.slugify(condition)}`,
        priority: 1,
        targetApi: fn.name,
        testName: `Deterministic example: ${fn.name} exception behaviour`,
        testType: "unit",
        scenario: `Call ${fn.name} with invalid input for condition: ${condition}.`,
        inputs: {
          args: invalidArgs,
          setup: "",
          description: `Call ${fn.name} with invalid input for condition: ${condition}.`
        },
        expected: {
          kind: "exception",
          expectedValueAvailable: false,
          expectedValue: null,
          expectedCalculation: null,
          expectedBehaviour: `Throws ${expectedException}.`,
          expectedException,
          assertionHint: `Assert call throws ${expectedException}.`
        },
        reliability: {
          safeForDirectGeneration: true,
          confidence: "high",
          reason:
            "Exception input was generated from the matching validation condition and expected error message was read from source."
        },
        source: "deterministic-test-data-builder",
        covers: ["validationRule", "exceptionPath", "mutation"],
        evidence: [
          `Detected validation condition in ${file}: ${condition}`,
          `Detected matching exception message in ${file}: ${expectedException}`
        ],
        metadata: {
          file,
          language,
          parameters,
          condition
        }
      });
    }

    return examples;
  }

  inferExceptionMessage(functionBody = "", condition = "") {
    const body = String(functionBody || "");
    const conditionText = String(condition || "").trim();

    if (!conditionText) return null;

    const escapedCondition = this.escapeRegExp(conditionText);

    const jsIfThrowPattern = new RegExp(
      `if\\s*\\(\\s*${escapedCondition}\\s*\\)\\s*{?[\\s\\S]{0,300}?throw\\s+new\\s+Error\\s*\\(\\s*["'\`]([^"'\`]+)["'\`]\\s*\\)`,
      "m"
    );

    const jsMatch = body.match(jsIfThrowPattern);
    if (jsMatch) return jsMatch[1];

    const pythonIfRaisePattern = new RegExp(
      `if\\s+${escapedCondition}\\s*:[\\s\\S]{0,300}?raise\\s+[A-Za-z_][A-Za-z0-9_]*\\s*\\(\\s*["']([^"']+)["']\\s*\\)`,
      "m"
    );

    const pythonMatch = body.match(pythonIfRaisePattern);
    if (pythonMatch) return pythonMatch[1];

    return this.findNearestExceptionMessage(body, conditionText);
  }

  findNearestExceptionMessage(functionBody, condition) {
    const body = String(functionBody || "");
    const conditionIndex = body.indexOf(condition);

    if (conditionIndex === -1) return null;

    const nearby = body.slice(conditionIndex, conditionIndex + 500);

    const jsMessage = nearby.match(
      /throw\s+new\s+Error\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/
    );

    if (jsMessage) return jsMessage[1];

    const pythonMessage = nearby.match(
      /raise\s+[A-Za-z_][A-Za-z0-9_]*\s*\(\s*["']([^"']+)["']\s*\)/
    );

    if (pythonMessage) return pythonMessage[1];

    return null;
  }

  slugify(value) {
    return String(value || "case")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80);
  }

  escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}