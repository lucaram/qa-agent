import { calculateTax } from "./tax.js";
import { applyDiscount } from "./discount.js";

export function calculateCheckoutTotal(items, discountPercent = 0, taxRate = 0.2) {
  const subtotal = items.reduce((total, item) => {
    return total + item.price * item.quantity;
  }, 0);

  const discounted = applyDiscount(subtotal, discountPercent);
  const tax = calculateTax(discounted, taxRate);

  return discounted + tax;
}
