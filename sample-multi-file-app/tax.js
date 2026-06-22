export function calculateTax(amount, rate) {
  if (amount < 0) {
    throw new Error("Amount cannot be negative");
  }

  return amount * rate;
}