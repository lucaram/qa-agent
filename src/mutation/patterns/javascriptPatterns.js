import genericPatterns from "./genericPatterns.js";

const javascriptPatterns = {
  operators: [
    ...genericPatterns.operators,
    {
      original: "/",
      replacement: "*",
      name: "divide-to-multiply",
      guarded: true
    }
  ],

  booleans: genericPatterns.booleans,

  returns: [
    {
      name: "return-null",
      replacement: "return null"
    },
    {
      name: "return-zero",
      replacement: "return 0"
    }
  ],

  raises: []
};

export default javascriptPatterns;