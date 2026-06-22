import genericPatterns from "./genericPatterns.js";

export default {
  operators: [
    ...genericPatterns.operators,
    { original: "/", replacement: "*", name: "divide-to-multiply" },
    { original: "&&", replacement: "||", name: "and-to-or" },
    { original: "||", replacement: "&&", name: "or-to-and" },
    { original: "??", replacement: "||", name: "nil-coalescing-to-or" }
  ],
  booleans: genericPatterns.booleans,
  returns: [
    { name: "return-zero", replacement: "return 0" },
    { name: "return-nil", replacement: "return nil" },
    { name: "return-false", replacement: "return false" },
    { name: "return-true", replacement: "return true" }
  ],
  raises: [
    { name: "throw-to-return-nil", replacement: "return nil" }
  ]
};