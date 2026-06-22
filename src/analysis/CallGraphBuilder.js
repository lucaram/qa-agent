import { stripCommentsAndStrings } from "../utils/stringUtils.js";

export default class CallGraphBuilder {
  extractFunctionCallsFromDefinitions(definitions, knownFunctionNames) {
    const calls = {};

    for (const def of definitions) {
      calls[def.name] = [];

      const safeBody = stripCommentsAndStrings(def.body);

      for (const possibleCall of knownFunctionNames) {
        if (possibleCall === def.name) {
          continue;
        }

        const escapedName = possibleCall.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const callRegex = new RegExp(`\\b${escapedName}\\s*\\(`, "g");

        if (callRegex.test(safeBody)) {
          calls[def.name].push(possibleCall);
        }
      }
    }

    return calls;
  }

  build(rawModules) {
    const allKnownFunctions = [
      ...new Set(rawModules.flatMap((mod) => mod.functions))
    ];

    const functionToFile = {};

    for (const mod of rawModules) {
      for (const fn of mod.functions) {
        functionToFile[fn] = mod.file;
      }
    }

    const moduleFunctionCalls = {};

    for (const mod of rawModules) {
      moduleFunctionCalls[mod.file] = this.extractFunctionCallsFromDefinitions(
        mod.functionDefinitions,
        allKnownFunctions
      );
    }

    const callGraph = [];

    for (const mod of rawModules) {
      const functionCalls = moduleFunctionCalls[mod.file] || {};

      for (const [caller, callees] of Object.entries(functionCalls)) {
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

    return {
      allKnownFunctions,
      functionToFile,
      moduleFunctionCalls,
      callGraph
    };
  }
}