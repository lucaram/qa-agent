export function calculateCommission(tradeValue, accountTier) {
  if (tradeValue < 0) {
    throw new Error("Trade value cannot be negative");
  }

  const tier = String(accountTier || "standard").toLowerCase();

  if (tier === "premium") {
    return Math.max(1.5, tradeValue * 0.001);
  }

  if (tier === "professional") {
    return Math.max(1, tradeValue * 0.0005);
  }

  return Math.max(3, tradeValue * 0.0025);
}

export function calculateStampDuty(tradeValue, side, market) {
  if (tradeValue < 0) {
    throw new Error("Trade value cannot be negative");
  }

  const normalizedSide = String(side || "").toUpperCase();
  const normalizedMarket = String(market || "").toUpperCase();

  if (normalizedSide !== "BUY") {
    return 0;
  }

  if (normalizedMarket === "UK") {
    return tradeValue * 0.005;
  }

  return 0;
}

export function calculateFxFee(tradeValue, settlementCurrency, instrumentCurrency) {
  if (tradeValue < 0) {
    throw new Error("Trade value cannot be negative");
  }

  if (!settlementCurrency || !instrumentCurrency) {
    throw new Error("Currency is required");
  }

  if (String(settlementCurrency).toUpperCase() === String(instrumentCurrency).toUpperCase()) {
    return 0;
  }

  return tradeValue * 0.004;
}