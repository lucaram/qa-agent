import { calculateMarketValue, calculateWeightedAveragePrice } from "./pricing.js";

export function valuePosition(position, marketPrice) {
  if (!position) {
    throw new Error("Position is required");
  }

  return calculateMarketValue(position.quantity, marketPrice);
}

export function calculateUnrealisedPnl(position, marketPrice) {
  if (!position) {
    throw new Error("Position is required");
  }

  const currentValue = valuePosition(position, marketPrice);
  const bookValue = position.quantity * position.averagePrice;

  return currentValue - bookValue;
}

export function applyBuyToPosition(position, quantity, price) {
  if (!position) {
    throw new Error("Position is required");
  }

  const newAveragePrice = calculateWeightedAveragePrice(
    position.quantity,
    position.averagePrice,
    quantity,
    price
  );

  return {
    symbol: position.symbol,
    quantity: position.quantity + quantity,
    averagePrice: newAveragePrice
  };
}

export function applySellToPosition(position, quantity) {
  if (!position) {
    throw new Error("Position is required");
  }

  if (quantity <= 0) {
    throw new Error("Sell quantity must be positive");
  }

  if (quantity > position.quantity) {
    throw new Error("Cannot sell more than current holding");
  }

  return {
    symbol: position.symbol,
    quantity: position.quantity - quantity,
    averagePrice: position.averagePrice
  };
}

export function calculatePortfolioValue(positions, marketPrices) {
  if (!Array.isArray(positions)) {
    throw new Error("Positions must be an array");
  }

  return positions.reduce((total, position) => {
    const price = marketPrices[position.symbol];

    if (price === undefined) {
      throw new Error("Missing market price");
    }

    return total + valuePosition(position, price);
  }, 0);
}