import genericPatterns from "./genericPatterns.js";

export default {
  operators: [
    ...genericPatterns.operators,
    { original: "/", replacement: "*", name: "divide-to-multiply" },
    { original: "&&", replacement: "||", name: "and-to-or" },
    { original: "||", replacement: "&&", name: "or-to-and" }
  ],
  booleans: genericPatterns.booleans,
  returns: [
    { name: "return-zero", replacement: "return 0" },
    { name: "return-none", replacement: "return None" },
    { name: "return-false", replacement: "return false" },
    { name: "return-true", replacement: "return true" }
  ],
  raises: [
    { name: "panic-to-return-zero", replacement: "return 0" }
  ]
};