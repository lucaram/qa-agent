import assert from "node:assert/strict";
import { add, subtract, multiply, divide, factorial } from "./math.js";

// Test add function
assert.strictEqual(add(2, 3), 5);
assert.strictEqual(add(-1, 1), 0);

// Test subtract function
assert.strictEqual(subtract(5, 3), 2);
assert.strictEqual(subtract(3, 5), -2);

// Test multiply function
assert.strictEqual(multiply(3, 4), 12);
assert.strictEqual(multiply(-2, 5), -10);

// Test divide function
assert.strictEqual(divide(10, 2), 5);
assert.strictEqual(divide(-10, 2), -5);

// Test divide by zero exception
assert.throws(() => divide(10, 0), {
    message: "Division by zero"
});

// Test factorial function
assert.strictEqual(factorial(0), 1);
assert.strictEqual(factorial(1), 1);
assert.strictEqual(factorial(5), 120);

// Test factorial for negative input exception
assert.throws(() => factorial(-1), {
    message: "Negative number"
});

// Test factorial for positive input
assert.strictEqual(factorial(3), 6);