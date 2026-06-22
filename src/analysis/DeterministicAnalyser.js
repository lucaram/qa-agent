import fs from "fs";
import path from "path";

import {
  countMatches,
  stripCommentsAndStrings
} from "../utils/stringUtils.js";

export default class DeterministicAnalyser {
  constructor(repoPath, readFileSafe) {
    this.repoPath = repoPath;
    this.readFileSafe = readFileSafe;
  }

  extractConditionSnippets(body) {
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

  extractBranchInventory(body) {
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
      conditions: this.extractConditionSnippets(safeBody)
    };
  }

  extractLoopInventory(body) {
    const safeBody = stripCommentsAndStrings(body);

    return {
      forCount: countMatches(safeBody, /\bfor\b/g),
      whileCount: countMatches(safeBody, /\bwhile\b/g),
      doWhileCount: countMatches(safeBody, /\bdo\b/g),
      foreachCount: countMatches(safeBody, /\bforeach\b/g),
      mapFilterReduceCount: countMatches(
        safeBody,
        /\.map\s*\(|\.filter\s*\(|\.reduce\s*\(/g
      )
    };
  }

  extractExceptionInventory(body) {
    const safeBody = stripCommentsAndStrings(body);

    return {
      throwCount: countMatches(safeBody, /\bthrow\b/g),
      raiseCount: countMatches(safeBody, /\braise\b/g),
      tryCount: countMatches(safeBody, /\btry\b/g),
      catchCount: countMatches(safeBody, /\bcatch\b|\bexcept\b/g),
      finallyCount: countMatches(safeBody, /\bfinally\b/g)
    };
  }

  estimateCyclomaticComplexity(branches, loops, exceptions) {
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

  buildLikelyTestTargets(def, branches, loops, exceptions) {
    const targets = [];

    for (const condition of branches.conditions) {
      targets.push({
        type: "condition",
        function: def.name,
        target: condition,
        suggestion: `Cover true and false outcomes for condition: ${condition}`
      });
    }

    if (
      loops.forCount ||
      loops.whileCount ||
      loops.foreachCount ||
      loops.mapFilterReduceCount
    ) {
      targets.push({
        type: "loop",
        function: def.name,
        target: "loop behaviour",
        suggestion:
          "Cover empty input, single item, multiple items, and boundary cases."
      });
    }

    if (exceptions.throwCount || exceptions.raiseCount) {
      targets.push({
        type: "exception",
        function: def.name,
        target: "exception path",
        suggestion:
          "Cover invalid input path and verify exception type/message where specified."
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
        suggestion:
          "Cover non-commutative operand order, including a > b and a < b."
      });
    }

    if (lowered.includes("factorial")) {
      targets.push({
        type: "domain-edge-case",
        function: def.name,
        target: "factorial boundaries",
        suggestion:
          "Cover 0, 1, positive value, and negative invalid input."
      });
    }

    return targets;
  }

  analyseFunctionMetrics(def) {
    const branches = this.extractBranchInventory(def.body);
    const loops = this.extractLoopInventory(def.body);
    const exceptions = this.extractExceptionInventory(def.body);
    const safeBody = stripCommentsAndStrings(def.body);

    return {
      name: def.name,
      type: def.type,
      startLine: def.startLine || null,
      cyclomaticComplexity: this.estimateCyclomaticComplexity(
        branches,
        loops,
        exceptions
      ),
      branches,
      loops,
      exceptions,
      recursion: new RegExp(`\\b${def.name}\\s*\\(`).test(safeBody),
      hasReturn: /\breturn\b/.test(safeBody),
      likelyTestTargets: this.buildLikelyTestTargets(
        def,
        branches,
        loops,
        exceptions
      )
    };
  }

  detectExistingTestIntents(testFiles) {
    const intents = [];

    for (const file of testFiles) {
      if (!fs.existsSync(path.join(this.repoPath, file))) {
        continue;
      }

      const code = this.readFileSafe(file);

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
            normalised: match[1]
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, " ")
              .trim()
          });
        }
      }
    }

    return intents;
  }

  analyse(rawModules, testFiles) {
    const functionMetrics = [];

    for (const mod of rawModules) {
      const metrics = mod.functionDefinitions.map((def) =>
        this.analyseFunctionMetrics(def, mod.language)
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

    const existingTestIntents = this.detectExistingTestIntents(testFiles);

    return {
      summary: {
        totalFunctions: functionMetrics.reduce(
          (sum, file) => sum + file.functions.length,
          0
        ),
        highComplexityFunctions: functionMetrics.flatMap((file) =>
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
}