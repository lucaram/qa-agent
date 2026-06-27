export function applyStockSplit(position, numerator, denominator) {
  if (!position) {
    throw new Error("Position is required");
  }

  if (numerator <= 0 || denominator <= 0) {
    throw new Error("Split ratio must be positive");
  }

  return {
    symbol: position.symbol,
    quantity: position.quantity * numerator / denominator,
    averagePrice: position.averagePrice * denominator / numerator
  };
}

export function calculateDividendPayment(position, dividendPerShare, withholdingTaxRate) {
  if (!position) {
    throw new Error("Position is required");
  }

  if (dividendPerShare < 0) {
    throw new Error("Dividend cannot be negative");
  }

  if (withholdingTaxRate < 0 || withholdingTaxRate > 1) {
    throw new Error("Invalid withholding tax rate");
  }

  const grossDividend = position.quantity * dividendPerShare;
  const withholdingTax = grossDividend * withholdingTaxRate;

  return grossDividend - withholdingTax;
}

export function applyRightsIssue(position, rightsRatio, subscriptionPrice) {
  if (!position) {
    throw new Error("Position is required");
  }

  if (rightsRatio < 0 || subscriptionPrice < 0) {
    throw new Error("Rights issue inputs cannot be negative");
  }

  const newShares = position.quantity * rightsRatio;
  const totalCost = position.quantity * position.averagePrice + newShares * subscriptionPrice;
  const totalShares = position.quantity + newShares;

  return {
    symbol: position.symbol,
    quantity: totalShares,
    averagePrice: totalCost / totalShares
  };
}