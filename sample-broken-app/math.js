export function add(a, b) {
  return a + b;
}

export function subtract(a, b) {
  return a - b;
}

export function multiply(a, b) {
  return a * b;
}

export function divide(a, b) {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}

export function factorial(n) {
  if (n < 0) {
    throw new Error("Negative input not allowed");
  }
  if (n === 0) {
    return 1;
  }
  return n * factorial(n - 1);
}