export function applyDiscount(amount, discountPercent) {
  if (discountPercent < 0 || discountPercent > 100) {
    throw new Error("Invalid discount");
  }

  return amount - (amount * discountPercent / 100);
}