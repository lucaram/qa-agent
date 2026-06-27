export function calculateMarketValue(quantity, price) {
  if (quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  if (price < 0) {
    throw new Error("Price cannot be negative");
  }

  return quantity * price;
}

export function applyPriceMovement(price, movementPercent) {
  if (price < 0) {
    throw new Error("Price cannot be negative");
  }

  if (movementPercent < -100) {
    throw new Error("Movement percent cannot reduce price below zero");
  }

  return price + (price * movementPercent / 100);
}

export function calculateWeightedAveragePrice(existingQuantity, existingAveragePrice, tradeQuantity, tradePrice) {
  if (existingQuantity < 0) {
    throw new Error("Existing quantity cannot be negative");
  }

  if (existingAveragePrice < 0 || tradePrice < 0) {
    throw new Error("Price cannot be negative");
  }

  if (tradeQuantity <= 0) {
    throw new Error("Trade quantity must be positive");
  }

  const totalCost = existingQuantity * existingAveragePrice + tradeQuantity * tradePrice;
  const totalQuantity = existingQuantity + tradeQuantity;

  return totalCost / totalQuantity;
}