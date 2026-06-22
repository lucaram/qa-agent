const genericPatterns = {
  operators: [
    { original: ">=", replacement: "<", name: "greater-equal-to-less" },
    { original: "<=", replacement: ">", name: "less-equal-to-greater" },
    { original: "===", replacement: "!==", name: "strict-equals-to-not-equals" },
    { original: "!==", replacement: "===", name: "strict-not-equals-to-equals" },
    { original: "==", replacement: "!=", name: "equals-to-not-equals" },
    { original: "!=", replacement: "==", name: "not-equals-to-equals" },
    { original: ">", replacement: "<", name: "greater-to-less" },
    { original: "<", replacement: ">", name: "less-to-greater" },
    { original: "+", replacement: "-", name: "plus-to-minus" },
    { original: "-", replacement: "+", name: "minus-to-plus" },
    { original: "*", replacement: "/", name: "multiply-to-divide" }
  ],

  booleans: [
    { original: "true", replacement: "false", name: "true-to-false" },
    { original: "false", replacement: "true", name: "false-to-true" }
  ],

  returns: [
    {
      name: "return-zero",
      replacement: "return 0"
    }
  ],

  raises: []
};

export default genericPatterns;