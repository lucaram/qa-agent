import { calculateCheckoutTotal } from "./checkout.js";
import { applyDiscount } from "./discount.js";
import { calculateTax } from "./tax.js";
import assert from "node:assert/strict";

assert.strictEqual(calculateCheckoutTotal([{ price: 100, quantity: 2 }, { price: 50, quantity: 1 }], 10, 0.2), 270);
assert.strictEqual(applyDiscount(100, 10), 90);
assert.throws(() => applyDiscount(100, -1), { message: "Invalid discount" });
assert.throws(() => applyDiscount(100, 101), { message: "Invalid discount" });
assert.strictEqual(calculateTax(100, 0.2), 20);
assert.throws(() => calculateTax(-1, 0.2), { message: "Amount cannot be negative" });
