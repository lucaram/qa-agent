export function calculateSettlementDate(tradeDayIndex, market) {
  if (tradeDayIndex < 0) {
    throw new Error("Trade day index cannot be negative");
  }

  const normalizedMarket = String(market || "").toUpperCase();

  if (normalizedMarket === "UK") {
    return tradeDayIndex + 2;
  }

  if (normalizedMarket === "US") {
    return tradeDayIndex + 1;
  }

  return tradeDayIndex + 3;
}

export function isSettlementDue(currentDayIndex, settlementDayIndex) {
  if (currentDayIndex < 0 || settlementDayIndex < 0) {
    throw new Error("Day index cannot be negative");
  }

  return currentDayIndex >= settlementDayIndex;
}

export function calculateSettlementCashAmount(order, executionPrice, charges) {
  if (!order) {
    throw new Error("Order is required");
  }

  if (executionPrice < 0 || charges < 0) {
    throw new Error("Amount cannot be negative");
  }

  const tradeValue = order.quantity * executionPrice;
  const side = String(order.side || "").toUpperCase();

  if (side === "BUY") {
    return tradeValue + charges;
  }

  if (side === "SELL") {
    return tradeValue - charges;
  }

  throw new Error("Invalid order side");
}