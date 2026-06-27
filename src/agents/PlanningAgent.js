import fs from "fs";
import path from "path";

import { cleanCodeBlock } from "../utils/stringUtils.js";
import DeterministicValueBuilder from "../analysis/DeterministicValueBuilder.js";

const VALID_SOURCES = new Set([
  "README",
  "code",
  "deterministic-analysis",
  "dependency-graph",
  "call-graph",
  "deterministic-test-data-builder",
  "inferred",
  "absence-of-docs",
  "ambiguous-code"
]);

const VALID_CONFIDENCE = new Set(["high", "medium", "low"]);

export default class PlanningAgent {
  constructor(repoPath, openAiClient) {
    this.repoPath = repoPath;
    this.client = openAiClient;
    this.valueBuilder = new DeterministicValueBuilder();
  }

  buildPlanningPrompt({ repoAnalysis, focusedModel, projectContext }) {
    return `
You are a senior Staff QA Engineer.

Study this repository carefully.

Do NOT generate test code.

Produce a structured JSON QA plan.

Rules:
- Do not invent formulas.
- Do not invent business rules.
- Do not invent preconditions, postconditions, invariants or state machines.
- If documentation is missing, source code is the current implementation truth.
- If documentation and implementation conflict, record requirementsVsImplementation.
- Keep testExamples language-neutral.
- Prioritised test plan entries must be concrete and meaningful.
- Do not create "unknown" or empty prioritised test plan entries.
- Only mark test examples safe when the expected value is clearly derivable.

Repository analysis:
${JSON.stringify(repoAnalysis, null, 2)}

Focused model:
${JSON.stringify(focusedModel, null, 2)}

Repository context:
${projectContext}

Return ONLY valid JSON with this structure:

{
  "summary": "short summary of what the system does",
  "evidenceSummary": {
    "readmeAvailable": true,
    "codeAvailable": true,
    "deterministicAnalysisAvailable": true,
    "dependencyGraphAvailable": true,
    "callGraphAvailable": true,
    "primaryEvidence": ["README", "code", "deterministic-analysis", "dependency-graph", "call-graph", "inferred"]
  },
  "publicApis": [],
  "businessRules": [],
  "algorithmSteps": [],
  "calculationFormulas": [],
  "validationRules": [],
  "stateMachine": [],
  "dataFlow": [],
  "dependencyFlows": [],
  "sideEffects": [],
  "preconditions": [],
  "postconditions": [],
  "invariants": [],
  "happyPaths": [],
  "edgeCases": [],
  "exceptionPaths": [],
  "riskAreas": [],
  "mutationSensitiveBehaviours": [],
  "testExamples": [],
  "missingRequirements": [],
  "requirementsVsImplementation": [],
  "prioritisedTestPlan": []
}
`;
  }

  async createPlan({ repoAnalysis, focusedModel, projectContext }) {
    const completion = await this.client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a senior Staff QA Engineer. Produce only valid JSON. Do not generate test code. Be conservative and evidence-based."
        },
        {
          role: "user",
          content: this.buildPlanningPrompt({
            repoAnalysis,
            focusedModel,
            projectContext
          })
        }
      ]
    });

    const raw = cleanCodeBlock(completion.choices[0]?.message?.content || "");
    const parsed = this.parsePlan(raw);

    return this.normalisePlan(parsed, {
      repoAnalysis,
      focusedModel,
      projectContext
    });
  }

  parsePlan(raw) {
    try {
      return JSON.parse(raw);
    } catch {
      return this.createFallbackPlan(raw);
    }
  }

  createFallbackPlan(rawOutput) {
    return {
      summary: "Planning agent returned non-JSON output.",
      evidenceSummary: {},
      publicApis: [],
      businessRules: [],
      algorithmSteps: [],
      calculationFormulas: [],
      validationRules: [],
      stateMachine: [],
      dataFlow: [],
      dependencyFlows: [],
      sideEffects: [],
      preconditions: [],
      postconditions: [],
      invariants: [],
      happyPaths: [],
      edgeCases: [],
      exceptionPaths: [],
      riskAreas: [],
      mutationSensitiveBehaviours: [],
      testExamples: [],
      missingRequirements: [],
      requirementsVsImplementation: [],
      prioritisedTestPlan: [],
      rawOutput
    };
  }

  normalisePlan(plan, context = {}) {
    const normalised = {
      summary: plan.summary || this.buildFallbackSummary(context.repoAnalysis),
      evidenceSummary: this.normaliseEvidenceSummary(plan.evidenceSummary || {}, context),
      publicApis: this.normaliseItems(this.ensureArray(plan.publicApis)),
      businessRules: this.normaliseItems(this.ensureArray(plan.businessRules)),
      algorithmSteps: this.normaliseAlgorithmSteps(this.ensureArray(plan.algorithmSteps)),
      calculationFormulas: this.normaliseCalculationFormulas(
        this.ensureArray(plan.calculationFormulas),
        this.ensureArray(plan.algorithmSteps)
      ),
      validationRules: this.normaliseItems(this.ensureArray(plan.validationRules)),
      stateMachine: this.normaliseStateMachines(this.ensureArray(plan.stateMachine)),
      dataFlow: this.normaliseItems(this.ensureArray(plan.dataFlow)),
      dependencyFlows: this.normaliseItems(this.ensureArray(plan.dependencyFlows)),
      sideEffects: this.normaliseItems(this.ensureArray(plan.sideEffects)),
      preconditions: this.normaliseAssumptionItems(this.ensureArray(plan.preconditions), "precondition"),
      postconditions: this.normaliseAssumptionItems(this.ensureArray(plan.postconditions), "postcondition"),
      invariants: this.normaliseAssumptionItems(this.ensureArray(plan.invariants), "invariant"),
      happyPaths: this.normaliseConcreteScenarioItems(
        this.ensureArray(plan.happyPaths),
        "scenario",
        "expectedBehaviour"
      ),
      edgeCases: this.normaliseConcreteScenarioItems(
        this.ensureArray(plan.edgeCases),
        "case",
        "expectedBehaviour"
      ),
      exceptionPaths: this.normaliseConcreteScenarioItems(
        this.ensureArray(plan.exceptionPaths),
        "trigger",
        "expectedException"
      ),
      riskAreas: this.normaliseItems(this.ensureArray(plan.riskAreas)),
      mutationSensitiveBehaviours: this.normaliseItems(this.ensureArray(plan.mutationSensitiveBehaviours)),
      testExamples: this.normaliseTestExamples(this.ensureArray(plan.testExamples)),
      missingRequirements: this.normaliseItems(this.ensureArray(plan.missingRequirements)),
      requirementsVsImplementation: this.ensureArray(plan.requirementsVsImplementation),
      prioritisedTestPlan: this.normaliseItems(this.ensureArray(plan.prioritisedTestPlan))
    };

    normalised.publicApis = this.ensurePublicApisFromRepoAnalysis(
      normalised.publicApis,
      context.repoAnalysis
    );

    normalised.testExamples = this.mergeTestExamples(
      this.generateDeterministicTestExamples(normalised, context),
      normalised.testExamples
    );

    normalised.testExamples = this.ensureTestExamples(normalised, context);
    normalised.prioritisedTestPlan = this.ensurePrioritisedTestPlan(normalised, context);

    return normalised;
  }

  buildFallbackSummary(repoAnalysis) {
    const language = repoAnalysis?.language || repoAnalysis?.primaryLanguage || "unknown language";
    return `Repository analysed as ${language}.`;
  }

  ensurePublicApisFromRepoAnalysis(currentApis, repoAnalysis) {
    const validCurrent = this.ensureArray(currentApis).filter(
      (api) =>
        api?.name &&
        api.name !== "unknown" &&
        api.file &&
        api.file !== "unknown file"
    );

    const repoApis = this.extractPublicApisFromRepoAnalysis(repoAnalysis);
    const merged = [];
    const seen = new Set();

    for (const api of [...repoApis, ...validCurrent]) {
      const key = `${api.file}:${api.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      merged.push(api);
    }

    return merged;
  }

  extractPublicApisFromRepoAnalysis(repoAnalysis) {
    const result = [];
    const seen = new Set();

    for (const mod of repoAnalysis?.modules || []) {
      const file = mod.file || "unknown file";
      const functions = this.ensureArray(mod.functions);
      const exportsList = this.ensureArray(mod.exports).map(String);

      for (const fn of functions) {
        const name = typeof fn === "string" ? fn : fn?.name;
        if (!name || name === "unknown") continue;

        const isExported = exportsList.includes(name);
        const isEntryPoint =
          this.ensureArray(repoAnalysis?.entryPoints).includes(file) ||
          isExported ||
          exportsList.length === 0;

        if (!isEntryPoint) continue;

        const key = `${file}:${name}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          file,
          name,
          type: "function",
          purpose: `Public function detected from repository analysis: ${name}.`,
          inputs: this.ensureArray(fn?.params || fn?.parameters).map(String),
          outputs: ["Return value or exception as implemented."],
          sideEffects: [],
          source: "code",
          confidence: "high",
          evidence: [`Detected function ${name} in ${file}.`]
        });
      }

      for (const exportedName of exportsList) {
        if (!exportedName || exportedName === "unknown") continue;

        const key = `${file}:${exportedName}`;
        if (seen.has(key)) continue;
        seen.add(key);

        result.push({
          file,
          name: exportedName,
          type: "function",
          purpose: `Exported API detected from repository analysis: ${exportedName}.`,
          inputs: [],
          outputs: ["Return value or exception as implemented."],
          sideEffects: [],
          source: "code",
          confidence: "high",
          evidence: [`Detected export ${exportedName} in ${file}.`]
        });
      }
    }

    return result;
  }

  generateDeterministicTestExamples(plan, context) {
    const examples = [];

    for (const api of plan.publicApis) {
      if (!api?.name || api.name === "unknown") continue;

      const model = this.extractFunctionModel(api.name, context);
      if (!model) continue;

      const returnExample = this.tryBuildReturnExampleFromFunctionModel(api, model, context);
      if (returnExample) examples.push(returnExample);

      examples.push(...this.tryBuildValidationExamples(api, model, context));
    }

    return this.dedupeExamples(examples).map((example) =>
      this.normaliseTestExamples([example])[0]
    );
  }

normaliseFunctionParameters(rawParams = []) {
  const params = [];
  const destructuredParams = [];
  const parameterAliases = {};

  for (const [index, rawParam] of rawParams.entries()) {
    const raw = String(rawParam || "").trim();

    if (!raw) {
      continue;
    }

    if (this.isObjectDestructuredParameter(raw)) {
      const syntheticName = this.createSyntheticObjectParameterName(index);
      const properties = this.extractObjectDestructuredProperties(raw);

      params.push(syntheticName);

      destructuredParams.push({
        index,
        syntheticName,
        raw,
        type: "object",
        properties
      });

      for (const property of properties) {
        if (!property || !property.name) {
          continue;
        }

        if (property.alias) {
          parameterAliases[property.alias] = `${syntheticName}.${property.name}`;
        } else {
          parameterAliases[property.name] = `${syntheticName}.${property.name}`;
        }
      }

      continue;
    }

    if (this.isArrayDestructuredParameter(raw)) {
      const syntheticName = this.createSyntheticArrayParameterName(index);
      const items = this.extractArrayDestructuredItems(raw);

      params.push(syntheticName);

      destructuredParams.push({
        index,
        syntheticName,
        raw,
        type: "array",
        items
      });

      for (const [itemIndex, item] of items.entries()) {
        if (!item) {
          continue;
        }

        parameterAliases[item] = `${syntheticName}[${itemIndex}]`;
      }

      continue;
    }

    const cleanName = this.cleanParameterName(raw);

    if (cleanName) {
      params.push(cleanName);
    }
  }

  return {
    params,
    destructuredParams,
    parameterAliases
  };
}

isObjectDestructuredParameter(rawParam) {
  const text = String(rawParam || "").trim();
  return text.startsWith("{") && text.endsWith("}");
}

isArrayDestructuredParameter(rawParam) {
  const text = String(rawParam || "").trim();
  return text.startsWith("[") && text.endsWith("]");
}

createSyntheticObjectParameterName(index) {
  return index === 0 ? "input" : `input${index + 1}`;
}

createSyntheticArrayParameterName(index) {
  return index === 0 ? "items" : `items${index + 1}`;
}

extractObjectDestructuredProperties(rawParam) {
  const inner = String(rawParam || "")
    .trim()
    .replace(/^\{/, "")
    .replace(/\}$/, "")
    .trim();

  if (!inner) return [];

  return this.splitTopLevelArguments(inner)
    .map((part) => this.parseObjectDestructuredProperty(part))
    .filter(Boolean);
}

parseObjectDestructuredProperty(part) {
  const text = String(part || "").trim();

  if (!text || text.startsWith("...")) return null;

  const withoutDefault = this.stripTopLevelDefaultValue(text);
  const colonIndex = this.findTopLevelCharacter(withoutDefault, ":");

  if (colonIndex !== -1) {
    const name = withoutDefault.slice(0, colonIndex).trim();
    const aliasExpression = withoutDefault.slice(colonIndex + 1).trim();

    if (
      aliasExpression.startsWith("{") ||
      aliasExpression.startsWith("[")
    ) {
      return {
        name: this.cleanObjectPropertyName(name),
        alias: null,
        nested: aliasExpression
      };
    }

    return {
      name: this.cleanObjectPropertyName(name),
      alias: this.cleanParameterName(aliasExpression)
    };
  }

  return {
    name: this.cleanObjectPropertyName(withoutDefault),
    alias: null
  };
}

extractArrayDestructuredItems(rawParam) {
  const inner = String(rawParam || "")
    .trim()
    .replace(/^\[/, "")
    .replace(/\]$/, "")
    .trim();

  if (!inner) return [];

  return this.splitTopLevelArguments(inner)
    .map((item) => this.cleanParameterName(this.stripTopLevelDefaultValue(item)))
    .filter(Boolean);
}

stripTopLevelDefaultValue(text) {
  const value = String(text || "").trim();
  const equalsIndex = this.findTopLevelCharacter(value, "=");

  if (equalsIndex === -1) return value;

  return value.slice(0, equalsIndex).trim();
}

cleanObjectPropertyName(name) {
  return String(name || "")
    .trim()
    .replace(/^["'`]|["'`]$/g, "")
    .replace(/[^\w$]/g, "");
}

cleanParameterName(name) {
  return String(name || "")
    .trim()
    .replace(/^\.\.\./, "")
    .replace(/=.*/s, "")
    .trim()
    .replace(/[^\w$]/g, "");
}

rewriteBodyForDestructuredParams(body, aliases = {}) {
  let rewritten = String(body || "");

  const entries = Object.entries(aliases).sort(
    ([a], [b]) => b.length - a.length
  );

  for (const [localName, replacement] of entries) {
    const escaped = this.escapeRegExp(localName);

    rewritten = rewritten.replace(
      new RegExp(`\\b${escaped}\\b`, "g"),
      replacement
    );
  }

  return rewritten;
}

  extractFunctionModel(functionName, { repoAnalysis, projectContext }) {
  const file = this.findFileForApi(functionName, repoAnalysis);
  const source = this.extractFunctionSource(
    functionName,
    repoAnalysis,
    projectContext
  );

  if (!source) return null;

  const rawParams = this.extractFunctionParams(functionName, source);
  const body = this.extractFunctionBody(source);

  if (!rawParams.length || !body) return null;

  const destructuringModel = this.normaliseFunctionParameters(rawParams);

  return {
    name: functionName,
    file,
    source,
    params: destructuringModel.params,
    rawParams,
    destructuredParams: destructuringModel.destructuredParams,
    parameterAliases: destructuringModel.parameterAliases,
    body: this.rewriteBodyForDestructuredParams(
      body,
      destructuringModel.parameterAliases
    ),
    originalBody: body,
    assignments: this.extractAssignments(
      this.rewriteBodyForDestructuredParams(
        body,
        destructuringModel.parameterAliases
      )
    ),
    returnExpression: this.extractReturnExpression(
      this.rewriteBodyForDestructuredParams(
        body,
        destructuringModel.parameterAliases
      )
    ),
    throwStatements: this.extractThrowStatements(
      this.rewriteBodyForDestructuredParams(
        body,
        destructuringModel.parameterAliases
      )
    ),
    validationConditions: this.extractValidationConditions(
      this.rewriteBodyForDestructuredParams(
        body,
        destructuringModel.parameterAliases
      )
    )
  };
}

  tryBuildReturnExampleFromFunctionModel(api, model, context) {
  if (!model.returnExpression && !model.body) return null;

  const valueContext = this.buildValueContextForModel(model);
  const env = this.buildGenericValidEnvironment(model, valueContext);

  const branchCheck = this.validateExecutionPathForReturnExample(
    model,
    env,
    context
  );

  if (!branchCheck.safe) {
    return null;
  }

  const evaluation = this.evaluateFunctionModel(model, env, context, new Set());

  if (!evaluation.success) return null;

  return this.createReturnExample({
    id: this.createExampleId(model.name, "deterministic-return"),
    targetApi: model.name,
    testName: `Deterministic example: ${model.name} return behaviour`,
    scenario: `Call ${model.name} with valid representative inputs.`,
    args: model.params.map((param) => this.formatArgumentForPlan(env[param])),
    expectedValue: evaluation.value,
    expectedCalculation: evaluation.steps.join("; "),
    evidence: [
      `Expected value computed by evaluating reachable statements from ${
        api.file || model.file || model.name
      }.`,
      `Execution path validated: ${branchCheck.reason}`
    ],
    covers: [
      "publicApi",
      "algorithmStep",
      "calculationFormula",
      "dataFlow",
      "dependencyFlow",
      "mutation"
    ]
  });
}

    tryBuildValidationExamples(api, model, context) {
    const examples = [];

    for (const condition of model.validationConditions) {
      const exception = this.findExceptionForCondition(condition, model);

      if (!exception) {
        continue;
      }

            const invalidEnv = this.buildInvalidEnvironmentForCondition(model, condition, {
        body: model.body,
        conditions: model.validationConditions,
        condition
      });

      if (!invalidEnv) {
        continue;
      }

      examples.push(
        this.createExceptionExample({
          id: this.createExampleId(model.name, `deterministic-${condition}`),
          targetApi: model.name,
          testName: `Deterministic example: ${model.name} validation exception`,
          scenario: `Call ${model.name} with invalid input for validation condition: ${condition}.`,
          args: model.params.map((param) => this.formatArgumentForPlan(invalidEnv[param])),
          expectedException: exception,
          evidence: [
            `Detected validation condition in ${api.file || model.file || model.name}: ${condition}`,
            `Detected direct throw for validation condition: ${exception}`
          ],
          covers: ["validationRule", "exceptionPath", "mutation"]
        })
      );
    }

    return this.dedupeExamples(examples);
  }

evaluateNestedStatement(statement, env, context, stack, steps) {
  if (statement.type === "assignment") {
    const result = this.evaluateExpression(
      statement.expression,
      env,
      context,
      stack
    );

    if (!result.success) {
      return {
        failed: true,
        result: {
          success: false,
          reason: result.reason,
          steps
        }
      };
    }

    env[statement.name] = result.value;
    steps.push(`${statement.name} = ${result.description}`);
    return { failed: false, returned: false };
  }

  if (statement.type === "expression") {
    const result = this.evaluateExpression(
      statement.expression,
      env,
      context,
      stack
    );

    if (!result.success) {
      return {
        failed: true,
        result: {
          success: false,
          reason: result.reason,
          steps
        }
      };
    }

    steps.push(`expression ${statement.expression} = ${result.description}`);
    return { failed: false, returned: false };
  }

  if (statement.type === "return") {
    const returnResult = this.evaluateExpression(
      statement.expression,
      env,
      context,
      stack
    );

    if (!returnResult.success) {
      return {
        failed: true,
        result: {
          success: false,
          reason: returnResult.reason,
          steps
        }
      };
    }

    steps.push(`result = ${returnResult.description}`);

    return {
      failed: false,
      returned: true,
      result: {
        success: true,
        value: returnResult.value,
        steps
      }
    };
  }

  if (statement.type === "if-throw") {
    const condition = this.evaluateBooleanCondition(statement.condition, env);

    if (!condition.success) {
      return {
        failed: true,
        result: {
          success: false,
          reason: `Could not evaluate throw guard: ${statement.condition}`,
          steps
        }
      };
    }

    steps.push(`throw guard ${statement.condition} = ${condition.value}`);

    if (condition.value === true) {
      return {
        failed: true,
        result: {
          success: false,
          reason: `Input hits throw path: ${statement.condition}`,
          steps
        }
      };
    }

    return { failed: false, returned: false };
  }

  return { failed: false, returned: false };
}

  evaluateFunctionModel(model, inputEnv, context, stack) {
  if (stack.has(model.name)) {
    return {
      success: false,
      reason: "Recursive evaluation avoided.",
      steps: []
    };
  }

  stack.add(model.name);

  const env = { ...inputEnv };
  const steps = [];

  const statements = this.extractExecutableStatements(model.body);

  if (statements.length === 0) {
    stack.delete(model.name);

    return {
      success: false,
      reason: "No executable statements found.",
      steps
    };
  }

  for (const statement of statements) {
    if (statement.type === "assignment") {
      const result = this.evaluateExpression(
        statement.expression,
        env,
        context,
        stack
      );

      if (!result.success) {
        stack.delete(model.name);

        return {
          success: false,
          reason: result.reason,
          steps
        };
      }

      env[statement.name] = result.value;
      steps.push(`${statement.name} = ${result.description}`);
      continue;
    }

    if (statement.type === "expression") {
      const result = this.evaluateExpression(
        statement.expression,
        env,
        context,
        stack
      );

      if (!result.success) {
        stack.delete(model.name);

        return {
          success: false,
          reason: result.reason,
          steps
        };
      }

      steps.push(`expression ${statement.expression} = ${result.description}`);
      continue;
    }

    if (statement.type === "if-return") {
      const condition = this.evaluateBooleanCondition(statement.condition, env);

      if (!condition.success) {
        stack.delete(model.name);

        return {
          success: false,
          reason: `Could not evaluate return guard: ${statement.condition}`,
          steps
        };
      }

      steps.push(`guard ${statement.condition} = ${condition.value}`);

      if (condition.value === true) {
        const returnResult = this.evaluateExpression(
          statement.returnExpression,
          env,
          context,
          stack
        );

        stack.delete(model.name);

        if (!returnResult.success) {
          return {
            success: false,
            reason: returnResult.reason,
            steps
          };
        }

        steps.push(`result = ${returnResult.description}`);

        return {
          success: true,
          value: returnResult.value,
          steps
        };
      }

      continue;
    }

    if (statement.type === "if-throw") {
      const condition = this.evaluateBooleanCondition(statement.condition, env);

      if (!condition.success) {
        stack.delete(model.name);

        return {
          success: false,
          reason: `Could not evaluate throw guard: ${statement.condition}`,
          steps
        };
      }

      steps.push(`throw guard ${statement.condition} = ${condition.value}`);

      if (condition.value === true) {
        stack.delete(model.name);

        return {
          success: false,
          reason: `Input hits throw path: ${statement.condition}`,
          steps
        };
      }

      continue;
    }

    if (statement.type === "if-branch") {
      const condition = this.evaluateBooleanCondition(statement.condition, env);

      if (!condition.success) {
        stack.delete(model.name);

        return {
          success: false,
          reason: `Could not evaluate branch guard: ${statement.condition}`,
          steps
        };
      }

      steps.push(`branch ${statement.condition} = ${condition.value}`);

      if (condition.value === true) {
        for (const nestedStatement of statement.statements) {
          const nestedResult = this.evaluateNestedStatement(
            nestedStatement,
            env,
            context,
            stack,
            steps
          );

          if (nestedResult?.returned) {
            stack.delete(model.name);
            return nestedResult.result;
          }

          if (nestedResult?.failed) {
            stack.delete(model.name);
            return nestedResult.result;
          }
        }
      }

      continue;
    }

    if (statement.type === "return") {
      const returnResult = this.evaluateExpression(
        statement.expression,
        env,
        context,
        stack
      );

      stack.delete(model.name);

      if (!returnResult.success) {
        return {
          success: false,
          reason: returnResult.reason,
          steps
        };
      }

      steps.push(`result = ${returnResult.description}`);

      return {
        success: true,
        value: returnResult.value,
        steps
      };
    }
  }

  stack.delete(model.name);

  return {
    success: false,
    reason: "No reachable return statement found.",
    steps
  };
}

  evaluateExpression(expression, env, context, stack) {
  const expr = String(expression || "").trim();

  if (!expr) return { success: false, reason: "Empty expression." };

  const conditionalResult = this.evaluateConditionalExpression(expr, env, context, stack);
  if (conditionalResult.success) return conditionalResult;

  const objectResult = this.evaluateObjectExpression(expr, env, context, stack);
  if (objectResult.success) return objectResult;

  const memberResult = this.evaluateMemberExpression(expr, env);
  if (memberResult.success) return memberResult;

  const stringResult = this.evaluateStringExpression(expr);
  if (stringResult.success) return stringResult;

  const booleanResult = this.evaluateBooleanLiteralExpression(expr);
  if (booleanResult.success) return booleanResult;

  const reduceResult = this.evaluateReduceExpression(expr, env, context, stack);
  if (reduceResult.success) return reduceResult;

  const callResult = this.evaluateFunctionCallExpression(expr, env, context, stack);
  if (callResult.success) return callResult;

  const arithmeticResult = this.evaluateArithmeticExpression(expr, env);
  if (arithmeticResult.success) return arithmeticResult;

  const literalResult = this.evaluateLiteralExpression(expr);
  if (literalResult.success) return literalResult;

  const resolved = this.resolveValue(expr, env);

  if (resolved !== undefined) {
    return {
      success: true,
      value: resolved,
      description: `${expr} = ${JSON.stringify(resolved)}`
    };
  }

  return {
    success: false,
    reason: `Unsupported expression: ${expr}`
  };
}

  evaluateReduceExpression(expression, env) {
    const expr = String(expression || "").trim();

    const match =
      expr.match(
        /^([A-Za-z_$][\w$]*)\.reduce\s*\(\s*\(([^,]+),\s*([^)]+)\)\s*=>\s*\{\s*return\s+([\s\S]+?);?\s*\}\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/
      ) ||
      expr.match(
        /^([A-Za-z_$][\w$]*)\.reduce\s*\(\s*\(([^,]+),\s*([^)]+)\)\s*=>\s*([\s\S]+?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)$/
      );

    if (!match) return { success: false };

    const arrayName = match[1].trim();
    const accumulatorName = match[2].trim();
    const itemName = match[3].trim();
    const reducerExpression = match[4].trim();
    const initialValue = Number(match[5]);
    const arrayValue = env[arrayName];

    if (!Array.isArray(arrayValue)) {
      return {
        success: false,
        reason: `${arrayName} is not an array.`
      };
    }

    let total = initialValue;
    const iterationDescriptions = [];

    for (const item of arrayValue) {
      const localEnv = {
        ...env,
        [accumulatorName]: total,
        [itemName]: item
      };

      const evaluated = this.evaluateArithmeticExpression(reducerExpression, localEnv);
      if (!evaluated.success) return evaluated;

      total = evaluated.value;
      iterationDescriptions.push(evaluated.description);
    }

    return {
      success: true,
      value: total,
      description: `${arrayName}.reduce = ${iterationDescriptions.join(" -> ")} = ${total}`
    };
  }

  evaluateFunctionCallExpression(expression, env, context, stack) {
  const match = String(expression || "")
    .trim()
    .match(/^([A-Za-z_$][\w$]*)\s*\(([\s\S]*)\)$/);

  if (!match) return { success: false };

  const functionName = match[1];
  const argExpressions = this.splitTopLevelArguments(match[2]);
  const functionModel = this.extractFunctionModel(functionName, context);

  if (!functionModel) {
    return {
      success: false,
      reason: `Function model not found for ${functionName}.`
    };
  }

  const childEnv = {};

  for (let i = 0; i < functionModel.params.length; i++) {
    const param = functionModel.params[i];
    const argExpression = argExpressions[i];

    if (argExpression === undefined) {
      return {
        success: false,
        reason: `Missing argument ${i + 1} for ${functionName}.`
      };
    }

    const evaluatedArg = this.evaluateExpression(
      argExpression,
      env,
      context,
      stack
    );

    if (evaluatedArg.success) {
      childEnv[param] = evaluatedArg.value;
      continue;
    }

    const rawValue = this.resolveValue(argExpression, env);

    if (rawValue === undefined) {
      return {
        success: false,
        reason: `Could not evaluate argument ${argExpression}.`
      };
    }

    childEnv[param] = rawValue;
  }

  const result = this.evaluateFunctionModel(
    functionModel,
    childEnv,
    context,
    stack
  );

  if (!result.success) return result;

  return {
    success: true,
    value: result.value,
description: `${functionName}(${argExpressions.join(", ")}) = ${this.formatValueForDescription(result.value)}`  };
}

  evaluateArithmeticExpression(expression, env) {
    const expr = String(expression || "").trim();
    const resolvedExpression = this.replaceIdentifiersWithValues(expr, env);

    if (!/^[\d\s.+\-*/()%]+$/.test(resolvedExpression)) {
      return {
        success: false,
        reason: `Expression contains unsupported tokens after resolution: ${resolvedExpression}`
      };
    }

    try {
      const value = Function(`"use strict"; return (${resolvedExpression});`)();

      if (typeof value !== "number" || Number.isNaN(value)) {
        return {
          success: false,
          reason: "Expression did not evaluate to a valid number."
        };
      }

      return {
        success: true,
        value,
        description: `${expr} = ${resolvedExpression} = ${value}`
      };
    } catch {
      return {
        success: false,
        reason: `Could not evaluate expression: ${expr}`
      };
    }
  }

  evaluateLiteralExpression(expression) {
    const expr = String(expression || "").trim();

    if (/^-?\d+(?:\.\d+)?$/.test(expr)) {
      return {
        success: true,
        value: Number(expr),
        description: `${expr} = ${Number(expr)}`
      };
    }

    return { success: false };
  }

  replaceIdentifiersWithValues(expression, env) {
    let output = String(expression || "");

    const paths = [...output.matchAll(/\b[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+\b/g)]
      .map((match) => match[0])
      .sort((a, b) => b.length - a.length);

    for (const pathExpression of paths) {
      const value = this.resolvePath(pathExpression, env);

      if (typeof value === "number") {
        output = output.replaceAll(pathExpression, String(value));
      }
    }

    const identifiers = [...output.matchAll(/\b[A-Za-z_$][\w$]*\b/g)]
      .map((match) => match[0])
      .sort((a, b) => b.length - a.length);

    for (const identifier of identifiers) {
      const value = env[identifier];

      if (typeof value === "number") {
        output = output.replace(
          new RegExp(`\\b${this.escapeRegExp(identifier)}\\b`, "g"),
          String(value)
        );
      }
    }

    return output;
  }

  resolveValue(expression, env) {
    const expr = String(expression || "").trim();

    if (/^-?\d+(?:\.\d+)?$/.test(expr)) return Number(expr);
    if (env[expr] !== undefined) return env[expr];

    const pathValue = this.resolvePath(expr, env);
    if (pathValue !== undefined) return pathValue;

    return undefined;
  }

  resolvePath(pathExpression, env) {
    const parts = String(pathExpression || "").split(".");
    let current = env[parts[0]];

    for (const part of parts.slice(1)) {
      if (current === undefined || current === null) return undefined;
      current = current[part];
    }

    return current;
  }

  buildGenericValidEnvironment(model, valueContext = {}) {
  const context = {
    ...this.buildValueContextForModel(model),
    ...valueContext
  };

  const env = {};

  for (const param of model.params) {
    env[param] = this.valueBuilder.buildValidValue(model.name, param, context);
  }

  return env;
}

  

   buildInvalidEnvironmentForCondition(model, condition, valueContext = {}) {
  const context = {
    ...this.buildValueContextForModel(model),
    ...valueContext,
    condition
  };

  const args = this.valueBuilder.buildInvalidArgsForCondition(
    model.name,
    model.params,
    condition,
    context
  );

  if (!Array.isArray(args) || args.length === 0) return null;

  const env = {};

  for (let i = 0; i < model.params.length; i++) {
    env[model.params[i]] = args[i];
  }

  const branchCheck = this.validateExecutionPathForExceptionExample(
    model,
    env,
    condition
  );

  if (!branchCheck.safe) {
    return null;
  }

  return env;
}

    findExceptionForCondition(condition, model) {
    const body = String(model.body || "");
    const conditionText = String(condition || "").trim();

    if (!conditionText) return null;

    const conditionIndex = body.indexOf(conditionText);
    if (conditionIndex === -1) return null;

    const afterCondition = body.slice(conditionIndex);
    const blockStart = afterCondition.indexOf("{");

    if (blockStart === -1) return null;

    const absoluteBlockStart = conditionIndex + blockStart;
    const absoluteBlockEnd = this.findMatchingBrace(body, absoluteBlockStart);

    if (absoluteBlockEnd === -1) return null;

    const blockBody = body.slice(absoluteBlockStart, absoluteBlockEnd + 1);

    const jsMessage = blockBody.match(
      /throw\s+new\s+Error\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/
    );

    if (jsMessage) return jsMessage[1];

    const pythonMessage = blockBody.match(
      /raise\s+[A-Za-z_][A-Za-z0-9_]*\s*\(\s*["']([^"']+)["']\s*\)/
    );

    if (pythonMessage) return pythonMessage[1];

    return null;
  }







buildValueContextForModel(model) {
  return {
    body: model.body,
    source: model.source,
    conditions: model.validationConditions,
    returnExpression: model.returnExpression,
    params: model.params
  };
}

validateExecutionPathForReturnExample(model, env, context = {}) {
  const statements = this.extractExecutableStatements(model.body);

  for (const statement of statements) {
    if (statement.type === "if-throw") {
      const result = this.evaluateBooleanCondition(statement.condition, env);

      if (!result.success) {
        return {
          safe: false,
          reason: `Could not evaluate throw guard: ${statement.condition}`
        };
      }

      if (result.value === true) {
        return {
          safe: false,
          reason: `Generated valid input hits throw path: ${statement.condition}`
        };
      }

      continue;
    }

    if (statement.type === "if-return") {
      const result = this.evaluateBooleanCondition(statement.condition, env);

      if (!result.success) {
        return {
          safe: false,
          reason: `Could not evaluate conditional return guard: ${statement.condition}`
        };
      }

      continue;
    }

    if (statement.type === "expression") {
      const result = this.evaluateExpression(
        statement.expression,
        { ...env },
        context,
        new Set()
      );

      if (!result.success) {
        return {
          safe: false,
          reason: `Could not evaluate expression statement: ${statement.expression}`
        };
      }

      continue;
    }
  }

  return {
    safe: true,
    reason:
      "Generated valid input does not hit a throw path and all branch/expression guards are evaluable."
  };
}

validateExecutionPathForExceptionExample(model, env, targetCondition) {
  const statements = this.extractExecutableStatements(model.body);
  const target = String(targetCondition || "").trim();

  for (const statement of statements) {
    if (statement.type !== "if-throw") continue;

    const result = this.evaluateBooleanCondition(statement.condition, env);

    if (!result.success) {
      return {
        safe: false,
        reason: `Could not evaluate throw guard: ${statement.condition}`
      };
    }

    if (result.value === true) {
      if (String(statement.condition).trim() === target) {
        return {
          safe: true,
          reason: `Generated invalid input reaches intended throw branch: ${target}`
        };
      }

      return {
        safe: false,
        reason: `Generated invalid input reaches earlier/different throw branch: ${statement.condition}`
      };
    }
  }

  return {
    safe: false,
    reason: `Generated invalid input did not reach intended throw branch: ${target}`
  };
}

isLikelyExecutableExpressionStatement(expression) {
  const expr = String(expression || "").trim();

  if (!expr) return false;
  if (expr.startsWith("return ")) return false;
  if (/^(const|let|var)\s+/.test(expr)) return false;
  if (/^(if|for|while|switch|catch)\b/.test(expr)) return false;

  return /^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)?\s*\(/.test(expr);
}

extractExecutableStatements(body) {
  const text = String(body || "");
  const statements = [];
  const assignmentNames = new Set();

  let i = 0;

  while (i < text.length) {
    const rest = text.slice(i);

    const whitespace = rest.match(/^\s+/);
    if (whitespace) {
      i += whitespace[0].length;
      continue;
    }

    const ifMatch = text.slice(i).match(/^if\s*\(([^)]*)\)\s*\{/);

    if (ifMatch) {
      const condition = ifMatch[1].trim();
      const blockStart = text.indexOf("{", i);
      const blockEnd = this.findMatchingBrace(text, blockStart);

      if (blockEnd === -1) break;

      const blockBody = text.slice(blockStart + 1, blockEnd);

      const throwMatch = blockBody.match(
        /throw\s+new\s+Error\s*\(\s*["'`]([^"'`]+)["'`]\s*\)/
      );

      if (throwMatch) {
        statements.push({
          type: "if-throw",
          condition,
          message: throwMatch[1]
        });
      }

      const returnMatch = blockBody.match(/\breturn\s+([\s\S]+?);?\s*$/);

      if (returnMatch && !throwMatch) {
        statements.push({
          type: "if-return",
          condition,
          returnExpression: returnMatch[1].replace(/;$/, "").trim()
        });
      }

      i = blockEnd + 1;
      continue;
    }

    const assignmentMatch = text
      .slice(i)
      .match(/^(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/);

    if (assignmentMatch) {
      const name = assignmentMatch[1];
      const expressionStart = i + assignmentMatch[0].length;
      const expressionEnd = this.findTopLevelSemicolon(text, expressionStart);

      if (expressionEnd === -1) break;

      if (!assignmentNames.has(name)) {
        assignmentNames.add(name);
        statements.push({
          type: "assignment",
          name,
          expression: text.slice(expressionStart, expressionEnd).trim()
        });
      }

      i = expressionEnd + 1;
      continue;
    }

    const returnMatch = text.slice(i).match(/^return\s+/);

    if (returnMatch) {
      const expressionStart = i + returnMatch[0].length;
      const expressionEnd = this.findReturnExpressionEnd(text, expressionStart);

      statements.push({
        type: "return",
        expression: text.slice(expressionStart, expressionEnd).replace(/;$/, "").trim()
      });

      i = expressionEnd + 1;
      continue;
    }

    const expressionStatementEnd = this.findTopLevelSemicolon(text, i);

    if (expressionStatementEnd !== -1) {
      const expression = text.slice(i, expressionStatementEnd).trim();

      if (
        expression &&
        this.isLikelyExecutableExpressionStatement(expression)
      ) {
        statements.push({
          type: "expression",
          expression
        });

        i = expressionStatementEnd + 1;
        continue;
      }
    }

    i++;
  }

  return statements;
}

evaluateBooleanCondition(condition, env) {
  const expression = String(condition || "").trim();

  if (!expression) return { success: false };

  const replaced = this.replaceStringHelpersInCondition(expression);

  try {
    const fn = Function(
      ...Object.keys(env),
      `"use strict"; return (${replaced});`
    );

    return {
      success: true,
      value: Boolean(fn(...Object.values(env)))
    };
  } catch {
    return { success: false };
  }
}

replaceStringHelpersInCondition(expression) {
  return String(expression || "")
    .replace(/String\s*\(([^)]+)\)\.toUpperCase\s*\(\)/g, "String($1).toUpperCase()")
    .replace(/String\s*\(([^)]+)\)\.toLowerCase\s*\(\)/g, "String($1).toLowerCase()");
}

evaluateConditionalExpression(expression, env, context, stack) {
  const expr = String(expression || "").trim();
  const questionIndex = this.findTopLevelCharacter(expr, "?");

  if (questionIndex === -1) return { success: false };

  const colonIndex = this.findMatchingConditionalColon(expr, questionIndex);

  if (colonIndex === -1) return { success: false };

  const condition = expr.slice(0, questionIndex).trim();
  const left = expr.slice(questionIndex + 1, colonIndex).trim();
  const right = expr.slice(colonIndex + 1).trim();

  const conditionResult = this.evaluateBooleanCondition(condition, env);

  if (!conditionResult.success) {
    return {
      success: false,
      reason: `Could not evaluate conditional expression guard: ${condition}`
    };
  }

  const selected = conditionResult.value ? left : right;
  const selectedResult = this.evaluateExpression(selected, env, context, stack);

  if (!selectedResult.success) return selectedResult;

  return {
    success: true,
    value: selectedResult.value,
    description: `${expr} = ${selectedResult.description}`
  };
}

evaluateObjectExpression(expression, env, context, stack) {
  const expr = String(expression || "").trim();

  if (!expr.startsWith("{") || !expr.endsWith("}")) {
    return { success: false };
  }

  const inner = expr.slice(1, -1).trim();

  if (!inner) {
    return {
      success: true,
      value: {},
      description: "{}"
    };
  }

  const result = {};
  const entries = this.splitTopLevelArguments(inner);

  for (const entry of entries) {
    const colonIndex = this.findTopLevelCharacter(entry, ":");

    if (colonIndex === -1) return { success: false };

    const rawKey = entry.slice(0, colonIndex).trim();
    const rawValue = entry.slice(colonIndex + 1).trim();
    const key = rawKey.replace(/^["'`]|["'`]$/g, "");

    const valueResult = this.evaluateExpression(rawValue, env, context, stack);

    if (!valueResult.success) return valueResult;

    result[key] = valueResult.value;
  }

  return {
    success: true,
    value: result,
    description: `${expr} = ${JSON.stringify(result)}`
  };
}

evaluateMemberExpression(expression, env) {
  const expr = String(expression || "").trim();

  if (!/^[A-Za-z_$][\w$]*(?:\.[A-Za-z_$][\w$]*)+$/.test(expr)) {
    return { success: false };
  }

  const value = this.resolvePath(expr, env);

  if (value === undefined) return { success: false };

  return {
    success: true,
    value,
    description: `${expr} = ${JSON.stringify(value)}`
  };
}

evaluateStringExpression(expression) {
  const expr = String(expression || "").trim();

  const match = expr.match(/^["'`]([^"'`]*)["'`]$/);

  if (!match) return { success: false };

  return {
    success: true,
    value: match[1],
    description: `${expr} = ${JSON.stringify(match[1])}`
  };
}

evaluateBooleanLiteralExpression(expression) {
  const expr = String(expression || "").trim();

  if (expr === "true") {
    return {
      success: true,
      value: true,
      description: "true"
    };
  }

  if (expr === "false") {
    return {
      success: true,
      value: false,
      description: "false"
    };
  }

  return { success: false };
}

findTopLevelCharacter(text, targetCharacter) {
  let depth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = 0; i < text.length; i++) {
    const char = text[i];

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

    if (char === "'" || char === `"` || char === "`") {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") depth++;
    if (char === ")" || char === "]" || char === "}") depth--;

    if (char === targetCharacter && depth === 0) return i;
  }

  return -1;
}

findMatchingConditionalColon(text, questionIndex) {
  let depth = 0;
  let nestedConditionalDepth = 0;
  let inString = false;
  let stringChar = "";

  for (let i = questionIndex + 1; i < text.length; i++) {
    const char = text[i];

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

    if (char === "'" || char === `"` || char === "`") {
      inString = true;
      stringChar = char;
      continue;
    }

    if (char === "(" || char === "[" || char === "{") depth++;
    if (char === ")" || char === "]" || char === "}") depth--;

    if (depth === 0 && char === "?") nestedConditionalDepth++;
    if (depth === 0 && char === ":") {
      if (nestedConditionalDepth === 0) return i;
      nestedConditionalDepth--;
    }
  }

  return -1;
}

  extractFunctionSource(functionName, repoAnalysis, projectContext) {
    const file = this.findFileForApi(functionName, repoAnalysis);
    const fileContent = file ? this.readRepoFileSafe(file) : projectContext;

    if (!fileContent) return null;

    const source =
      this.extractJavascriptFunctionSource(functionName, fileContent) ||
      this.extractPythonFunctionSource(functionName, fileContent);

    return source;
  }

  extractJavascriptFunctionSource(functionName, fileContent) {
    const escaped = this.escapeRegExp(functionName);

    const patterns = [
      new RegExp(`(?:export\\s+)?function\\s+${escaped}\\s*\\([^)]*\\)\\s*\\{`, "m"),
      new RegExp(`(?:export\\s+)?(?:const|let|var)\\s+${escaped}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*\\{`, "m")
    ];

    for (const pattern of patterns) {
      const match = pattern.exec(fileContent);
      if (!match) continue;

      const start = match.index;
      const braceStart = fileContent.indexOf("{", start);
      const end = this.findMatchingBrace(fileContent, braceStart);

      if (end > braceStart) {
        return fileContent.slice(start, end + 1);
      }
    }

    return null;
  }

  extractPythonFunctionSource(functionName, fileContent) {
    const escaped = this.escapeRegExp(functionName);
    const pattern = new RegExp(`^def\\s+${escaped}\\s*\\([^)]*\\):`, "m");
    const match = pattern.exec(fileContent);

    if (!match) return null;

    const start = match.index;
    const rest = fileContent.slice(start);
    const lines = rest.split("\n");
    const collected = [lines[0]];

    for (const line of lines.slice(1)) {
      if (/^\S/.test(line) && line.trim()) break;
      collected.push(line);
    }

    return collected.join("\n");
  }

  findMatchingBrace(text, openIndex) {
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = openIndex; i < text.length; i++) {
      const char = text[i];

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

      if (char === "'" || char === `"` || char === "`") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "{") depth++;
      if (char === "}") depth--;

      if (depth === 0) return i;
    }

    return -1;
  }

  readRepoFileSafe(relativePath) {
    try {
      return fs.readFileSync(path.join(this.repoPath, relativePath), "utf8");
    } catch {
      return null;
    }
  }

  findFileForApi(functionName, repoAnalysis) {
    for (const mod of repoAnalysis?.modules || []) {
      const names = [
        ...this.ensureArray(mod.functions).map((fn) => fn.name || fn),
        ...this.ensureArray(mod.exports)
      ].map(String);

      if (names.includes(functionName)) return mod.file;
    }

    return null;
  }

  extractFunctionParams(functionName, source) {
    const escaped = this.escapeRegExp(functionName);

    const jsMatch =
      source.match(new RegExp(`function\\s+${escaped}\\s*\\(([^)]*)\\)`)) ||
      source.match(new RegExp(`${escaped}\\s*=\\s*(?:async\\s*)?\\(([^)]*)\\)\\s*=>`));

    if (jsMatch) {
      return jsMatch[1]
        .split(",")
        .map((param) => param.trim().split("=")[0].trim())
        .filter(Boolean);
    }

    const pyMatch = source.match(new RegExp(`def\\s+${escaped}\\s*\\(([^)]*)\\):`));

    if (pyMatch) {
      return pyMatch[1]
        .split(",")
        .map((param) => param.trim().split("=")[0].trim())
        .filter(Boolean);
    }

    return [];
  }

  extractFunctionBody(source) {
    const braceStart = source.indexOf("{");

    if (braceStart >= 0) {
      return source.slice(braceStart + 1, source.lastIndexOf("}"));
    }

    const colonIndex = source.indexOf(":");

    if (colonIndex >= 0) {
      return source.slice(colonIndex + 1);
    }

    return source;
  }

  extractAssignments(body) {
    return [...this.extractJavascriptAssignments(body), ...this.extractPythonAssignments(body)];
  }

  extractJavascriptAssignments(body) {
    const assignments = [];
    const text = String(body || "");
    const declarationPattern = /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g;
    let match;

    while ((match = declarationPattern.exec(text)) !== null) {
      const name = match[1];
      const expressionStart = declarationPattern.lastIndex;
      const expressionEnd = this.findTopLevelSemicolon(text, expressionStart);

      if (expressionEnd === -1) continue;

      assignments.push({
        name,
        expression: text.slice(expressionStart, expressionEnd).trim()
      });
    }

    return assignments;
  }

  extractPythonAssignments(body) {
    const assignments = [];

    for (const match of String(body || "").matchAll(/^\s*([A-Za-z_][\w]*)\s*=\s*([^\n]+)$/gm)) {
      assignments.push({
        name: match[1],
        expression: match[2].trim()
      });
    }

    return assignments;
  }

  findTopLevelSemicolon(text, start) {
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = start; i < text.length; i++) {
      const char = text[i];

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

      if (char === "'" || char === `"` || char === "`") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "(" || char === "[" || char === "{") depth++;
      if (char === ")" || char === "]" || char === "}") depth--;

      if (char === ";" && depth === 0) return i;
    }

    return -1;
  }

  extractReturnExpression(body) {
    const text = String(body || "");

    const returnIndex = text.lastIndexOf("return ");
    if (returnIndex >= 0) {
      const start = returnIndex + "return ".length;
      const end = this.findReturnExpressionEnd(text, start);
      return text.slice(start, end).replace(/;$/, "").trim();
    }

    return null;
  }

  findReturnExpressionEnd(text, start) {
    let depth = 0;
    let inString = false;
    let stringChar = "";

    for (let i = start; i < text.length; i++) {
      const char = text[i];

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

      if (char === "'" || char === `"` || char === "`") {
        inString = true;
        stringChar = char;
        continue;
      }

      if (char === "(" || char === "[" || char === "{") depth++;
      if (char === ")" || char === "]" || char === "}") depth--;

      if ((char === ";" || char === "\n") && depth === 0) return i;
    }

    return text.length;
  }

  extractThrowStatements(body) {
    const statements = [];

    for (const match of String(body || "").matchAll(
      /throw\s+new\s+([A-Za-z_$][\w$]*)\s*\(\s*["'`]([^"'`]*)["'`]\s*\)/g
    )) {
      statements.push({
        type: match[1],
        message: match[2],
        nearby: body
      });
    }

    for (const match of String(body || "").matchAll(
      /raise\s+([A-Za-z_][\w]*)\s*\(\s*["']([^"']*)["']\s*\)/g
    )) {
      statements.push({
        type: match[1],
        message: match[2],
        nearby: body
      });
    }

    return statements;
  }

  extractValidationConditions(body) {
    const conditions = [];

    for (const match of String(body || "").matchAll(/\bif\s*\(([^)]+)\)\s*\{/g)) {
      conditions.push(match[1].trim());
    }

    for (const match of String(body || "").matchAll(/^\s*if\s+(.+):/gm)) {
      conditions.push(match[1].trim());
    }

    return conditions;
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

  createReturnExample({
    id,
    targetApi,
    testName,
    scenario,
    args,
    expectedValue,
    expectedCalculation,
    evidence,
    covers
  }) {
    return {
      id,
      priority: 1,
      targetApi,
      testName,
      testType: "unit",
      scenario,
      inputs: {
        description: scenario,
        arguments: args,
        setup: []
      },
      expected: {
        kind: "return",
        expectedValue,
        expectedValueAvailable: true,
        expectedCalculation,
        expectedBehaviour: `Returns ${expectedValue}.`,
        expectedException: null,
        assertionHint: `Assert return value equals ${expectedValue}.`
      },
      reliability: {
        safeForDirectGeneration: true,
        reason: "Expected value was computed deterministically from source expressions and data flow.",
        confidence: "high"
      },
      source: "deterministic-test-data-builder",
      evidence,
      covers
    };
  }

  createExceptionExample({
    id,
    targetApi,
    testName,
    scenario,
    args,
    expectedException,
    evidence,
    covers
  }) {
    return {
      id,
      priority: 1,
      targetApi,
      testName,
      testType: "unit",
      scenario,
      inputs: {
        description: scenario,
        arguments: args,
        setup: []
      },
      expected: {
        kind: "exception",
        expectedValue: null,
        expectedValueAvailable: false,
        expectedCalculation: null,
        expectedBehaviour: `Throws ${expectedException}.`,
        expectedException,
        assertionHint: `Assert call throws ${expectedException}.`
      },
      reliability: {
        safeForDirectGeneration: true,
        reason: "Exception path was generated from explicit validation logic.",
        confidence: "high"
      },
      source: "deterministic-test-data-builder",
      evidence,
      covers
    };
  }

  formatArgumentForPlan(value) {
    if (typeof value === "string") return JSON.stringify(value);
    if (typeof value === "number" || typeof value === "boolean") return String(value);
    if (value === null) return "null";
    return JSON.stringify(value);
  }

  formatValueForDescription(value) {
  if (value === undefined) return "undefined";

  if (value === null) return "null";

  if (typeof value === "string") return JSON.stringify(value);

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

  mergeTestExamples(deterministicExamples, llmExamples) {
    const result = [];
    const seen = new Set();

    for (const example of [...deterministicExamples, ...llmExamples]) {
      const key = `${example.targetApi}:${example.scenario}:${JSON.stringify(
        example.inputs?.arguments || []
      )}`;

      if (seen.has(key)) continue;

      seen.add(key);
      result.push(example);
    }

    return result;
  }

  dedupeExamples(examples) {
    return this.mergeTestExamples(examples, []);
  }

  normaliseTestExamples(items) {
    return items
      .map((item) => this.normaliseEvidenceItem(item))
      .map((item, index) => {
        const id = item.id || this.createExampleId(item.targetApi, index + 1);

        const expected = {
          kind: item.expected?.kind || "unknown",
          expectedValue:
            item.expected?.expectedValueAvailable === true
              ? item.expected.expectedValue
              : null,
          expectedValueAvailable:
            item.expected?.expectedValueAvailable === true &&
            item.expected.expectedValue !== undefined,
          expectedCalculation: item.expected?.expectedCalculation || null,
          expectedBehaviour: item.expected?.expectedBehaviour || "",
          expectedException: item.expected?.expectedException || null,
          assertionHint: item.expected?.assertionHint || ""
        };

        const consistency = this.validateExpectedConsistency(expected);

        const baseSafe =
          item.reliability?.safeForDirectGeneration === true &&
          (expected.expectedValueAvailable ||
            expected.kind === "exception" ||
            expected.expectedBehaviour);

        const safeForDirectGeneration = baseSafe && consistency.safe;

        return {
          ...item,
          id,
          priority: Number(item.priority || 3),
          inputs: item.inputs || {
            description: "",
            arguments: [],
            setup: []
          },
          expected: consistency.expected,
          reliability: {
            safeForDirectGeneration,
            reason: safeForDirectGeneration
              ? item.reliability?.reason || consistency.reason
              : consistency.reason,
            confidence: safeForDirectGeneration
              ? this.normaliseConfidence(item.reliability?.confidence, item.source)
              : "low"
          },
          covers: Array.isArray(item.covers) ? item.covers : []
        };
      });
  }

  validateExpectedConsistency(expected) {
    const next = { ...expected };

    if (
      next.kind !== "return" ||
      next.expectedValueAvailable !== true ||
      next.expectedValue === null ||
      next.expectedValue === undefined
    ) {
      return {
        safe: true,
        reason: "No return expected-value consistency check required.",
        expected: next
      };
    }

    const expectedValue = next.expectedValue;
    const calculation = String(next.expectedCalculation || "");
    const hint = String(next.assertionHint || "");

    if (typeof expectedValue === "number") {
      const finalCalculationNumber = this.extractFinalCalculationNumber(calculation);
      const assertionNumber = this.extractAssertionHintNumber(hint);

      if (
        finalCalculationNumber !== null &&
        !this.numbersEqual(expectedValue, finalCalculationNumber)
      ) {
        return this.downgradeExpected(
          next,
          `Unsafe test example: expectedValue ${expectedValue} conflicts with expectedCalculation final value ${finalCalculationNumber}.`
        );
      }

      if (
        assertionNumber !== null &&
        !this.numbersEqual(expectedValue, assertionNumber)
      ) {
        return this.downgradeExpected(
          next,
          `Unsafe test example: expectedValue ${expectedValue} conflicts with assertionHint value ${assertionNumber}.`
        );
      }
    }

    return {
      safe: true,
      reason: "Expected value is internally consistent.",
      expected: next
    };
  }

  downgradeExpected(expected, reason) {
    return {
      safe: false,
      reason,
      expected: {
        ...expected,
        expectedValue: null,
        expectedValueAvailable: false,
        expectedBehaviour:
          expected.expectedBehaviour ||
          "Expected value was downgraded because the example was internally inconsistent.",
        assertionHint: expected.assertionHint || "Do not use this example directly."
      }
    };
  }

  extractFinalCalculationNumber(text) {
    const matches = [...String(text || "").matchAll(/=\s*(-?\d+(?:\.\d+)?)/g)];
    if (matches.length === 0) return null;
    return Number(matches[matches.length - 1][1]);
  }

  extractAssertionHintNumber(text) {
    const matches = [
      ...String(text || "").matchAll(
        /\b(?:equals?|equal|be|returns?|return value)\b[^-\d]*(-?\d+(?:\.\d+)?)/gi
      )
    ];

    if (matches.length === 0) return null;
    return Number(matches[matches.length - 1][1]);
  }

  numbersEqual(left, right) {
    return Math.abs(Number(left) - Number(right)) < 0.000001;
  }

  ensureTestExamples(plan, { focusedModel }) {
    const existing = this.ensureArray(plan.testExamples).filter(
      (example) => example?.reliability?.safeForDirectGeneration !== false
    );

    if (existing.length > 0) return existing;

    const generated = [];
    const coverageTargets = focusedModel?.deterministicAnalysis?.coverageTargets || [];

    for (const target of coverageTargets) {
      if (!target.function) continue;

      generated.push({
        id: this.createExampleId(target.function, target.type || "target"),
        priority: target.type === "exception" ? 1 : 2,
        targetApi: target.function,
        testName: `Example: cover ${target.function} ${target.type}`,
        testType: "unit",
        scenario: target.suggestion || target.target || "Cover deterministic target.",
        inputs: {
          description: target.suggestion || target.target || "Deterministic target input.",
          arguments: [],
          setup: []
        },
        expected: {
          kind: target.type === "exception" ? "exception" : "unknown",
          expectedValue: null,
          expectedValueAvailable: false,
          expectedCalculation: null,
          expectedBehaviour:
            target.type === "exception"
              ? "Throws or rejects as implemented for the invalid path."
              : "Behaves according to the implementation for this deterministic target.",
          expectedException: target.type === "exception" ? "Expected exception" : null,
          assertionHint:
            target.type === "exception"
              ? "Assert the expected exception path."
              : "Assert behaviour derived from the implementation."
        },
        reliability: {
          safeForDirectGeneration: target.type === "exception",
          reason:
            target.type === "exception"
              ? "Deterministic analysis identified an exception path."
              : "Deterministic target requires concrete inputs from source context.",
          confidence: "high"
        },
        source: "deterministic-analysis",
        evidence: [`Deterministic target: ${target.type} / ${target.target || "unknown"}`],
        covers:
          target.type === "exception"
            ? ["exceptionPath", "mutation"]
            : ["edgeCase", "mutation"]
      });
    }

    return generated;
  }

  ensurePrioritisedTestPlan(plan, { focusedModel }) {
    const existing = this.ensureArray(plan.prioritisedTestPlan);

    const validExisting = existing.filter(
      (item) =>
        item?.targetApi &&
        item.targetApi !== "unknown" &&
        item?.testName &&
        item.testName !== "Unnamed test" &&
        item?.scenario
    );

    if (validExisting.length > 0) {
      return this.linkPlanItemsToExamples(validExisting, plan.testExamples);
    }

    const generated = [];
    const seen = new Set();

    const addPlanItem = (item) => {
      const key = `${item.targetApi}:${item.scenario}:${item.expectedBehaviour}`;
      if (seen.has(key)) return;
      seen.add(key);
      generated.push(item);
    };

    for (const example of plan.testExamples) {
      if (!example?.targetApi || example.targetApi === "unknown") continue;

      addPlanItem({
        priority: example.priority || 1,
        testName: example.testName || `Verify ${example.targetApi}`,
        targetApi: example.targetApi,
        testType: example.testType || "unit",
        scenario: example.scenario,
        expectedBehaviour:
          example.expected?.expectedBehaviour ||
          example.expected?.expectedException ||
          "Behaves according to implementation.",
        testExampleIds: [example.id],
        source: example.source || "code",
        confidence: example.reliability?.confidence || "high",
        evidence: example.evidence || [],
        covers: example.covers || ["publicApi"]
      });
    }

    const coverageTargets = focusedModel?.deterministicAnalysis?.coverageTargets || [];

    for (const target of coverageTargets) {
      addPlanItem({
        priority: target.type === "exception" ? 1 : 2,
        testName: `Cover ${target.function} ${target.type}`,
        targetApi: target.function || "unknown",
        testType: "unit",
        scenario: target.suggestion || target.target || "Cover deterministic target.",
        expectedBehaviour:
          target.type === "exception"
            ? "Throws or rejects as implemented for the invalid path."
            : "Behaves according to the implementation for this deterministic target.",
        testExampleIds: [],
        source: "deterministic-analysis",
        confidence: "high",
        evidence: [`Deterministic target: ${target.type} / ${target.target || "unknown"}`],
        covers:
          target.type === "exception"
            ? ["exceptionPath", "mutation"]
            : ["edgeCase", "mutation"]
      });
    }

    return generated.sort((a, b) => Number(a.priority) - Number(b.priority));
  }

  linkPlanItemsToExamples(planItems, testExamples) {
    return planItems.map((item) => {
      if (Array.isArray(item.testExampleIds) && item.testExampleIds.length > 0) {
        return item;
      }

      const matchingExamples = testExamples.filter((example) =>
        this.sameApi(example.targetApi, item.targetApi)
      );

      return {
        ...item,
        testExampleIds: matchingExamples.map((example) => example.id)
      };
    });
  }

  normaliseApiName(value) {
    return String(value || "")
      .split("/")
      .pop()
      .split(".")
      .pop()
      .trim();
  }

  createExampleId(apiName, suffix) {
    return `${String(apiName || "unknown")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase()}-${String(suffix || "example")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .toLowerCase()}`;
  }

  sameApi(left, right) {
    return this.normaliseApiName(left) === this.normaliseApiName(right);
  }

  hasUsefulReadme() {
    try {
      const readmePath = path.join(this.repoPath, "README.md");
      if (!fs.existsSync(readmePath)) return false;

      const content = fs.readFileSync(readmePath, "utf8").trim();
      if (content.length < 20) return false;

      const weakContent = ["# project", "todo", "readme", "# readme"];
      return !weakContent.includes(content.toLowerCase());
    } catch {
      return false;
    }
  }

  normaliseEvidenceSummary(evidenceSummary, { repoAnalysis, focusedModel }) {
    const readmeAvailable = this.hasUsefulReadme();

    const primaryEvidence = Array.isArray(evidenceSummary?.primaryEvidence)
      ? evidenceSummary.primaryEvidence
      : ["code", "deterministic-analysis", "dependency-graph", "call-graph"];

    return {
      readmeAvailable,
      codeAvailable: true,
      deterministicAnalysisAvailable: Boolean(focusedModel?.deterministicAnalysis),
      dependencyGraphAvailable: Boolean(repoAnalysis?.dependencyGraph),
      callGraphAvailable: Boolean(Array.isArray(repoAnalysis?.callGraph) && repoAnalysis.callGraph.length > 0),
      primaryEvidence: readmeAvailable
        ? primaryEvidence
        : primaryEvidence.filter((item) => item !== "README")
    };
  }

  ensureArray(value) {
    return Array.isArray(value) ? value : [];
  }

  normaliseConcreteScenarioItems(items, primaryField, expectedField) {
    return items
      .map((item) => this.normaliseEvidenceItem(item))
      .filter((item) => this.isConcreteScenarioItem(item, primaryField, expectedField));
  }

  isConcreteScenarioItem(item, primaryField, expectedField) {
    if (!item) return false;

    const api = String(item.api || item.targetApi || "").trim();
    const primary = String(item[primaryField] || "").trim();
    const expected = String(item[expectedField] || "").trim();

    if (!api || api === "unknown") return false;
    if (!primary || primary === "unknown") return false;
    if (!expected || expected === "unknown") return false;

    if (item.source === "inferred" && item.confidence === "low") {
      const evidenceText = this.ensureArray(item.evidence).join(" ").toLowerCase();

      if (
        !evidenceText ||
        evidenceText.includes("no direct evidence supplied") ||
        evidenceText.includes("treated as inferred")
      ) {
        return false;
      }
    }

    return true;
  }

   normaliseItems(items) {
    return items
      .map((item) => this.normaliseEvidenceItem(item))
      .filter((item) => this.shouldKeepEvidenceItem(item));
  }

  shouldKeepEvidenceItem(item) {
    if (!item) return false;

    const trustedSources = new Set([
      "README",
      "code",
      "deterministic-analysis",
      "dependency-graph",
      "call-graph",
      "deterministic-test-data-builder"
    ]);

    if (trustedSources.has(item.source)) return true;

    if (
      item.source === "inferred" &&
      (item.confidence === "medium" || item.confidence === "high") &&
      this.hasConcreteContent(item)
    ) {
      return true;
    }

    return false;
  }

  hasConcreteContent(item) {
    return Object.entries(item).some(([key, value]) => {
      if (["source", "confidence", "evidence", "priority"].includes(key)) {
        return false;
      }

      if (Array.isArray(value)) {
        return value.length > 0;
      }

      if (typeof value === "string") {
        const text = value.trim().toLowerCase();

        return (
          text !== "" &&
          text !== "unknown" &&
          text !== "not specified" &&
          !text.includes("no direct evidence supplied") &&
          !text.includes("treated as inferred")
        );
      }

      return value !== null && value !== undefined;
    });
  }

  normaliseEvidenceItem(item) {
    const next = { ...(item || {}) };

    next.source = this.normaliseSource(next.source);
    next.confidence = this.normaliseConfidence(next.confidence, next.source);
    next.evidence = this.normaliseEvidence(next.evidence, next.source);

    if (next.source === "inferred" && next.confidence === "high") {
      next.confidence = "medium";
    }

    return next;
  }

  normaliseAlgorithmSteps(items) {
    return items
      .map((item) => this.normaliseEvidenceItem(item))
      .filter((item) => this.shouldKeepEvidenceItem(item))
      .filter((item) => {
        const api = String(item.api || "").trim().toLowerCase();
        const description = String(item.description || "").trim().toLowerCase();
        const codeExpression = String(item.codeExpression || "").trim().toLowerCase();

        if (!api || api === "unknown") return false;
        if (!description || description === "unknown") return false;
        if (!codeExpression || codeExpression === "not specified") return false;

        return true;
      });
  }

  normaliseCalculationFormulas(formulas, algorithmSteps) {
    const algorithmEvidence = JSON.stringify(algorithmSteps || []);

    return formulas
      .map((item) => this.normaliseEvidenceItem(item))
      .map((item) => {
        if (!item.formula || !item.evidence?.length) return null;

        if (this.formulaLooksInvented(item.formula, algorithmEvidence)) {
          return {
            ...item,
            confidence: "low",
            source: "inferred",
            evidence: [
              ...item.evidence,
              "Formula was downgraded because it could not be strictly matched to algorithm step expressions."
            ]
          };
        }

        return item;
      })
      .filter(Boolean);
  }

  formulaLooksInvented(formula, algorithmEvidence) {
    const cleanedFormula = String(formula || "").toLowerCase();
    const evidence = String(algorithmEvidence || "").toLowerCase();

    if (!cleanedFormula.trim()) return true;

    const formulaTokens = this.extractFormulaTokens(cleanedFormula);
    const missingTokens = formulaTokens.filter((token) => !evidence.includes(token));

    return formulaTokens.length > 0 && missingTokens.length / formulaTokens.length > 0.5;
  }

  extractFormulaTokens(formula) {
    return Array.from(
      new Set(
        formula
          .replace(/[^a-zA-Z0-9_$]+/g, " ")
          .split(/\s+/)
          .map((token) => token.trim().toLowerCase())
          .filter((token) => token.length >= 3)
          .filter(
            (token) =>
              ![
                "const",
                "let",
                "var",
                "return",
                "function",
                "total",
                "amount",
                "value",
                "result"
              ].includes(token)
          )
      )
    );
  }

  normaliseStateMachines(items) {
    return items
      .map((item) => this.normaliseEvidenceItem(item))
      .filter((item) => item.applicable === true && item.evidence?.length);
  }

  normaliseAssumptionItems(items, kind) {
    return items.map((item) => {
      const next = this.normaliseEvidenceItem(item);

      if (next.source === "inferred") {
        next.confidence = "low";
        next.evidence = [
          ...(next.evidence || []),
          `${kind} is inferred and not directly enforced unless evidence states otherwise.`
        ];
      }

      return next;
    });
  }

  normaliseSource(source) {
    if (VALID_SOURCES.has(source)) return source;
    return "inferred";
  }

  normaliseConfidence(confidence, source) {
    if (VALID_CONFIDENCE.has(confidence)) return confidence;
    return source === "inferred" ? "low" : "medium";
  }

  normaliseEvidence(evidence, source) {
    if (Array.isArray(evidence) && evidence.length > 0) {
      return evidence.map((item) => String(item));
    }

    return [
      source === "inferred"
        ? "No direct evidence supplied; treated as inferred."
        : "Evidence not supplied by planner."
    ];
  }

  escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  writePlanningReport(plan) {
    const report = `# QA Planning Report

## Summary

${plan.summary || "No summary provided."}

## Evidence Summary

- README/docs available: ${this.formatBoolean(plan.evidenceSummary?.readmeAvailable)}
- Code available: ${this.formatBoolean(plan.evidenceSummary?.codeAvailable)}
- Deterministic analysis available: ${this.formatBoolean(plan.evidenceSummary?.deterministicAnalysisAvailable)}
- Dependency graph available: ${this.formatBoolean(plan.evidenceSummary?.dependencyGraphAvailable)}
- Call graph available: ${this.formatBoolean(plan.evidenceSummary?.callGraphAvailable)}
- Primary evidence: ${
      plan.evidenceSummary?.primaryEvidence?.length
        ? plan.evidenceSummary.primaryEvidence.join(", ")
        : "Not specified"
    }

## Public APIs

${this.renderList(
  plan.publicApis,
  (item) =>
    `- **${item.name || "unknown"}** (${item.file || "unknown file"}): ${
      item.purpose || "No purpose provided."
    }
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Business Rules

${this.renderList(
  plan.businessRules,
  (item) =>
    `- **${item.confidence || "unknown"} confidence** / ${
      item.source || "unknown source"
    }: ${item.rule || ""}
  - Files: ${item.files?.length ? item.files.join(", ") : "Not specified"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Algorithm Steps

${this.renderList(
  plan.algorithmSteps,
  (item) =>
    `${item.stepNumber || "-"} - **${item.api || "unknown"}**: ${
      item.description || ""
    }
  - Code expression: \`${item.codeExpression || "Not specified"}\`
  - Files: ${item.files?.length ? item.files.join(", ") : "Not specified"}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Calculation Formulas

${this.renderList(
  plan.calculationFormulas,
  (item) =>
    `- **${item.name || "unknown"}** / ${item.api || "unknown"}
  - Formula: \`${item.formula || "Not specified"}\`
  - Variables: ${this.formatVariables(item.variables)}
  - Files: ${item.files?.length ? item.files.join(", ") : "Not specified"}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Validation Rules

${this.renderList(
  plan.validationRules,
  (item) =>
    `- **${item.api || "unknown"}**: \`${item.condition || "Not specified"}\`
  - Valid behaviour: ${item.validBehaviour || "Not specified"}
  - Invalid behaviour: ${item.invalidBehaviour || "Not specified"}
  - Files: ${item.files?.length ? item.files.join(", ") : "Not specified"}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## State Machine

${this.renderList(plan.stateMachine, (item) => `- ${JSON.stringify(item)}`)}

## Data Flow

${this.renderList(plan.dataFlow, (item) => `- ${JSON.stringify(item)}`)}

## Dependency Flows

${this.renderList(plan.dependencyFlows, (item) => `- ${JSON.stringify(item)}`)}

## Side Effects

${this.renderList(plan.sideEffects, (item) => `- ${JSON.stringify(item)}`)}

## Preconditions

${this.renderList(plan.preconditions, (item) => `- ${JSON.stringify(item)}`)}

## Postconditions

${this.renderList(plan.postconditions, (item) => `- ${JSON.stringify(item)}`)}

## Invariants

${this.renderList(plan.invariants, (item) => `- ${JSON.stringify(item)}`)}

## Requirements vs Implementation

${this.renderList(plan.requirementsVsImplementation, (item) => `- ${JSON.stringify(item)}`)}

## Happy Paths

${this.renderList(
  plan.happyPaths,
  (item) =>
    `- **${item.api || "unknown"}**: ${item.scenario || ""}
  - Expected: ${item.expectedBehaviour || ""}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Edge Cases

${this.renderList(
  plan.edgeCases,
  (item) =>
    `- **${item.priority || "unknown"}** / ${item.api || "unknown"}: ${
      item.case || ""
    }
  - Expected: ${item.expectedBehaviour || ""}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Exception Paths

${this.renderList(
  plan.exceptionPaths,
  (item) =>
    `- **${item.priority || "unknown"}** / ${item.api || "unknown"}: ${
      item.trigger || ""
    }
  - Expected exception: ${item.expectedException || ""}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Risk Areas

${this.renderList(plan.riskAreas, (item) => `- ${JSON.stringify(item)}`)}

## Mutation-Sensitive Behaviours

${this.renderList(
  plan.mutationSensitiveBehaviours,
  (item) =>
    `- ${item.behaviour || ""}
  - Likely mutations caught: ${
    item.mutationsLikelyToCatch?.length
      ? item.mutationsLikelyToCatch.join(", ")
      : "Not specified"
  }
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Test Examples

${this.renderList(
  plan.testExamples,
  (item) =>
    `${item.priority || "-"} - **${item.testName || "Unnamed example"}** / ${
      item.targetApi || "unknown"
    }
  - Scenario: ${item.scenario || ""}
  - Inputs: ${this.formatInputs(item.inputs)}
  - Expected kind: ${item.expected?.kind || "unknown"}
  - Expected value available: ${this.formatBoolean(item.expected?.expectedValueAvailable)}
  - Expected value: ${this.formatExpectedValue(item.expected?.expectedValue)}
  - Expected calculation: ${item.expected?.expectedCalculation || "Not specified"}
  - Expected behaviour: ${item.expected?.expectedBehaviour || "Not specified"}
  - Expected exception: ${item.expected?.expectedException || "Not specified"}
  - Assertion hint: ${item.expected?.assertionHint || "Not specified"}
  - Safe for direct generation: ${this.formatBoolean(item.reliability?.safeForDirectGeneration)}
  - Reliability: ${item.reliability?.confidence || "unknown"} — ${
      item.reliability?.reason || "No reason supplied."
    }
  - Source: ${item.source || "unknown"}
  - Covers: ${item.covers?.length ? item.covers.join(", ") : "Not specified"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Missing Requirements

${this.renderList(
  plan.missingRequirements,
  (item) =>
    `- **${item.gap || "unknown"}**
  - Impact: ${item.impact || ""}
  - Suggestion: ${item.suggestion || ""}
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}

## Prioritised Test Plan

${this.renderList(
  plan.prioritisedTestPlan,
  (item) =>
    `${item.priority || "-"} - **${item.testName || "Unnamed test"}** / ${
      item.targetApi || "unknown"
    }
  - Type: ${item.testType || "unknown"}
  - Scenario: ${item.scenario || ""}
  - Expected: ${item.expectedBehaviour || ""}
  - Test examples: ${
    item.testExampleIds?.length ? item.testExampleIds.join(", ") : "None"
  }
  - Source: ${item.source || "unknown"}
  - Confidence: ${item.confidence || "unknown"}
  - Covers: ${item.covers?.length ? item.covers.join(", ") : "Not specified"}
  - Evidence: ${this.formatEvidence(item.evidence)}`
)}
`;

    fs.writeFileSync(path.join(this.repoPath, "planning-report.md"), report);
  }

  renderList(items, mapper) {
    if (!Array.isArray(items) || items.length === 0) return "None identified.";
    return items.map(mapper).join("\n\n");
  }

  formatBoolean(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return "Unknown";
  }

  formatEvidence(evidence) {
    if (!Array.isArray(evidence) || evidence.length === 0) return "Not specified.";
    return evidence.join("; ");
  }

  formatInputs(inputs) {
    if (!inputs) return "Not specified.";

    const args = Array.isArray(inputs.arguments)
      ? inputs.arguments.join("; ")
      : "Not specified";

    const setup = Array.isArray(inputs.setup) ? inputs.setup.join("; ") : "None";

    return `${inputs.description || "No description"} | args: ${args} | setup: ${setup}`;
  }

  formatExpectedValue(value) {
    if (value === undefined || value === null) return "Not specified.";
    if (typeof value === "object") return JSON.stringify(value);
    return String(value);
  }

  formatVariables(variables) {
    if (!Array.isArray(variables) || variables.length === 0) {
      return "Not specified.";
    }

    return variables
      .map(
        (variable) =>
          `${variable.name || "unknown"} = ${
            variable.meaning || "unknown meaning"
          } (${variable.source || "unknown source"})`
      )
      .join("; ");
  }
}