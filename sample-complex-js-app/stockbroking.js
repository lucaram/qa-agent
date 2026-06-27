import {
  calculateOrderNotional,
  calculateOrderCharges,
  calculateTotalCashImpact
} from "./orders.js";

import {
  calculatePortfolioValue,
  calculateUnrealisedPnl,
  applyBuyToPosition,
  applySellToPosition
} from "./portfolio.js";

import {
  hasSufficientCash,
  checkConcentrationLimit,
  calculateRiskScore
} from "./risk.js";

import {
  calculateSettlementDate,
  calculateSettlementCashAmount
} from "./settlement.js";

import {
  applyStockSplit,
  calculateDividendPayment,
  applyRightsIssue
} from "./corporateActions.js";

export function previewOrder({
  order,
  executionPrice,
  accountTier,
  cashBalance,
  portfolioValue,
  maxConcentrationPercent,
  tradeDayIndex
}) {
  const notional = calculateOrderNotional(order, executionPrice);
  const charges = calculateOrderCharges(order, executionPrice, accountTier);
  const cashImpact = calculateTotalCashImpact(order, executionPrice, accountTier);
  const sufficientCash = hasSufficientCash(cashBalance, order, executionPrice, accountTier);
  const withinConcentrationLimit = checkConcentrationLimit(
    notional,
    portfolioValue,
    maxConcentrationPercent
  );
  const settlementDayIndex = calculateSettlementDate(tradeDayIndex, order.market);
  const settlementCashAmount = calculateSettlementCashAmount(order, executionPrice, charges);

  return {
    symbol: order.symbol,
    side: String(order.side).toUpperCase(),
    notional,
    charges,
    cashImpact,
    sufficientCash,
    withinConcentrationLimit,
    settlementDayIndex,
    settlementCashAmount
  };
}

export function calculateAccountSummary({
  positions,
  marketPrices,
  cashBalance,
  openOrderValue
}) {
  const portfolioValue = calculatePortfolioValue(positions, marketPrices);
  const riskScore = calculateRiskScore(cashBalance, portfolioValue, openOrderValue);

  return {
    cashBalance,
    portfolioValue,
    totalAccountValue: cashBalance + portfolioValue,
    riskScore
  };
}

export function applyExecutionToPosition(position, order, executionPrice) {
  const side = String(order.side || "").toUpperCase();

  if (side === "BUY") {
    return applyBuyToPosition(position, order.quantity, executionPrice);
  }

  if (side === "SELL") {
    return applySellToPosition(position, order.quantity);
  }

  throw new Error("Invalid order side");
}

export function calculatePositionReport(position, marketPrice) {
  const marketValue = position.quantity * marketPrice;
  const unrealisedPnl = calculateUnrealisedPnl(position, marketPrice);
  const pnlPercent = position.averagePrice === 0
    ? 0
    : (unrealisedPnl / (position.quantity * position.averagePrice)) * 100;

  return {
    symbol: position.symbol,
    quantity: position.quantity,
    averagePrice: position.averagePrice,
    marketPrice,
    marketValue,
    unrealisedPnl,
    pnlPercent
  };
}

export function applyCorporateActionToPosition(position, corporateAction) {
  if (!corporateAction) {
    throw new Error("Corporate action is required");
  }

  const type = String(corporateAction.type || "").toUpperCase();

  if (type === "STOCK_SPLIT") {
    return applyStockSplit(
      position,
      corporateAction.numerator,
      corporateAction.denominator
    );
  }

  if (type === "RIGHTS_ISSUE") {
    return applyRightsIssue(
      position,
      corporateAction.rightsRatio,
      corporateAction.subscriptionPrice
    );
  }

  throw new Error("Unsupported corporate action type");
}

export function calculateIncomeEvent(position, incomeEvent) {
  if (!incomeEvent) {
    throw new Error("Income event is required");
  }

  const type = String(incomeEvent.type || "").toUpperCase();

  if (type === "DIVIDEND") {
    return calculateDividendPayment(
      position,
      incomeEvent.dividendPerShare,
      incomeEvent.withholdingTaxRate
    );
  }

  throw new Error("Unsupported income event type");
}