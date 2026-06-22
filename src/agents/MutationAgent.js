import fs from "fs";
import path from "path";

import { detectLanguageFromFile } from "../repository/languageDetector.js";
import { runTests } from "../runtime/commandRunner.js";
import { safeJoin } from "../utils/pathUtils.js";
import {
  getMaxMutationsForLanguage,
  getMutationPatternSet
} from "../mutation/MutationPatternRegistry.js";

export default class MutationAgent {
  constructor(repoPath, readFileSafe) {
    this.repoPath = repoPath;
    this.readFileSafe = readFileSafe;
  }

  shouldSkipFile(file, repoAnalysis) {
    if (!file) return true;
    if (file === repoAnalysis.generatedTestFile) return true;
    if (repoAnalysis.files.tests.includes(file)) return true;
    if (!repoAnalysis.files.source.includes(file)) return true;
    if (/\.(html|css|scss|sass|md|json|yml|yaml|lock)$/i.test(file)) return true;
    return false;
  }

  maskStringsAndComments(code, language) {
    if (language === "python" || language === "ruby") {
      return this.maskHashCommentsAndStrings(code);
    }

    return this.maskSlashCommentsAndStrings(code);
  }

  maskHashCommentsAndStrings(code) {
    let output = "";
    let i = 0;
    let inString = false;
    let stringChar = "";
    let triple = false;
    let inLineComment = false;

    while (i < code.length) {
      const char = code[i];
      const nextThree = code.slice(i, i + 3);

      if (inLineComment) {
        if (char === "\n") {
          inLineComment = false;
          output += "\n";
        } else {
          output += " ";
        }
        i++;
        continue;
      }

      if (inString) {
        if (char === "\\") {
          output += " ";
          if (i + 1 < code.length) {
            output += code[i + 1] === "\n" ? "\n" : " ";
          }
          i += 2;
          continue;
        }

        if (triple && nextThree === stringChar.repeat(3)) {
          output += "   ";
          i += 3;
          inString = false;
          stringChar = "";
          triple = false;
          continue;
        }

        if (!triple && char === stringChar) {
          output += " ";
          i++;
          inString = false;
          stringChar = "";
          continue;
        }

        output += char === "\n" ? "\n" : " ";
        i++;
        continue;
      }

      if (char === "#") {
        output += " ";
        i++;
        inLineComment = true;
        continue;
      }

      if (nextThree === `"""` || nextThree === `'''`) {
        output += "   ";
        i += 3;
        inString = true;
        stringChar = nextThree[0];
        triple = true;
        continue;
      }

      if (char === "'" || char === `"` || char === "`") {
        output += " ";
        i++;
        inString = true;
        stringChar = char;
        triple = false;
        continue;
      }

      output += char;
      i++;
    }

    return output;
  }

  maskSlashCommentsAndStrings(code) {
    let output = "";
    let i = 0;
    let inString = false;
    let stringChar = "";
    let inLineComment = false;
    let inBlockComment = false;

    while (i < code.length) {
      const char = code[i];
      const next = code[i + 1];

      if (inLineComment) {
        if (char === "\n") {
          inLineComment = false;
          output += "\n";
        } else {
          output += " ";
        }
        i++;
        continue;
      }

      if (inBlockComment) {
        if (char === "*" && next === "/") {
          output += "  ";
          i += 2;
          inBlockComment = false;
        } else {
          output += char === "\n" ? "\n" : " ";
          i++;
        }
        continue;
      }

      if (inString) {
        if (char === "\\") {
          output += " ";
          if (i + 1 < code.length) {
            output += code[i + 1] === "\n" ? "\n" : " ";
          }
          i += 2;
          continue;
        }

        if (char === stringChar) {
          output += " ";
          i++;
          inString = false;
          stringChar = "";
          continue;
        }

        output += char === "\n" ? "\n" : " ";
        i++;
        continue;
      }

      if (char === "/" && next === "/") {
        output += "  ";
        i += 2;
        inLineComment = true;
        continue;
      }

      if (char === "/" && next === "*") {
        output += "  ";
        i += 2;
        inBlockComment = true;
        continue;
      }

      if (char === "'" || char === `"` || char === "`") {
        output += " ";
        i++;
        inString = true;
        stringChar = char;
        continue;
      }

      output += char;
      i++;
    }

    return output;
  }

  replaceAt(content, index, length, replacement) {
    return content.slice(0, index) + replacement + content.slice(index + length);
  }

  isWordOperator(operator) {
    return /^[A-Za-z_]+$/.test(operator);
  }

  isBoundary(masked, index, length) {
    const before = masked[index - 1] || "";
    const after = masked[index + length] || "";

    return !/[A-Za-z0-9_$]/.test(before) && !/[A-Za-z0-9_$]/.test(after);
  }

  isLikelyRegexOrPath(masked, index) {
    const before = masked.slice(Math.max(0, index - 40), index);
    const after = masked.slice(index + 1, index + 40);

    if (/import\s+.*from\s+$/m.test(before)) return true;
    if (/require\s*\(\s*$/.test(before)) return true;
    if (/https?:\s*$/.test(before)) return true;

    if (/^\s*[A-Za-z0-9_.-]/.test(after) && /[A-Za-z0-9_.-]\s*$/.test(before)) {
      return true;
    }

    return false;
  }

  isSafeOperatorMutation(masked, index, operator, language) {
    const before = masked[index - 1] || "";
    const after = masked[index + operator.length] || "";

    if (!operator.trim()) return false;

    if (this.isWordOperator(operator)) {
      return this.isBoundary(masked, index, operator.length);
    }

    if (operator === "/" && language !== "python") {
      if (this.isLikelyRegexOrPath(masked, index)) return false;
      return /[A-Za-z0-9_$)\]\s]/.test(before) && /[A-Za-z0-9_$(\[\s]/.test(after);
    }

    if (["+", "-", "*", "/"].includes(operator)) {
      return /[A-Za-z0-9_$)\]\s]/.test(before) && /[A-Za-z0-9_$(\[\s]/.test(after);
    }

    if (
      [
        ">",
        "<",
        ">=",
        "<=",
        "==",
        "!=",
        "===",
        "!==",
        "&&",
        "||",
        "??",
        "?:"
      ].includes(operator)
    ) {
      return true;
    }

    return true;
  }

  collectOperatorCandidates(file, content, language, patternSet, maxCandidates) {
    const candidates = [];
    const masked = this.maskStringsAndComments(content, language);
    const operators = [...(patternSet.operators || [])].sort(
      (a, b) => b.original.length - a.original.length
    );

    for (let i = 0; i < masked.length; i++) {
      for (const mutation of operators) {
        const token = masked.slice(i, i + mutation.original.length);

        if (token !== mutation.original) continue;

        if (
          !this.isSafeOperatorMutation(
            masked,
            i,
            mutation.original,
            language
          )
        ) {
          continue;
        }

        const original = content.slice(i, i + mutation.original.length);

        if (original !== mutation.original) continue;

        candidates.push({
          file,
          language,
          mutation: mutation.name,
          index: i,
          original,
          replacement: mutation.replacement,
          content: this.replaceAt(
            content,
            i,
            mutation.original.length,
            mutation.replacement
          )
        });

        i += mutation.original.length - 1;
        break;
      }

      if (candidates.length >= maxCandidates) break;
    }

    return candidates;
  }

  collectBooleanCandidates(file, content, language, patternSet, maxCandidates) {
    const candidates = [];
    const masked = this.maskStringsAndComments(content, language);
    const booleanPatterns = patternSet.booleans || [];

    for (const pattern of booleanPatterns) {
      const regex = new RegExp(`\\b${pattern.original}\\b`, "g");
      let match;

      while ((match = regex.exec(masked)) !== null) {
        const original = content.slice(
          match.index,
          match.index + pattern.original.length
        );

        if (original !== pattern.original) continue;

        candidates.push({
          file,
          language,
          mutation: pattern.name,
          index: match.index,
          original,
          replacement: pattern.replacement,
          content: this.replaceAt(
            content,
            match.index,
            pattern.original.length,
            pattern.replacement
          )
        });

        if (candidates.length >= maxCandidates) break;
      }

      if (candidates.length >= maxCandidates) break;
    }

    return candidates;
  }

  collectReturnCandidates(file, content, language, patternSet, maxCandidates) {
    const candidates = [];
    const masked = this.maskStringsAndComments(content, language);
    const returnPatterns = patternSet.returns || [];
    const regex = /\breturn\s+([^;\n]+)/g;

    let match;

    while ((match = regex.exec(masked)) !== null) {
      const original = content.slice(match.index, match.index + match[0].length);

      if (/return\s+(0|null|nil|None|false|true|False|True)\b/.test(original)) {
        continue;
      }

      for (const pattern of returnPatterns) {
        candidates.push({
          file,
          language,
          mutation: pattern.name,
          index: match.index,
          original,
          replacement: pattern.replacement,
          content: this.replaceAt(
            content,
            match.index,
            match[0].length,
            pattern.replacement
          )
        });

        if (candidates.length >= maxCandidates) break;
      }

      if (candidates.length >= maxCandidates) break;
    }

    return candidates;
  }

  collectRaiseCandidates(file, content, language, patternSet, maxCandidates) {
    const candidates = [];
    const masked = this.maskStringsAndComments(content, language);
    const raisePatterns = patternSet.raises || [];

    if (raisePatterns.length === 0) return candidates;

    const regexByLanguage = {
      python: /\braise\s+[A-Za-z0-9_]+\(.*?\)/g,
      javascript: /\bthrow\s+new\s+[A-Za-z0-9_]+\(.*?\)/g,
      typescript: /\bthrow\s+new\s+[A-Za-z0-9_]+\(.*?\)/g,
      java: /\bthrow\s+new\s+[A-Za-z0-9_]+\(.*?\);?/g,
      csharp: /\bthrow\s+new\s+[A-Za-z0-9_.]+\(.*?\);?/g,
      php: /\bthrow\s+new\s+[A-Za-z0-9_\\]+\(.*?\);?/g,
      kotlin: /\bthrow\s+[A-Za-z0-9_]+\(.*?\)/g,
      swift: /\bthrow\s+[A-Za-z0-9_]+\(.*?\)/g,
      ruby: /\braise\s+[A-Za-z0-9_:]+.*$/gm,
      rust: /\bpanic!\s*\(.*?\);?/g
    };

    const regex = regexByLanguage[language];

    if (!regex) return candidates;

    let match;

    while ((match = regex.exec(masked)) !== null) {
      const original = content.slice(match.index, match.index + match[0].length);

      for (const pattern of raisePatterns) {
        candidates.push({
          file,
          language,
          mutation: pattern.name,
          index: match.index,
          original,
          replacement: pattern.replacement,
          content: this.replaceAt(
            content,
            match.index,
            match[0].length,
            pattern.replacement
          )
        });

        if (candidates.length >= maxCandidates) break;
      }

      if (candidates.length >= maxCandidates) break;
    }

    return candidates;
  }

  generateMutationCandidatesForFile(file, content, language) {
    const patternSet = getMutationPatternSet(language);
    const maxCandidates = getMaxMutationsForLanguage(language);

    const candidates = [
      ...this.collectOperatorCandidates(
        file,
        content,
        language,
        patternSet,
        maxCandidates
      ),
      ...this.collectBooleanCandidates(
        file,
        content,
        language,
        patternSet,
        maxCandidates
      ),
      ...this.collectReturnCandidates(
        file,
        content,
        language,
        patternSet,
        maxCandidates
      ),
      ...this.collectRaiseCandidates(
        file,
        content,
        language,
        patternSet,
        maxCandidates
      )
    ];

    const unique = [];
    const seen = new Set();

    for (const candidate of candidates) {
      const key = `${candidate.file}:${candidate.index}:${candidate.original}:${candidate.replacement}`;

      if (seen.has(key)) continue;

      seen.add(key);
      unique.push(candidate);

      if (unique.length >= maxCandidates) break;
    }

    return unique;
  }

  getCandidateFiles(repoAnalysis, focusedModel) {
    const files = [
      ...new Set([
        ...(focusedModel.targetFiles || []),
        ...(focusedModel.dependencyFiles || [])
      ])
    ];

    return files.filter((file) => !this.shouldSkipFile(file, repoAnalysis));
  }

  selectBalancedMutations(mutationCandidates, maxTotalMutations) {
  const byFile = new Map();

  for (const candidate of mutationCandidates) {
    if (!byFile.has(candidate.file)) {
      byFile.set(candidate.file, []);
    }

    byFile.get(candidate.file).push(candidate);
  }

  const selected = [];

  while (selected.length < maxTotalMutations) {
    let added = false;

    for (const candidates of byFile.values()) {
      if (candidates.length === 0) continue;

      selected.push(candidates.shift());
      added = true;

      if (selected.length >= maxTotalMutations) {
        break;
      }
    }

    if (!added) {
      break;
    }
  }

  return selected;
}

  runSingleMutation(candidate, repoAnalysis, index, total) {
    const absolutePath = safeJoin(this.repoPath, candidate.file);
    const original = fs.readFileSync(absolutePath, "utf8");

    console.log(
      `   Mutant ${index}/${total}: ${candidate.file} :: ${candidate.mutation} (${JSON.stringify(
        candidate.original
      )} -> ${JSON.stringify(candidate.replacement)})`
    );

    try {
      fs.writeFileSync(absolutePath, candidate.content);

      const result = runTests(this.repoPath, repoAnalysis);

      const mutationResult = {
        file: candidate.file,
        mutation: candidate.mutation,
        original: candidate.original,
        replacement: candidate.replacement,
        killed: !result.passed,
        testCommand: result.command,
        durationMs: result.durationMs,
        outputPreview: result.output.slice(0, 1200)
      };

      console.log(
        `   ${mutationResult.killed ? "✅ killed" : "⚠️ survived"} in ${
          mutationResult.durationMs
        }ms`
      );

      return mutationResult;
    } catch (error) {
      console.log("   ✅ killed by runtime error");

      return {
        file: candidate.file,
        mutation: candidate.mutation,
        original: candidate.original,
        replacement: candidate.replacement,
        killed: true,
        testCommand: repoAnalysis.testCommand,
        durationMs: null,
        outputPreview: String(error?.message || error).slice(0, 1200)
      };
    } finally {
      fs.writeFileSync(absolutePath, original);
    }
  }

  writeReport(report) {
    const md = `# Mutation Report

## Summary

- Candidates generated: ${report.candidatesGenerated}
- Candidates executed: ${report.candidatesExecuted}
- Killed: ${report.killed}
- Survived: ${report.survived}
- Mutation score: ${
      report.mutationScore === null ? "N/A" : `${report.mutationScore}%`
    }

## Candidate files

${report.candidateFiles.map((file) => `- ${file}`).join("\n")}

## Results

${report.results
  .map(
    (result) => `### ${result.file} - ${result.mutation}

- Original: \`${result.original}\`
- Replacement: \`${result.replacement}\`
- Killed: ${result.killed ? "Yes" : "No"}
- Duration: ${result.durationMs === null ? "N/A" : `${result.durationMs}ms`}

<details>
<summary>Output preview</summary>

\`\`\`
${result.outputPreview || ""}
\`\`\`

</details>
`
  )
  .join("\n")}
`;

    fs.writeFileSync(path.join(this.repoPath, "mutation-report.md"), md);
  }

  run(repoAnalysis, focusedModel) {
    const candidateFiles = this.getCandidateFiles(repoAnalysis, focusedModel);
    const mutationCandidates = [];

    console.log(`   Candidate files: ${candidateFiles.length}`);

    for (const file of candidateFiles) {
      console.log(`   Analysing mutation candidates in ${file}...`);

      const language = detectLanguageFromFile(file);
      const content = this.readFileSafe(file);

      const fileCandidates = this.generateMutationCandidatesForFile(
        file,
        content,
        language
      );

      console.log(`   ${file}: ${fileCandidates.length} candidate(s)`);
      mutationCandidates.push(...fileCandidates);
    }

    // this maxTotalMutations numbers (8,12) could be configured
    const maxTotalMutations =
      repoAnalysis.primaryLanguage === "javascript" ||
      repoAnalysis.primaryLanguage === "typescript"
        ? 8
        : 12;

    const limited = this.selectBalancedMutations(
  mutationCandidates,
  maxTotalMutations
);
    
    const results = [];

    console.log(
      `   Executing ${limited.length}/${mutationCandidates.length} mutant(s)...`
    );

    for (let i = 0; i < limited.length; i++) {
      const result = this.runSingleMutation(
        limited[i],
        repoAnalysis,
        i + 1,
        limited.length
      );

      results.push(result);
    }

    const killed = results.filter((result) => result.killed).length;
    const survived = results.filter((result) => !result.killed).length;

    const report = {
      generatedAt: new Date().toISOString(),
      candidateFiles,
      candidatesGenerated: mutationCandidates.length,
      candidatesExecuted: results.length,
      killed,
      survived,
      mutationScore:
        results.length === 0
          ? null
          : Math.round((killed / results.length) * 10000) / 100,
      results
    };

    this.writeReport(report);

    return report;
  }
}