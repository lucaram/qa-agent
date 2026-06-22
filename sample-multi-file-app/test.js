import assert from "node:assert/strict";

import { calculateCheckoutTotal } from "./checkout.js";
import { applyDiscount } from "./discount.js";
import { calculateTax } from "./tax.js";

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err);
    process.exitCode = 1;
  }
}

// Integration-style tests for top-level orchestrator: calculateCheckoutTotal
test("calculateCheckoutTotal: applies discount before tax (regression for order-of-operations)", () => {
  const items = [{ price: 100, quantity: 1 }]; // subtotal 100
  const discountPercent = 50; // discounted -> 50
  const taxRate = 0.1; // tax should be 5 if applied after discount

  const total = calculateCheckoutTotal(items, discountPercent, taxRate);
  assert.equal(total, 55);
});

test("calculateCheckoutTotal: computes subtotal from multiple items, applies discount before tax, then adds tax", () => {
  const items = [
    { price: 10, quantity: 2 }, // 20
    { price: 5, quantity: 3 }, // 15
  ];
  // subtotal = 35
  // discounted (10%) = 31.5
  // tax (20%) on discounted = 6.3
  // total = 37.8
  const total = calculateCheckoutTotal(items, 10, 0.2);
  assert.ok(Math.abs(total - 37.8) < 1e-12);
});

test("calculateCheckoutTotal: default discountPercent=0 and taxRate=0.2 are applied", () => {
  const items = [{ price: 50, quantity: 1 }]; // subtotal 50
  // discounted = 50
  // tax 20% = 10
  // total = 60
  const total = calculateCheckoutTotal(items);
  assert.equal(total, 60);
});

test("calculateCheckoutTotal: empty items results in 0 total", () => {
  const total = calculateCheckoutTotal([], 0, 0.2);
  assert.equal(total, 0);
});

test("calculateCheckoutTotal: invalid discount percent is rejected (propagates from applyDiscount)", () => {
  const items = [{ price: 10, quantity: 1 }];
  assert.throws(() => calculateCheckoutTotal(items, 101, 0.2), /Invalid discount/);
  assert.throws(() => calculateCheckoutTotal(items, -1, 0.2), /Invalid discount/);
});

test("calculateCheckoutTotal: negative subtotal triggers tax validation (propagates from calculateTax)", () => {
  // subtotal = -10; discounted = -10; calculateTax should throw
  const items = [{ price: -5, quantity: 2 }];
  assert.throws(() => calculateCheckoutTotal(items, 0, 0.2), /Amount cannot be negative/);
});

// Additional regression coverage: ensure tax is computed on discounted base even when discount is 0 or tax is 0
test("calculateCheckoutTotal: with taxRate=0 total equals discounted subtotal", () => {
  const items = [
    { price: 40, quantity: 1 }, // 40
    { price: 10, quantity: 2 }, // 20
  ]; // subtotal 60
  const total = calculateCheckoutTotal(items, 25, 0); // discounted 45
  assert.equal(total, 45);
});

test("calculateCheckoutTotal: with discountPercent=0 total equals subtotal + tax(subtotal)", () => {
  const items = [{ price: 80, quantity: 1 }]; // subtotal 80
  const total = calculateCheckoutTotal(items, 0, 0.125); // tax = 10
  assert.equal(total, 90);
});

// Unit tests for business-relevant exported dependencies
test("applyDiscount: 0% leaves amount unchanged", () => {
  assert.equal(applyDiscount(100, 0), 100);
});

test("applyDiscount: 100% yields 0", () => {
  assert.equal(applyDiscount(100, 100), 0);
});

test("applyDiscount: throws on discountPercent outside 0..100", () => {
  assert.throws(() => applyDiscount(100, -0.01), /Invalid discount/);
  assert.throws(() => applyDiscount(100, 100.01), /Invalid discount/);
});

test("calculateTax: returns amount * rate", () => {
  assert.equal(calculateTax(50, 0.2), 10);
  assert.equal(calculateTax(0, 0.2), 0);
});

test("calculateTax: throws when amount is negative", () => {
  assert.throws(() => calculateTax(-1, 0.2), /Amount cannot be negative/);
});