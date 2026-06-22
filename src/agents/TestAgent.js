import fs from "fs";
import path from "path";

import { cleanCodeBlock } from "../utils/stringUtils.js";
import { safeJoin } from "../utils/pathUtils.js";
import { runTests } from "../runtime/commandRunner.js";

const TEST_GENERATION_SYSTEM_PROMPT =
  "You are a senior QA automation engineer. Generate only executable test code. Do not include markdown fences. Do not invent expected behaviour. NEVER call a function with inputs that the source code is expected to reject unless the call is wrapped in an explicit exception assertion. For Python, use pytest.raises for exception paths. If the source code contains raise ZeroDivisionError for b == 0, every divide(..., 0) test must use pytest.raises(ZeroDivisionError). If the JavaScript test command is \"node test.js\" or no framework is detected, do not use describe, it, test, expect, Jest, Mocha or Vitest. Use only node:assert/strict and plain executable Node.js code. For JavaScript numerical business logic, derive expected values directly from the implementation shown in the repository context. Do not invent mathematically ideal expected values if the implementation rounds, truncates, discounts, taxes or applies ordering differently. Prefer testing documented/current implementation behaviour. Respect deterministic coverage targets exactly.";

const TEST_REPAIR_SYSTEM_PROMPT =
  `${TEST_GENERATION_SYSTEM_PROMPT} You are now repairing ONLY the generated test file. Return the full corrected test file content only. Do not modify production/source code. Do not remove meaningful coverage unless an assertion is invalid. If the failing output shows actual and expected values, treat the source implementation as the source of truth, not the previous expected value.`;

export default class TestAgent {
  constructor(repoPath, openAiClient, readFileSafe) {
    this.repoPath = repoPath;
    this.client = openAiClient;
    this.readFileSafe = readFileSafe;
  }

  buildGenerationPrompt({ repoAnalysis, focusedModel, projectContext }) {
    return `
Generate tests for this repository.

Primary language: ${repoAnalysis.primaryLanguage}
Detected language: ${repoAnalysis.language}
Test command: ${repoAnalysis.testCommand}
Generated test file: ${repoAnalysis.generatedTestFile}

Focused model:
${JSON.stringify(focusedModel, null, 2)}

Deterministic coverage targets:
${JSON.stringify(focusedModel.deterministicAnalysis.coverageTargets, null, 2)}

Critical exception rule:
If a deterministic target says exception path, generate a separate exception test.
Do not include exception inputs inside normal return-value parametrized tests.

Critical JavaScript rule:
If the test command is "node test.js", the generated test must be runnable directly with Node.
Use:
import assert from "node:assert/strict";
Do not use describe(), it(), test(), expect(), beforeEach(), afterEach(), Jest, Mocha or Vitest globals.

Critical expected-value rule:
Expected values must be derived from the actual source implementation in Repository context.
If implementation applies discount/tax/rounding/order differently from mathematical intuition, test the implementation behaviour, not an invented ideal.

Repository context:
${projectContext}
`;
  }

  buildRepairPrompt({
    repoAnalysis,
    focusedModel,
    projectContext,
    generatedTestCode,
    testResult
  }) {
    return `
The generated test file failed. Repair ONLY the generated test file.

Generated test file:
${repoAnalysis.generatedTestFile}

Primary language:
${repoAnalysis.primaryLanguage}

Detected language:
${repoAnalysis.language}

Test command:
${repoAnalysis.testCommand}

Focused model:
${JSON.stringify(focusedModel, null, 2)}

Deterministic coverage targets:
${JSON.stringify(focusedModel.deterministicAnalysis.coverageTargets, null, 2)}

Current generated test code:
\`\`\`
${generatedTestCode}
\`\`\`

Failing test output:
\`\`\`
${testResult.output}
\`\`\`

Repository context, source implementation, imports and dependencies:
${projectContext}

Mandatory repair instructions:
1. Read the repository context again before changing the test.
2. Inspect the implementation files listed in the focused context.
3. If the failure is an unhandled exception from source code, wrap that exact call in assert.throws.
4. If the failure has actual/expected values, repair the generated test only when the generated assertion misunderstands the implementation.
5. If the implementation appears to violate documented behaviour, do not change the test to match the broken implementation.
6. Do not modify production/source code.
7. Do not use Jest/Mocha/Vitest globals when the command is node test.js.
8. Return only the full corrected test file content.
`;
  }

  parsePrimitiveValue(rawValue) {
    const value = String(rawValue ?? "").trim().replace(/,$/, "");

    if (/^-?\d+(?:\.\d+)?$/.test(value)) {
      return Number(value);
    }

    if (value === "true") return true;
    if (value === "false") return false;
    if (value === "null") return null;
    if (value === "undefined") return undefined;

    const quoted = value.match(/^['"]([\s\S]*)['"]$/);
    if (quoted) return quoted[1];

    return value;
  }

  extractActualExpectedPairs(testOutput) {
    const pairs = [];

    const strictEqualBlockPattern =
      /Expected values to be strictly equal:\s*([\s\S]*?)(?=\n\s*at\s+|\nNode\.js|\nERROR:|$)/g;

    let blockMatch;

    while ((blockMatch = strictEqualBlockPattern.exec(testOutput)) !== null) {
      const block = blockMatch[1];

      const numeric = block.match(
        /(-?\d+(?:\.\d+)?)\s*!==\s*(-?\d+(?:\.\d+)?)/
      );

      if (numeric) {
        pairs.push({
          actual: Number(numeric[1]),
          expected: Number(numeric[2]),
          source: "strict-equal-inline"
        });
      }

      const string = block.match(
        /'([^']*)'\s*!==\s*'([^']*)'|"([^"]*)"\s*!==\s*"([^"]*)"/
      );

      if (string) {
        pairs.push({
          actual: string[1] ?? string[3],
          expected: string[2] ?? string[4],
          source: "strict-equal-inline"
        });
      }
    }

    const actualExpectedObjectPattern =
      /actual:\s*([^,\n]+),\s*\n\s*expected:\s*([^,\n]+),\s*\n\s*operator:\s*['"](?:strictEqual|equal|deepStrictEqual|deepEqual)['"]/g;

    let objectMatch;

    while ((objectMatch = actualExpectedObjectPattern.exec(testOutput)) !== null) {
      pairs.push({
        actual: this.parsePrimitiveValue(objectMatch[1]),
        expected: this.parsePrimitiveValue(objectMatch[2]),
        source: "assertion-object"
      });
    }

    return pairs;
  }

  extractFailingGeneratedTestLocation(testOutput, generatedTestFile) {
    const escapedFile = generatedTestFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const stackPattern = new RegExp(`${escapedFile}:(\\d+):(\\d+)`);
    const stackMatch = testOutput.match(stackPattern);

    if (!stackMatch) return null;

    return {
      lineNumber: Number(stackMatch[1]),
      columnNumber: Number(stackMatch[2])
    };
  }

  extractUnhandledError(testOutput, generatedTestFile) {
    const messageMatch = testOutput.match(/\n(?:Error|TypeError|RangeError):\s+(.+)/);
    if (!messageMatch) return null;

    const location = this.extractFailingGeneratedTestLocation(
      testOutput,
      generatedTestFile
    );

    if (!location) return null;

    return {
      message: messageMatch[1].trim(),
      lineNumber: location.lineNumber,
      columnNumber: location.columnNumber
    };
  }

  splitTopLevelArguments(argumentText) {
    const args = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = 0; i < argumentText.length; i++) {
      const char = argumentText[i];

      if (inString) {
        current += char;

        if (char === "\\") {
          i++;
          current += argumentText[i] || "";
          continue;
        }

        if (char === stringChar) {
          inString = false;
          stringChar = "";
        }

        continue;
      }

      if (char === "'" || char === `"` || char === "`") {
        inString = true;
        stringChar = char;
        current += char;
        continue;
      }

      if (char === "(" || char === "[" || char === "{") depth++;
      if (char === ")" || char === "]" || char === "}") depth--;

      if (char === "," && depth === 0) {
        args.push(current.trim());
        current = "";
        continue;
      }

      current += char;
    }

    if (current.trim()) args.push(current.trim());

    return args;
  }

  extractAssertArguments(line) {
    const match = line.match(/assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(([\s\S]*)\)\s*;?/);

    if (!match) return null;

    const args = this.splitTopLevelArguments(match[1]);

    return {
      actualExpression: args[0] || null,
      expectedExpression: args[1] || null,
      messageExpression: args[2] || null
    };
  }

  extractAssertCallExpression(line) {
    return this.extractAssertArguments(line)?.actualExpression || null;
  }

  isNumericLiteral(value) {
    return typeof value === "number" && Number.isFinite(value);
  }

  isPrimitiveRepairableValue(value) {
    return (
      typeof value === "number" ||
      typeof value === "string" ||
      typeof value === "boolean" ||
      value === null
    );
  }

  stringifyPrimitiveForCode(value) {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (value === null) return "null";
    return String(value);
  }

  inferExpectedValueFromImplementation({
    actualExpression,
    expectedValue,
    projectContext,
    repoAnalysis
  }) {
    if (repoAnalysis.primaryLanguage !== "javascript") {
      return {
        confident: false,
        reason: "Implementation-aware deterministic repair is currently enabled for JavaScript only."
      };
    }

    if (!actualExpression) {
      return {
        confident: false,
        reason: "No actual expression found in failing assertion."
      };
    }

    const expression = actualExpression.replace(/\s+/g, " ").trim();

    if (
      /calculateCheckoutTotal\s*\(/.test(expression) &&
      /function calculateCheckoutTotal|export function calculateCheckoutTotal/.test(projectContext) &&
      /discounted \+ tax/.test(projectContext) &&
      /discountPercent = 0/.test(projectContext) &&
      /taxRate = 0\.2/.test(projectContext)
    ) {
      return {
        confident: true,
        reason:
          "calculateCheckoutTotal explicitly returns discounted + tax, with default taxRate 0.2. Expected subtotal-only assertions are invalid."
      };
    }

    if (
      /applyDiscount\s*\(/.test(expression) &&
      /function applyDiscount|export function applyDiscount/.test(projectContext) &&
      /amount - \(amount \* discountPercent \/ 100\)/.test(projectContext)
    ) {
      return {
        confident: true,
        reason:
          "applyDiscount implementation explicitly returns amount - amount * discountPercent / 100."
      };
    }

    if (
      /calculateTax\s*\(/.test(expression) &&
      /function calculateTax|export function calculateTax/.test(projectContext) &&
      /amount \* rate/.test(projectContext)
    ) {
      return {
        confident: true,
        reason:
          "calculateTax implementation explicitly returns amount * rate."
      };
    }

    if (this.isNumericLiteral(expectedValue)) {
      const likelySubtotalOnlyMessage =
        /subtotal|item price|without tax|before tax|pre-tax/i.test(expression);

      if (likelySubtotalOnlyMessage) {
        return {
          confident: false,
          reason:
            "Assertion appears semantically meaningful; do not blindly overwrite expected value."
        };
      }
    }

    return {
      confident: false,
      reason:
        "Could not prove from implementation context that replacing expected with actual is safe."
    };
  }

  replaceExpectedArgumentInLine(line, newExpectedValue) {
    const args = this.extractAssertArguments(line);

    if (!args?.expectedExpression) return line;

    const expectedExpression = args.expectedExpression.trim();
    const replacement = this.stringifyPrimitiveForCode(newExpectedValue);

    const expectedIndex = line.indexOf(expectedExpression);

    if (expectedIndex === -1) return line;

    return (
      line.slice(0, expectedIndex) +
      replacement +
      line.slice(expectedIndex + expectedExpression.length)
    );
  }

  deterministicRepairActualExpected({
    generatedTestCode,
    testResult,
    repoAnalysis,
    projectContext
  }) {
    const pairs = this.extractActualExpectedPairs(testResult.output);
    const location = this.extractFailingGeneratedTestLocation(
      testResult.output,
      repoAnalysis.generatedTestFile
    );

    if (pairs.length === 0 || !location) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "No actual/expected pair or failing generated test location found."
      };
    }

    const lines = generatedTestCode.split("\n");
    const failingIndex = location.lineNumber - 1;
    const failingLine = lines[failingIndex];

    if (!failingLine || !/assert\.(?:equal|strictEqual|deepEqual|deepStrictEqual)\s*\(/.test(failingLine)) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Failing line is not a supported assert line."
      };
    }

    const assertArgs = this.extractAssertArguments(failingLine);
    const pair = pairs[0];

    if (!assertArgs?.expectedExpression) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Expected argument not found."
      };
    }

    if (!this.isPrimitiveRepairableValue(pair.actual)) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: "Actual value is not a primitive safe repair value."
      };
    }

    const decision = this.inferExpectedValueFromImplementation({
      actualExpression: assertArgs.actualExpression,
      expectedValue: pair.expected,
      projectContext,
      repoAnalysis
    });

    if (!decision.confident) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0,
        reason: decision.reason
      };
    }

    lines[failingIndex] = this.replaceExpectedArgumentInLine(
      failingLine,
      pair.actual
    );

    return {
      repaired: lines[failingIndex] !== failingLine,
      code: lines.join("\n"),
      replacements: lines[failingIndex] !== failingLine ? 1 : 0,
      reason: decision.reason
    };
  }

  deterministicRepairUnhandledError({
    generatedTestCode,
    testResult,
    repoAnalysis
  }) {
    if (repoAnalysis.primaryLanguage !== "javascript") {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const error = this.extractUnhandledError(
      testResult.output,
      repoAnalysis.generatedTestFile
    );

    if (!error?.lineNumber) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const lines = generatedTestCode.split("\n");
    const index = error.lineNumber - 1;
    const failingLine = lines[index];

    if (!failingLine || /assert\.throws\s*\(/.test(failingLine)) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const expression =
      this.extractAssertCallExpression(failingLine) ||
      failingLine.replace(/;?\s*$/, "").trim();

    if (!expression) {
      return {
        repaired: false,
        code: generatedTestCode,
        replacements: 0
      };
    }

    const indent = failingLine.match(/^\s*/)?.[0] || "";
    const escapedMessage = JSON.stringify(error.message);

    lines[index] =
      `${indent}assert.throws(() => ${expression}, { message: ${escapedMessage} });`;

    return {
      repaired: true,
      code: lines.join("\n"),
      replacements: 1
    };
  }

  deterministicRepairGeneratedTests({
    generatedTestCode,
    testResult,
    repoAnalysis,
    projectContext
  }) {
    let code = generatedTestCode;
    let totalReplacements = 0;

    const valueRepair = this.deterministicRepairActualExpected({
      generatedTestCode: code,
      testResult,
      repoAnalysis,
      projectContext
    });

    if (valueRepair.repaired) {
      code = valueRepair.code;
      totalReplacements += valueRepair.replacements;
    }

    const errorRepair = this.deterministicRepairUnhandledError({
      generatedTestCode: code,
      testResult,
      repoAnalysis
    });

    if (errorRepair.repaired) {
      code = errorRepair.code;
      totalReplacements += errorRepair.replacements;
    }

    return {
      repaired: totalReplacements > 0,
      code,
      replacements: totalReplacements,
      notes: [valueRepair.reason].filter(Boolean)
    };
  }

  async generateTests({ repoAnalysis, focusedModel, projectContext }) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TEST_GENERATION_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: this.buildGenerationPrompt({
            repoAnalysis,
            focusedModel,
            projectContext
          })
        }
      ]
    });

    return cleanCodeBlock(completion.choices[0]?.message?.content || "");
  }

  async repairGeneratedTests({
    repoAnalysis,
    focusedModel,
    projectContext,
    generatedTestCode,
    testResult
  }) {
    const deterministicRepair = this.deterministicRepairGeneratedTests({
      generatedTestCode,
      testResult,
      repoAnalysis,
      projectContext
    });

    if (deterministicRepair.repaired) {
      return deterministicRepair.code;
    }

    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: TEST_REPAIR_SYSTEM_PROMPT
        },
        {
          role: "user",
          content: this.buildRepairPrompt({
            repoAnalysis,
            focusedModel,
            projectContext,
            generatedTestCode,
            testResult
          })
        }
      ]
    });

    return cleanCodeBlock(completion.choices[0]?.message?.content || "");
  }

  writeGeneratedTests(repoAnalysis, testCode) {
    const outputPath = safeJoin(this.repoPath, repoAnalysis.generatedTestFile);
    fs.writeFileSync(outputPath, testCode);

    return {
      file: repoAnalysis.generatedTestFile,
      absolutePath: outputPath
    };
  }

  run(repoAnalysis) {
    return runTests(this.repoPath, repoAnalysis);
  }

  writeQaReport({ repoAnalysis, focusedModel, testResult }) {
    const report = `# QA Report

## Summary

- Language: ${repoAnalysis.language}
- Primary language key: ${repoAnalysis.primaryLanguage}
- Test command: \`${repoAnalysis.testCommand}\`
- Generated test file: \`${repoAnalysis.generatedTestFile}\`
- Tests passed: ${testResult.passed ? "Yes" : "No"}
- Duration: ${testResult.durationMs}ms

## Focused Files

${focusedModel.focusedFiles.map((file) => `- ${file}`).join("\n")}

## Deterministic Coverage Targets

\`\`\`json
${JSON.stringify(focusedModel.deterministicAnalysis.coverageTargets, null, 2)}
\`\`\`

## Test Output

\`\`\`
${testResult.output}
\`\`\`
`;

    fs.writeFileSync(path.join(this.repoPath, "qa-report.md"), report);
  }
}