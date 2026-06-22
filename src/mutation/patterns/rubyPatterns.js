import genericPatterns from "./genericPatterns.js";

export default {
  operators: [
    ...genericPatterns.operators,
    { original: "/", replacement: "*", name: "divide-to-multiply" },
    { original: "&&", replacement: "||", name: "and-to-or" },
    { original: "||", replacement: "&&", name: "or-to-and" },
    { original: "and", replacement: "or", name: "and-to-or-word" },
    { original: "or", replacement: "and", name: "or-to-and-word" }
  ],
  booleans: genericPatterns.booleans,
  returns: [
    { name: "return-zero", replacement: "return 0" },
    { name: "return-nil", replacement: "return nil" },
    { name: "return-false", replacement: "return false" },
    { name: "return-true", replacement: "return true" }
  ],
  raises: [
    { name: "raise-to-return-nil", replacement: "return nil" }
  ]
};