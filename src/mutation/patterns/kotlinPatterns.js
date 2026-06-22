import genericPatterns from "./genericPatterns.js";

export default {
  operators: [
    ...genericPatterns.operators,
    { original: "/", replacement: "*", name: "divide-to-multiply" },
    { original: "&&", replacement: "||", name: "and-to-or" },
    { original: "||", replacement: "&&", name: "or-to-and" },
    { original: "?:", replacement: "!!", name: "elvis-to-not-null" }
  ],
  booleans: genericPatterns.booleans,
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