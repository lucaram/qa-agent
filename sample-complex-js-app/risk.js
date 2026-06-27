import { calculateTotalCashImpact } from "./orders.js";

export function hasSufficientCash(cashBalance, order, executionPrice, accountTier) {
  if (cashBalance < 0) {
    throw new Error("Cash balance cannot be negative");
  }

  const impact = calculateTotalCashImpact(order, executionPrice, accountTier);

  if (impact >= 0) {
    return true;
  }

  return cashBalance + impact >= 0;
}

export function checkConcentrationLimit(orderValue, portfolioValue, maxPercent) {
  if (orderValue < 0 || portfolioValue < 0) {
    throw new Error("Values cannot be negative");
  }

  if (maxPercent <= 0 || maxPercent > 100) {
    throw new Error("Invalid concentration limit");
  }

  if (portfolioValue === 0) {
    return orderValue === 0;
  }

  return (orderValue / portfolioValue) * 100 <= maxPercent;
}

export function calculateRiskScore(cashBalance, portfolioValue, openOrderValue) {
  if (cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0) {
    throw new Error("Risk inputs cannot be negative");
  }

  const exposure = portfolioValue + openOrderValue;
  const totalAssets = cashBalance + portfolioValue;

  if (totalAssets === 0) {
    return 0;
  }

  return Math.round((exposure / totalAssets) * 100);
}