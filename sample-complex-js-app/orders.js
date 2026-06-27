import { calculateMarketValue } from "./pricing.js";
import { calculateCommission, calculateStampDuty, calculateFxFee } from "./fees.js";

export function validateOrder(order) {
  if (!order) {
    throw new Error("Order is required");
  }

  if (!["BUY", "SELL"].includes(String(order.side || "").toUpperCase())) {
    throw new Error("Invalid order side");
  }

  if (!order.symbol) {
    throw new Error("Symbol is required");
  }

  if (order.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  if (order.limitPrice !== undefined && order.limitPrice < 0) {
    throw new Error("Limit price cannot be negative");
  }

  return true;
}

export function calculateOrderNotional(order, executionPrice) {
  validateOrder(order);
  return calculateMarketValue(order.quantity, executionPrice);
}

export function calculateOrderCharges(order, executionPrice, accountTier) {
  validateOrder(order);

  const tradeValue = calculateOrderNotional(order, executionPrice);
  const commission = calculateCommission(tradeValue, accountTier);
  const stampDuty = calculateStampDuty(tradeValue, order.side, order.market);
  const fxFee = calculateFxFee(
    tradeValue,
    order.settlementCurrency,
    order.instrumentCurrency
  );

  return commission + stampDuty + fxFee;
}

export function calculateTotalCashImpact(order, executionPrice, accountTier) {
  validateOrder(order);

  const tradeValue = calculateOrderNotional(order, executionPrice);
  const charges = calculateOrderCharges(order, executionPrice, accountTier);
  const side = String(order.side).toUpperCase();

  if (side === "BUY") {
    return -(tradeValue + charges);
  }

  return tradeValue - charges;
}