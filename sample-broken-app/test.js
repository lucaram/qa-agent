import assert from "node:assert/strict";
import {
  add,
  subtract,
  multiply,
  divide,
  factorial,
} from "./math.js";

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    console.error(`✗ ${name}`);
    console.error(err && err.stack ? err.stack : err);
    process.exitCode = 1;
  }
}

// --- add ---
test("add: adds two positive numbers", () => {
  assert.equal(add(2, 3), 5);
});

test("add: adds negative and positive numbers", () => {
  assert.equal(add(-2, 5), 3);
});

test("add: adds decimals (within tolerance)", () => {
  assert.ok(Math.abs(add(0.1, 0.2) - 0.3) < 1e-12);
});

// --- subtract ---
test("subtract: subtracts two positive numbers", () => {
  assert.equal(subtract(10, 3), 7);
});

test("subtract: subtracting a negative is addition", () => {
  assert.equal(subtract(10, -3), 13);
});

test("subtract: subtract resulting in negative number", () => {
  assert.equal(subtract(3, 10), -7);
});

// --- multiply ---
test("multiply: multiplies two positive numbers", () => {
  assert.equal(multiply(4, 5), 20);
});

test("multiply: multiplies by zero", () => {
  assert.equal(multiply(123, 0), 0);
});

test("multiply: multiplies negatives", () => {
  assert.equal(multiply(-3, 6), -18);
});

// --- divide ---
test("divide: divides evenly", () => {
  assert.equal(divide(10, 2), 5);
});

test("divide: divides producing fraction (within tolerance)", () => {
  assert.ok(Math.abs(divide(1, 3) - 1 / 3) < 1e-12);
});

test("divide: division by zero should throw", () => {
  assert.throws(() => divide(10, 0), /zero|0|divide|division/i);
});

// --- factorial ---
test("factorial: factorial(1) = 1", () => {
  assert.equal(factorial(1), 1);
});

test("factorial: factorial(5) = 120", () => {
  assert.equal(factorial(5), 120);
});

test("factorial: factorial(0) = 1", () => {
  assert.equal(factorial(0), 1);
});

test("factorial: negative input should throw", () => {
  assert.throws(() => factorial(-1), /negative|>=\s*0|invalid/i);
});