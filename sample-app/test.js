import assert from 'node:assert';
import { add, subtract, multiply, divide, factorial } from './math.js';

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

// add
test('add: adds two positive integers', () => {
  assert.strictEqual(add(2, 3), 5);
});

test('add: adds with negative numbers', () => {
  assert.strictEqual(add(-2, 3), 1);
  assert.strictEqual(add(-2, -3), -5);
});

test('add: handles zero', () => {
  assert.strictEqual(add(0, 0), 0);
  assert.strictEqual(add(0, 7), 7);
});

// subtract
test('subtract: subtracts two integers', () => {
  assert.strictEqual(subtract(10, 4), 6);
});

test('subtract: subtracts resulting in negative', () => {
  assert.strictEqual(subtract(4, 10), -6);
});

test('subtract: handles zero', () => {
  assert.strictEqual(subtract(0, 5), -5);
  assert.strictEqual(subtract(5, 0), 5);
});

// multiply
test('multiply: multiplies two positive integers', () => {
  assert.strictEqual(multiply(6, 7), 42);
});

test('multiply: multiplies with zero', () => {
  assert.strictEqual(multiply(123, 0), 0);
  assert.strictEqual(multiply(0, 123), 0);
});

test('multiply: multiplies with negative numbers', () => {
  assert.strictEqual(multiply(-3, 5), -15);
  assert.strictEqual(multiply(-3, -5), 15);
});

// divide
test('divide: divides two numbers', () => {
  assert.strictEqual(divide(10, 2), 5);
});

test('divide: returns fractional results', () => {
  assert.strictEqual(divide(1, 2), 0.5);
});

test('divide: handles negative numbers', () => {
  assert.strictEqual(divide(-10, 2), -5);
  assert.strictEqual(divide(10, -2), -5);
  assert.strictEqual(divide(-10, -2), 5);
});

test('divide: throws on division by zero', () => {
  assert.throws(() => divide(1, 0), (err) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, 'Division by zero');
    return true;
  });
});

// factorial
test('factorial: factorial(0) is 1', () => {
  assert.strictEqual(factorial(0), 1);
});

test('factorial: factorial(1) is 1', () => {
  assert.strictEqual(factorial(1), 1);
});

test('factorial: factorial(5) is 120', () => {
  assert.strictEqual(factorial(5), 120);
});

test('factorial: factorial(10) is 3628800', () => {
  assert.strictEqual(factorial(10), 3628800);
});

test('factorial: throws on negative input', () => {
  assert.throws(() => factorial(-1), (err) => {
    assert.ok(err instanceof Error);
    assert.strictEqual(err.message, 'Negative number');
    return true;
  });
});

// Summary exit code handling: if any test failed, process.exitCode is set to 1 above.
process.on('exit', () => {
  if (process.exitCode && process.exitCode !== 0) {
    console.error('Some tests failed.');
  }
});