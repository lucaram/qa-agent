import genericPatterns from "./genericPatterns.js";

const pythonPatterns = {
  operators: [
    ...genericPatterns.operators,
    {
      original: "/",
      replacement: "*",
      name: "divide-to-multiply"
    }
  ],

  booleans: [
    { original: "True", replacement: "False", name: "true-to-false" },
    { original: "False", replacement: "True", name: "false-to-true" },
    ...genericPatterns.booleans
  ],

  returns: [
    {
      name: "return-zero",
      replacement: "return 0"
    },
    {
      name: "return-none",
      replacement: "return None"
    }
  ],

  raises: [
    {
      name: "python-raise-to-return-zero",
      replacement: "return 0"
    }
  ]
};

export default pythonPatterns;