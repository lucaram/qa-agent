import assert from "node:assert/strict";
import { calculateCheckoutTotal } from "./checkout.js";
import { applyDiscount } from "./discount.js";
import { calculateTax } from "./tax.js";

// Tests for calculateCheckoutTotal
assert.strictEqual(calculateCheckoutTotal([], 0, 0.2), 0); // empty input
assert.strictEqual(calculateCheckoutTotal([{ price: 100, quantity: 1 }], 0, 0.2), 120); // single item
assert.strictEqual(calculateCheckoutTotal([{ price: 100, quantity: 2 }], 0, 0.2), 240); // single item multiple quantity
assert.strictEqual(calculateCheckoutTotal([{ price: 100, quantity: 1 }, { price: 200, quantity: 1 }], 0, 0.2), 360); // multiple items
assert.strictEqual(calculateCheckoutTotal([{ price: 100, quantity: 1 }], 10, 0.2), 108); // discount applied

// Tests for applyDiscount
assert.throws(() => applyDiscount(100, -1), { message: "Invalid discount" }); // negative discount
assert.throws(() => applyDiscount(100, 101), { message: "Invalid discount" }); // discount greater than 100
assert.strictEqual(applyDiscount(100, 0), 100); // no discount
assert.strictEqual(applyDiscount(100, 50), 50); // 50% discount

// Tests for calculateTax
assert.throws(() => calculateTax(-1, 0.2), { message: "Amount cannot be negative" }); // negative amount
assert.strictEqual(calculateTax(100, 0.2), 20); // valid tax calculation
assert.strictEqual(calculateTax(0, 0.2), 0); // tax on zero amount