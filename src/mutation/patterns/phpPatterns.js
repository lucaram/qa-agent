import genericPatterns from "./genericPatterns.js";

export default {
  operators: [
    ...genericPatterns.operators,
    { original: "/", replacement: "*", name: "divide-to-multiply" },
    { original: "&&", replacement: "||", name: "and-to-or" },
    { original: "||", replacement: "&&", name: "or-to-and" },
    { original: "??", replacement: "||", name: "null-coalescing-to-or" }
  ],
  booleans: [
    { original: "true", replacement: "false", name: "true-to-false" },
    { original: "false", replacement: "true", name: "false-to-true" },
    { original: "TRUE", replacement: "FALSE", name: "true-to-false" },
    { original: "FALSE", replacement: "TRUE", name: "false-to-true" }
  ],
  returns: [
    { name: "return-zero", replacement: "return 0" },
    { name: "return-null", replacement: "return null" },
    { name: "return-false", replacement: "return false" },
    { name: "return-true", replacement: "return true" }
  ],
  raises: [
    { name: "throw-to-return-null", replacement: "return null" }
  ]
};