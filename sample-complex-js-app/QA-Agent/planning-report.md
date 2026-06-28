# QA Planning Report

## Summary

Planning agent returned non-JSON output.

## Evidence Summary

- README/docs available: No
- Code available: Yes
- Deterministic analysis available: Yes
- Dependency graph available: Yes
- Call graph available: Yes
- Primary evidence: code, deterministic-analysis, dependency-graph, call-graph

## Public APIs

- **applyStockSplit** (corporateActions.js): Public function detected from repository analysis: applyStockSplit.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyStockSplit in corporateActions.js.

- **calculateDividendPayment** (corporateActions.js): Public function detected from repository analysis: calculateDividendPayment.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateDividendPayment in corporateActions.js.

- **applyRightsIssue** (corporateActions.js): Public function detected from repository analysis: applyRightsIssue.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyRightsIssue in corporateActions.js.

- **calculateCommission** (fees.js): Public function detected from repository analysis: calculateCommission.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateCommission in fees.js.

- **calculateStampDuty** (fees.js): Public function detected from repository analysis: calculateStampDuty.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateStampDuty in fees.js.

- **calculateFxFee** (fees.js): Public function detected from repository analysis: calculateFxFee.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateFxFee in fees.js.

- **validateOrder** (orders.js): Public function detected from repository analysis: validateOrder.
  - Source: code
  - Confidence: high
  - Evidence: Detected function validateOrder in orders.js.

- **calculateOrderNotional** (orders.js): Public function detected from repository analysis: calculateOrderNotional.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateOrderNotional in orders.js.

- **calculateOrderCharges** (orders.js): Public function detected from repository analysis: calculateOrderCharges.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateOrderCharges in orders.js.

- **calculateTotalCashImpact** (orders.js): Public function detected from repository analysis: calculateTotalCashImpact.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateTotalCashImpact in orders.js.

- **valuePosition** (portfolio.js): Public function detected from repository analysis: valuePosition.
  - Source: code
  - Confidence: high
  - Evidence: Detected function valuePosition in portfolio.js.

- **calculateUnrealisedPnl** (portfolio.js): Public function detected from repository analysis: calculateUnrealisedPnl.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateUnrealisedPnl in portfolio.js.

- **applyBuyToPosition** (portfolio.js): Public function detected from repository analysis: applyBuyToPosition.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyBuyToPosition in portfolio.js.

- **applySellToPosition** (portfolio.js): Public function detected from repository analysis: applySellToPosition.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applySellToPosition in portfolio.js.

- **calculatePortfolioValue** (portfolio.js): Public function detected from repository analysis: calculatePortfolioValue.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculatePortfolioValue in portfolio.js.

- **calculateMarketValue** (pricing.js): Public function detected from repository analysis: calculateMarketValue.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateMarketValue in pricing.js.

- **applyPriceMovement** (pricing.js): Public function detected from repository analysis: applyPriceMovement.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyPriceMovement in pricing.js.

- **calculateWeightedAveragePrice** (pricing.js): Public function detected from repository analysis: calculateWeightedAveragePrice.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateWeightedAveragePrice in pricing.js.

- **hasSufficientCash** (risk.js): Public function detected from repository analysis: hasSufficientCash.
  - Source: code
  - Confidence: high
  - Evidence: Detected function hasSufficientCash in risk.js.

- **checkConcentrationLimit** (risk.js): Public function detected from repository analysis: checkConcentrationLimit.
  - Source: code
  - Confidence: high
  - Evidence: Detected function checkConcentrationLimit in risk.js.

- **calculateRiskScore** (risk.js): Public function detected from repository analysis: calculateRiskScore.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateRiskScore in risk.js.

- **calculateSettlementDate** (settlement.js): Public function detected from repository analysis: calculateSettlementDate.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateSettlementDate in settlement.js.

- **isSettlementDue** (settlement.js): Public function detected from repository analysis: isSettlementDue.
  - Source: code
  - Confidence: high
  - Evidence: Detected function isSettlementDue in settlement.js.

- **calculateSettlementCashAmount** (settlement.js): Public function detected from repository analysis: calculateSettlementCashAmount.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateSettlementCashAmount in settlement.js.

- **previewOrder** (stockbroking.js): Public function detected from repository analysis: previewOrder.
  - Source: code
  - Confidence: high
  - Evidence: Detected function previewOrder in stockbroking.js.

- **calculateAccountSummary** (stockbroking.js): Public function detected from repository analysis: calculateAccountSummary.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateAccountSummary in stockbroking.js.

- **applyExecutionToPosition** (stockbroking.js): Public function detected from repository analysis: applyExecutionToPosition.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyExecutionToPosition in stockbroking.js.

- **calculatePositionReport** (stockbroking.js): Public function detected from repository analysis: calculatePositionReport.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculatePositionReport in stockbroking.js.

- **applyCorporateActionToPosition** (stockbroking.js): Public function detected from repository analysis: applyCorporateActionToPosition.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyCorporateActionToPosition in stockbroking.js.

- **calculateIncomeEvent** (stockbroking.js): Public function detected from repository analysis: calculateIncomeEvent.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateIncomeEvent in stockbroking.js.

## Business Rules

None identified.

## Algorithm Steps

None identified.

## Calculation Formulas

None identified.

## Validation Rules

None identified.

## State Machine

None identified.

## Data Flow

None identified.

## Dependency Flows

None identified.

## Side Effects

None identified.

## Preconditions

None identified.

## Postconditions

None identified.

## Invariants

None identified.

## Requirements vs Implementation

None identified.

## Happy Paths

None identified.

## Edge Cases

None identified.

## Exception Paths

None identified.

## Risk Areas

None identified.

## Mutation-Sensitive Behaviours

None identified.

## Test Examples

1 - **Deterministic example: applyStockSplit return behaviour** / applyStockSplit
  - Scenario: Call applyStockSplit with valid representative inputs.
  - Inputs: Call applyStockSplit with valid representative inputs. | args: {"symbol":"ABC","quantity":10,"averagePrice":10}; 10; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: {"symbol":"ABC","quantity":10,"averagePrice":10}
  - Expected calculation: throw guard !position = false; throw guard numerator <= 0 || denominator <= 0 = false; result = {
    symbol: position.symbol,
    quantity: position.quantity * numerator / denominator,
    averagePrice: position.averagePrice * denominator / numerator
  } = {"symbol":"ABC","quantity":10,"averagePrice":10}
  - Expected behaviour: Returns [object Object].
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals [object Object].
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from corporateActions.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyStockSplit validation exception** / applyStockSplit
  - Scenario: Call applyStockSplit with invalid input for validation condition: !position.
  - Inputs: Call applyStockSplit with invalid input for validation condition: !position. | args: null; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyStockSplit validation exception** / applyStockSplit
  - Scenario: Call applyStockSplit with invalid input for validation condition: numerator <= 0 || denominator <= 0.
  - Inputs: Call applyStockSplit with invalid input for validation condition: numerator <= 0 || denominator <= 0. | args: {"symbol":"ABC","quantity":10,"averagePrice":10}; 0; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Split ratio must be positive.
  - Expected exception: Split ratio must be positive
  - Assertion hint: Assert call throws Split ratio must be positive.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: numerator <= 0 || denominator <= 0; Detected direct throw for validation condition: Split ratio must be positive

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: !position.
  - Inputs: Call calculateDividendPayment with invalid input for validation condition: !position. | args: null; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: dividendPerShare < 0.
  - Inputs: Call calculateDividendPayment with invalid input for validation condition: dividendPerShare < 0. | args: {"quantity":10}; -1; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Dividend cannot be negative.
  - Expected exception: Dividend cannot be negative
  - Assertion hint: Assert call throws Dividend cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: dividendPerShare < 0; Detected direct throw for validation condition: Dividend cannot be negative

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: withholdingTaxRate < 0 || withholdingTaxRate > 1.
  - Inputs: Call calculateDividendPayment with invalid input for validation condition: withholdingTaxRate < 0 || withholdingTaxRate > 1. | args: {"quantity":10}; 10; 2 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Invalid withholding tax rate.
  - Expected exception: Invalid withholding tax rate
  - Assertion hint: Assert call throws Invalid withholding tax rate.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: withholdingTaxRate < 0 || withholdingTaxRate > 1; Detected direct throw for validation condition: Invalid withholding tax rate

1 - **Deterministic example: applyRightsIssue return behaviour** / applyRightsIssue
  - Scenario: Call applyRightsIssue with valid representative inputs.
  - Inputs: Call applyRightsIssue with valid representative inputs. | args: {"quantity":10,"averagePrice":10,"symbol":"ABC"}; 10; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: {"symbol":"ABC","quantity":110,"averagePrice":10}
  - Expected calculation: throw guard !position = false; throw guard rightsRatio < 0 || subscriptionPrice < 0 = false; newShares = position.quantity * rightsRatio = 10 * 10 = 100; totalCost = position.quantity * position.averagePrice + newShares * subscriptionPrice = 10 * 10 + 100 * 10 = 1100; totalShares = position.quantity + newShares = 10 + 100 = 110; result = {
    symbol: position.symbol,
    quantity: totalShares,
    averagePrice: totalCost / totalShares
  } = {"symbol":"ABC","quantity":110,"averagePrice":10}
  - Expected behaviour: Returns [object Object].
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals [object Object].
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from corporateActions.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyRightsIssue validation exception** / applyRightsIssue
  - Scenario: Call applyRightsIssue with invalid input for validation condition: !position.
  - Inputs: Call applyRightsIssue with invalid input for validation condition: !position. | args: null; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyRightsIssue validation exception** / applyRightsIssue
  - Scenario: Call applyRightsIssue with invalid input for validation condition: rightsRatio < 0 || subscriptionPrice < 0.
  - Inputs: Call applyRightsIssue with invalid input for validation condition: rightsRatio < 0 || subscriptionPrice < 0. | args: {"quantity":10,"averagePrice":10,"symbol":"ABC"}; -1; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Rights issue inputs cannot be negative.
  - Expected exception: Rights issue inputs cannot be negative
  - Assertion hint: Assert call throws Rights issue inputs cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: rightsRatio < 0 || subscriptionPrice < 0; Detected direct throw for validation condition: Rights issue inputs cannot be negative

1 - **Deterministic example: calculateCommission validation exception** / calculateCommission
  - Scenario: Call calculateCommission with invalid input for validation condition: tradeValue < 0.
  - Inputs: Call calculateCommission with invalid input for validation condition: tradeValue < 0. | args: -1; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Trade value cannot be negative.
  - Expected exception: Trade value cannot be negative
  - Assertion hint: Assert call throws Trade value cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateStampDuty validation exception** / calculateStampDuty
  - Scenario: Call calculateStampDuty with invalid input for validation condition: tradeValue < 0.
  - Inputs: Call calculateStampDuty with invalid input for validation condition: tradeValue < 0. | args: -1; "BUY"; "UK" | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Trade value cannot be negative.
  - Expected exception: Trade value cannot be negative
  - Assertion hint: Assert call throws Trade value cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateFxFee return behaviour** / calculateFxFee
  - Scenario: Call calculateFxFee with valid representative inputs.
  - Inputs: Call calculateFxFee with valid representative inputs. | args: 10; 10; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 0
  - Expected calculation: throw guard tradeValue < 0 = false; throw guard !settlementCurrency || !instrumentCurrency = false; guard String(settlementCurrency).toUpperCase() === String(instrumentCurrency).toUpperCase() = true; result = 0 = 0
  - Expected behaviour: Returns 0.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 0.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from fees.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateFxFee validation exception** / calculateFxFee
  - Scenario: Call calculateFxFee with invalid input for validation condition: tradeValue < 0.
  - Inputs: Call calculateFxFee with invalid input for validation condition: tradeValue < 0. | args: -1; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Trade value cannot be negative.
  - Expected exception: Trade value cannot be negative
  - Assertion hint: Assert call throws Trade value cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateFxFee validation exception** / calculateFxFee
  - Scenario: Call calculateFxFee with invalid input for validation condition: !settlementCurrency || !instrumentCurrency.
  - Inputs: Call calculateFxFee with invalid input for validation condition: !settlementCurrency || !instrumentCurrency. | args: 10; null; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Currency is required.
  - Expected exception: Currency is required
  - Assertion hint: Assert call throws Currency is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: !settlementCurrency || !instrumentCurrency; Detected direct throw for validation condition: Currency is required

1 - **Deterministic example: validateOrder return behaviour** / validateOrder
  - Scenario: Call validateOrder with valid representative inputs.
  - Inputs: Call validateOrder with valid representative inputs. | args: {"side":"BUY","symbol":"ABC","quantity":10,"limitPrice":10} | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: true
  - Expected calculation: throw guard !order = false; throw guard !["BUY", "SELL"].includes(String(order.side || "").toUpperCase()) = false; throw guard !order.symbol = false; throw guard order.quantity <= 0 = false; throw guard order.limitPrice !== undefined && order.limitPrice < 0 = false; result = true
  - Expected behaviour: Returns true.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals true.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from orders.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Scenario: Call validateOrder with invalid input for validation condition: !order.
  - Inputs: Call validateOrder with invalid input for validation condition: !order. | args: null | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Order is required.
  - Expected exception: Order is required
  - Assertion hint: Assert call throws Order is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: !order; Detected direct throw for validation condition: Order is required

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Scenario: Call validateOrder with invalid input for validation condition: !order.symbol.
  - Inputs: Call validateOrder with invalid input for validation condition: !order.symbol. | args: {"symbol":null,"side":"BUY","quantity":10,"limitPrice":10} | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Symbol is required.
  - Expected exception: Symbol is required
  - Assertion hint: Assert call throws Symbol is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: !order.symbol; Detected direct throw for validation condition: Symbol is required

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Scenario: Call validateOrder with invalid input for validation condition: order.quantity <= 0.
  - Inputs: Call validateOrder with invalid input for validation condition: order.quantity <= 0. | args: {"quantity":0,"side":"BUY","symbol":"ABC","limitPrice":10} | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Quantity must be positive.
  - Expected exception: Quantity must be positive
  - Assertion hint: Assert call throws Quantity must be positive.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: order.quantity <= 0; Detected direct throw for validation condition: Quantity must be positive

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Scenario: Call validateOrder with invalid input for validation condition: order.limitPrice !== undefined && order.limitPrice < 0.
  - Inputs: Call validateOrder with invalid input for validation condition: order.limitPrice !== undefined && order.limitPrice < 0. | args: {"limitPrice":-1,"side":"BUY","symbol":"ABC","quantity":10} | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Limit price cannot be negative.
  - Expected exception: Limit price cannot be negative
  - Assertion hint: Assert call throws Limit price cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: order.limitPrice !== undefined && order.limitPrice < 0; Detected direct throw for validation condition: Limit price cannot be negative

1 - **Deterministic example: valuePosition return behaviour** / valuePosition
  - Scenario: Call valuePosition with valid representative inputs.
  - Inputs: Call valuePosition with valid representative inputs. | args: {"quantity":10}; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 100
  - Expected calculation: throw guard !position = false; result = calculateMarketValue(position.quantity, marketPrice) = 100
  - Expected behaviour: Returns 100.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 100.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: valuePosition validation exception** / valuePosition
  - Scenario: Call valuePosition with invalid input for validation condition: !position.
  - Inputs: Call valuePosition with invalid input for validation condition: !position. | args: null; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: calculateUnrealisedPnl return behaviour** / calculateUnrealisedPnl
  - Scenario: Call calculateUnrealisedPnl with valid representative inputs.
  - Inputs: Call calculateUnrealisedPnl with valid representative inputs. | args: {"quantity":10,"averagePrice":10}; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 0
  - Expected calculation: throw guard !position = false; currentValue = valuePosition(position, marketPrice) = 100; bookValue = position.quantity * position.averagePrice = 10 * 10 = 100; result = currentValue - bookValue = 100 - 100 = 0
  - Expected behaviour: Returns 0.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 0.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateUnrealisedPnl validation exception** / calculateUnrealisedPnl
  - Scenario: Call calculateUnrealisedPnl with invalid input for validation condition: !position.
  - Inputs: Call calculateUnrealisedPnl with invalid input for validation condition: !position. | args: null; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyBuyToPosition return behaviour** / applyBuyToPosition
  - Scenario: Call applyBuyToPosition with valid representative inputs.
  - Inputs: Call applyBuyToPosition with valid representative inputs. | args: {"quantity":10,"averagePrice":10,"symbol":"ABC"}; 10; 100 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: {"symbol":"ABC","quantity":20,"averagePrice":55}
  - Expected calculation: throw guard !position = false; newAveragePrice = calculateWeightedAveragePrice(position.quantity, position.averagePrice, quantity, price) = 55; result = {
    symbol: position.symbol,
    quantity: position.quantity + quantity,
    averagePrice: newAveragePrice
  } = {"symbol":"ABC","quantity":20,"averagePrice":55}
  - Expected behaviour: Returns [object Object].
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals [object Object].
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyBuyToPosition validation exception** / applyBuyToPosition
  - Scenario: Call applyBuyToPosition with invalid input for validation condition: !position.
  - Inputs: Call applyBuyToPosition with invalid input for validation condition: !position. | args: null; 10; 100 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applySellToPosition return behaviour** / applySellToPosition
  - Scenario: Call applySellToPosition with valid representative inputs.
  - Inputs: Call applySellToPosition with valid representative inputs. | args: {"quantity":10,"symbol":"ABC","averagePrice":10}; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: {"symbol":"ABC","quantity":0,"averagePrice":10}
  - Expected calculation: throw guard !position = false; throw guard quantity <= 0 = false; throw guard quantity > position.quantity = false; result = {
    symbol: position.symbol,
    quantity: position.quantity - quantity,
    averagePrice: position.averagePrice
  } = {"symbol":"ABC","quantity":0,"averagePrice":10}
  - Expected behaviour: Returns [object Object].
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals [object Object].
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Scenario: Call applySellToPosition with invalid input for validation condition: !position.
  - Inputs: Call applySellToPosition with invalid input for validation condition: !position. | args: null; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Position is required.
  - Expected exception: Position is required
  - Assertion hint: Assert call throws Position is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Scenario: Call applySellToPosition with invalid input for validation condition: quantity <= 0.
  - Inputs: Call applySellToPosition with invalid input for validation condition: quantity <= 0. | args: {"quantity":10,"symbol":"ABC","averagePrice":10}; 0 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Sell quantity must be positive.
  - Expected exception: Sell quantity must be positive
  - Assertion hint: Assert call throws Sell quantity must be positive.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: quantity <= 0; Detected direct throw for validation condition: Sell quantity must be positive

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Scenario: Call applySellToPosition with invalid input for validation condition: quantity > position.quantity.
  - Inputs: Call applySellToPosition with invalid input for validation condition: quantity > position.quantity. | args: {"quantity":-1,"symbol":"ABC","averagePrice":10}; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Cannot sell more than current holding.
  - Expected exception: Cannot sell more than current holding
  - Assertion hint: Assert call throws Cannot sell more than current holding.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: quantity > position.quantity; Detected direct throw for validation condition: Cannot sell more than current holding

1 - **Deterministic example: calculateMarketValue return behaviour** / calculateMarketValue
  - Scenario: Call calculateMarketValue with valid representative inputs.
  - Inputs: Call calculateMarketValue with valid representative inputs. | args: 10; 100 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 1000
  - Expected calculation: throw guard quantity <= 0 = false; throw guard price < 0 = false; result = quantity * price = 10 * 100 = 1000
  - Expected behaviour: Returns 1000.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 1000.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateMarketValue validation exception** / calculateMarketValue
  - Scenario: Call calculateMarketValue with invalid input for validation condition: quantity <= 0.
  - Inputs: Call calculateMarketValue with invalid input for validation condition: quantity <= 0. | args: 0; 100 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Quantity must be positive.
  - Expected exception: Quantity must be positive
  - Assertion hint: Assert call throws Quantity must be positive.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: quantity <= 0; Detected direct throw for validation condition: Quantity must be positive

1 - **Deterministic example: calculateMarketValue validation exception** / calculateMarketValue
  - Scenario: Call calculateMarketValue with invalid input for validation condition: price < 0.
  - Inputs: Call calculateMarketValue with invalid input for validation condition: price < 0. | args: 10; -1 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Price cannot be negative.
  - Expected exception: Price cannot be negative
  - Assertion hint: Assert call throws Price cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: price < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: applyPriceMovement return behaviour** / applyPriceMovement
  - Scenario: Call applyPriceMovement with valid representative inputs.
  - Inputs: Call applyPriceMovement with valid representative inputs. | args: 100; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 110
  - Expected calculation: throw guard price < 0 = false; throw guard movementPercent < -100 = false; result = price + (price * movementPercent / 100) = 100 + (100 * 10 / 100) = 110
  - Expected behaviour: Returns 110.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 110.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyPriceMovement validation exception** / applyPriceMovement
  - Scenario: Call applyPriceMovement with invalid input for validation condition: price < 0.
  - Inputs: Call applyPriceMovement with invalid input for validation condition: price < 0. | args: -1; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Price cannot be negative.
  - Expected exception: Price cannot be negative
  - Assertion hint: Assert call throws Price cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: price < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: applyPriceMovement validation exception** / applyPriceMovement
  - Scenario: Call applyPriceMovement with invalid input for validation condition: movementPercent < -100.
  - Inputs: Call applyPriceMovement with invalid input for validation condition: movementPercent < -100. | args: 100; -101 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Movement percent cannot reduce price below zero.
  - Expected exception: Movement percent cannot reduce price below zero
  - Assertion hint: Assert call throws Movement percent cannot reduce price below zero.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: movementPercent < -100; Detected direct throw for validation condition: Movement percent cannot reduce price below zero

1 - **Deterministic example: calculateWeightedAveragePrice return behaviour** / calculateWeightedAveragePrice
  - Scenario: Call calculateWeightedAveragePrice with valid representative inputs.
  - Inputs: Call calculateWeightedAveragePrice with valid representative inputs. | args: 10; 10; 10; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 10
  - Expected calculation: throw guard existingQuantity < 0 = false; throw guard existingAveragePrice < 0 || tradePrice < 0 = false; throw guard tradeQuantity <= 0 = false; totalCost = existingQuantity * existingAveragePrice + tradeQuantity * tradePrice = 10 * 10 + 10 * 10 = 200; totalQuantity = existingQuantity + tradeQuantity = 10 + 10 = 20; result = totalCost / totalQuantity = 200 / 20 = 10
  - Expected behaviour: Returns 10.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 10.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: existingQuantity < 0.
  - Inputs: Call calculateWeightedAveragePrice with invalid input for validation condition: existingQuantity < 0. | args: -1; 10; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Existing quantity cannot be negative.
  - Expected exception: Existing quantity cannot be negative
  - Assertion hint: Assert call throws Existing quantity cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: existingQuantity < 0; Detected direct throw for validation condition: Existing quantity cannot be negative

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: existingAveragePrice < 0 || tradePrice < 0.
  - Inputs: Call calculateWeightedAveragePrice with invalid input for validation condition: existingAveragePrice < 0 || tradePrice < 0. | args: 10; -1; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Price cannot be negative.
  - Expected exception: Price cannot be negative
  - Assertion hint: Assert call throws Price cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: existingAveragePrice < 0 || tradePrice < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: tradeQuantity <= 0.
  - Inputs: Call calculateWeightedAveragePrice with invalid input for validation condition: tradeQuantity <= 0. | args: 10; 10; 0; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Trade quantity must be positive.
  - Expected exception: Trade quantity must be positive
  - Assertion hint: Assert call throws Trade quantity must be positive.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: tradeQuantity <= 0; Detected direct throw for validation condition: Trade quantity must be positive

1 - **Deterministic example: hasSufficientCash validation exception** / hasSufficientCash
  - Scenario: Call hasSufficientCash with invalid input for validation condition: cashBalance < 0.
  - Inputs: Call hasSufficientCash with invalid input for validation condition: cashBalance < 0. | args: -1; 10; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Cash balance cannot be negative.
  - Expected exception: Cash balance cannot be negative
  - Assertion hint: Assert call throws Cash balance cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: cashBalance < 0; Detected direct throw for validation condition: Cash balance cannot be negative

1 - **Deterministic example: checkConcentrationLimit validation exception** / checkConcentrationLimit
  - Scenario: Call checkConcentrationLimit with invalid input for validation condition: orderValue < 0 || portfolioValue < 0.
  - Inputs: Call checkConcentrationLimit with invalid input for validation condition: orderValue < 0 || portfolioValue < 0. | args: -1; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Values cannot be negative.
  - Expected exception: Values cannot be negative
  - Assertion hint: Assert call throws Values cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: orderValue < 0 || portfolioValue < 0; Detected direct throw for validation condition: Values cannot be negative

1 - **Deterministic example: checkConcentrationLimit validation exception** / checkConcentrationLimit
  - Scenario: Call checkConcentrationLimit with invalid input for validation condition: maxPercent <= 0 || maxPercent > 100.
  - Inputs: Call checkConcentrationLimit with invalid input for validation condition: maxPercent <= 0 || maxPercent > 100. | args: 10; 10; 101 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Invalid concentration limit.
  - Expected exception: Invalid concentration limit
  - Assertion hint: Assert call throws Invalid concentration limit.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: maxPercent <= 0 || maxPercent > 100; Detected direct throw for validation condition: Invalid concentration limit

1 - **Deterministic example: calculateRiskScore validation exception** / calculateRiskScore
  - Scenario: Call calculateRiskScore with invalid input for validation condition: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0.
  - Inputs: Call calculateRiskScore with invalid input for validation condition: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0. | args: -1; 10; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Risk inputs cannot be negative.
  - Expected exception: Risk inputs cannot be negative
  - Assertion hint: Assert call throws Risk inputs cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0; Detected direct throw for validation condition: Risk inputs cannot be negative

1 - **Deterministic example: calculateSettlementDate validation exception** / calculateSettlementDate
  - Scenario: Call calculateSettlementDate with invalid input for validation condition: tradeDayIndex < 0.
  - Inputs: Call calculateSettlementDate with invalid input for validation condition: tradeDayIndex < 0. | args: -1; "UK" | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Trade day index cannot be negative.
  - Expected exception: Trade day index cannot be negative
  - Assertion hint: Assert call throws Trade day index cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: tradeDayIndex < 0; Detected direct throw for validation condition: Trade day index cannot be negative

1 - **Deterministic example: isSettlementDue validation exception** / isSettlementDue
  - Scenario: Call isSettlementDue with invalid input for validation condition: currentDayIndex < 0 || settlementDayIndex < 0.
  - Inputs: Call isSettlementDue with invalid input for validation condition: currentDayIndex < 0 || settlementDayIndex < 0. | args: -1; 10 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Day index cannot be negative.
  - Expected exception: Day index cannot be negative
  - Assertion hint: Assert call throws Day index cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: currentDayIndex < 0 || settlementDayIndex < 0; Detected direct throw for validation condition: Day index cannot be negative

1 - **Deterministic example: calculateSettlementCashAmount validation exception** / calculateSettlementCashAmount
  - Scenario: Call calculateSettlementCashAmount with invalid input for validation condition: !order.
  - Inputs: Call calculateSettlementCashAmount with invalid input for validation condition: !order. | args: null; 10; [{"quantity":10,"side":"BUY"}] | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Order is required.
  - Expected exception: Order is required
  - Assertion hint: Assert call throws Order is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: !order; Detected direct throw for validation condition: Order is required

1 - **Deterministic example: calculateSettlementCashAmount validation exception** / calculateSettlementCashAmount
  - Scenario: Call calculateSettlementCashAmount with invalid input for validation condition: executionPrice < 0 || charges < 0.
  - Inputs: Call calculateSettlementCashAmount with invalid input for validation condition: executionPrice < 0 || charges < 0. | args: {"quantity":10,"side":"BUY"}; -1; [{"quantity":10,"side":"BUY"}] | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Amount cannot be negative.
  - Expected exception: Amount cannot be negative
  - Assertion hint: Assert call throws Amount cannot be negative.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: executionPrice < 0 || charges < 0; Detected direct throw for validation condition: Amount cannot be negative

1 - **Deterministic example: calculatePositionReport return behaviour** / calculatePositionReport
  - Scenario: Call calculatePositionReport with valid representative inputs.
  - Inputs: Call calculatePositionReport with valid representative inputs. | args: {"quantity":10,"averagePrice":10,"symbol":"ABC"}; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: {"symbol":"ABC","quantity":10,"averagePrice":10,"marketPrice":10,"marketValue":100,"unrealisedPnl":0,"pnlPercent":0}
  - Expected calculation: marketValue = position.quantity * marketPrice = 10 * 10 = 100; unrealisedPnl = calculateUnrealisedPnl(position, marketPrice) = 0; pnlPercent = position.averagePrice === 0
    ? 0
    : (unrealisedPnl / (position.quantity * position.averagePrice)) * 100 = (unrealisedPnl / (position.quantity * position.averagePrice)) * 100 = (0 / (10 * 10)) * 100 = 0; result = {
    symbol: position.symbol,
    quantity: position.quantity,
    averagePrice: position.averagePrice,
    marketPrice,
    marketValue,
    unrealisedPnl,
    pnlPercent
  } = {"symbol":"ABC","quantity":10,"averagePrice":10,"marketPrice":10,"marketValue":100,"unrealisedPnl":0,"pnlPercent":0}
  - Expected behaviour: Returns [object Object].
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals [object Object].
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from stockbroking.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyCorporateActionToPosition validation exception** / applyCorporateActionToPosition
  - Scenario: Call applyCorporateActionToPosition with invalid input for validation condition: !corporateAction.
  - Inputs: Call applyCorporateActionToPosition with invalid input for validation condition: !corporateAction. | args: 10; null | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Corporate action is required.
  - Expected exception: Corporate action is required
  - Assertion hint: Assert call throws Corporate action is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in stockbroking.js: !corporateAction; Detected direct throw for validation condition: Corporate action is required

1 - **Deterministic example: calculateIncomeEvent validation exception** / calculateIncomeEvent
  - Scenario: Call calculateIncomeEvent with invalid input for validation condition: !incomeEvent.
  - Inputs: Call calculateIncomeEvent with invalid input for validation condition: !incomeEvent. | args: 10; null | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Income event is required.
  - Expected exception: Income event is required
  - Assertion hint: Assert call throws Income event is required.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in stockbroking.js: !incomeEvent; Detected direct throw for validation condition: Income event is required

## Missing Requirements

None identified.

## Prioritised Test Plan

1 - **Deterministic example: applyStockSplit return behaviour** / applyStockSplit
  - Type: unit
  - Scenario: Call applyStockSplit with valid representative inputs.
  - Expected: Returns [object Object].
  - Test examples: applystocksplit-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from corporateActions.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyStockSplit validation exception** / applyStockSplit
  - Type: unit
  - Scenario: Call applyStockSplit with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: applystocksplit-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyStockSplit validation exception** / applyStockSplit
  - Type: unit
  - Scenario: Call applyStockSplit with invalid input for validation condition: numerator <= 0 || denominator <= 0.
  - Expected: Throws Split ratio must be positive.
  - Test examples: applystocksplit-deterministic-numerator-0-denominator-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: numerator <= 0 || denominator <= 0; Detected direct throw for validation condition: Split ratio must be positive

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Type: unit
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: calculatedividendpayment-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Type: unit
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: dividendPerShare < 0.
  - Expected: Throws Dividend cannot be negative.
  - Test examples: calculatedividendpayment-deterministic-dividendpershare-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: dividendPerShare < 0; Detected direct throw for validation condition: Dividend cannot be negative

1 - **Deterministic example: calculateDividendPayment validation exception** / calculateDividendPayment
  - Type: unit
  - Scenario: Call calculateDividendPayment with invalid input for validation condition: withholdingTaxRate < 0 || withholdingTaxRate > 1.
  - Expected: Throws Invalid withholding tax rate.
  - Test examples: calculatedividendpayment-deterministic-withholdingtaxrate-0-withholdingtaxrate-1
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: withholdingTaxRate < 0 || withholdingTaxRate > 1; Detected direct throw for validation condition: Invalid withholding tax rate

1 - **Deterministic example: applyRightsIssue return behaviour** / applyRightsIssue
  - Type: unit
  - Scenario: Call applyRightsIssue with valid representative inputs.
  - Expected: Returns [object Object].
  - Test examples: applyrightsissue-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from corporateActions.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyRightsIssue validation exception** / applyRightsIssue
  - Type: unit
  - Scenario: Call applyRightsIssue with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: applyrightsissue-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyRightsIssue validation exception** / applyRightsIssue
  - Type: unit
  - Scenario: Call applyRightsIssue with invalid input for validation condition: rightsRatio < 0 || subscriptionPrice < 0.
  - Expected: Throws Rights issue inputs cannot be negative.
  - Test examples: applyrightsissue-deterministic-rightsratio-0-subscriptionprice-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in corporateActions.js: rightsRatio < 0 || subscriptionPrice < 0; Detected direct throw for validation condition: Rights issue inputs cannot be negative

1 - **Deterministic example: calculateCommission validation exception** / calculateCommission
  - Type: unit
  - Scenario: Call calculateCommission with invalid input for validation condition: tradeValue < 0.
  - Expected: Throws Trade value cannot be negative.
  - Test examples: calculatecommission-deterministic-tradevalue-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateStampDuty validation exception** / calculateStampDuty
  - Type: unit
  - Scenario: Call calculateStampDuty with invalid input for validation condition: tradeValue < 0.
  - Expected: Throws Trade value cannot be negative.
  - Test examples: calculatestampduty-deterministic-tradevalue-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateFxFee return behaviour** / calculateFxFee
  - Type: unit
  - Scenario: Call calculateFxFee with valid representative inputs.
  - Expected: Returns 0.
  - Test examples: calculatefxfee-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from fees.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateFxFee validation exception** / calculateFxFee
  - Type: unit
  - Scenario: Call calculateFxFee with invalid input for validation condition: tradeValue < 0.
  - Expected: Throws Trade value cannot be negative.
  - Test examples: calculatefxfee-deterministic-tradevalue-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: tradeValue < 0; Detected direct throw for validation condition: Trade value cannot be negative

1 - **Deterministic example: calculateFxFee validation exception** / calculateFxFee
  - Type: unit
  - Scenario: Call calculateFxFee with invalid input for validation condition: !settlementCurrency || !instrumentCurrency.
  - Expected: Throws Currency is required.
  - Test examples: calculatefxfee-deterministic-settlementcurrency-instrumentcurrency
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in fees.js: !settlementCurrency || !instrumentCurrency; Detected direct throw for validation condition: Currency is required

1 - **Deterministic example: validateOrder return behaviour** / validateOrder
  - Type: unit
  - Scenario: Call validateOrder with valid representative inputs.
  - Expected: Returns true.
  - Test examples: validateorder-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from orders.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Type: unit
  - Scenario: Call validateOrder with invalid input for validation condition: !order.
  - Expected: Throws Order is required.
  - Test examples: validateorder-deterministic-order
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: !order; Detected direct throw for validation condition: Order is required

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Type: unit
  - Scenario: Call validateOrder with invalid input for validation condition: !order.symbol.
  - Expected: Throws Symbol is required.
  - Test examples: validateorder-deterministic-order-symbol
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: !order.symbol; Detected direct throw for validation condition: Symbol is required

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Type: unit
  - Scenario: Call validateOrder with invalid input for validation condition: order.quantity <= 0.
  - Expected: Throws Quantity must be positive.
  - Test examples: validateorder-deterministic-order-quantity-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: order.quantity <= 0; Detected direct throw for validation condition: Quantity must be positive

1 - **Deterministic example: validateOrder validation exception** / validateOrder
  - Type: unit
  - Scenario: Call validateOrder with invalid input for validation condition: order.limitPrice !== undefined && order.limitPrice < 0.
  - Expected: Throws Limit price cannot be negative.
  - Test examples: validateorder-deterministic-order-limitprice-undefined-order-limitprice-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in orders.js: order.limitPrice !== undefined && order.limitPrice < 0; Detected direct throw for validation condition: Limit price cannot be negative

1 - **Deterministic example: valuePosition return behaviour** / valuePosition
  - Type: unit
  - Scenario: Call valuePosition with valid representative inputs.
  - Expected: Returns 100.
  - Test examples: valueposition-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: valuePosition validation exception** / valuePosition
  - Type: unit
  - Scenario: Call valuePosition with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: valueposition-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: calculateUnrealisedPnl return behaviour** / calculateUnrealisedPnl
  - Type: unit
  - Scenario: Call calculateUnrealisedPnl with valid representative inputs.
  - Expected: Returns 0.
  - Test examples: calculateunrealisedpnl-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateUnrealisedPnl validation exception** / calculateUnrealisedPnl
  - Type: unit
  - Scenario: Call calculateUnrealisedPnl with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: calculateunrealisedpnl-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applyBuyToPosition return behaviour** / applyBuyToPosition
  - Type: unit
  - Scenario: Call applyBuyToPosition with valid representative inputs.
  - Expected: Returns [object Object].
  - Test examples: applybuytoposition-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyBuyToPosition validation exception** / applyBuyToPosition
  - Type: unit
  - Scenario: Call applyBuyToPosition with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: applybuytoposition-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applySellToPosition return behaviour** / applySellToPosition
  - Type: unit
  - Scenario: Call applySellToPosition with valid representative inputs.
  - Expected: Returns [object Object].
  - Test examples: applyselltoposition-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from portfolio.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Type: unit
  - Scenario: Call applySellToPosition with invalid input for validation condition: !position.
  - Expected: Throws Position is required.
  - Test examples: applyselltoposition-deterministic-position
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: !position; Detected direct throw for validation condition: Position is required

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Type: unit
  - Scenario: Call applySellToPosition with invalid input for validation condition: quantity <= 0.
  - Expected: Throws Sell quantity must be positive.
  - Test examples: applyselltoposition-deterministic-quantity-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: quantity <= 0; Detected direct throw for validation condition: Sell quantity must be positive

1 - **Deterministic example: applySellToPosition validation exception** / applySellToPosition
  - Type: unit
  - Scenario: Call applySellToPosition with invalid input for validation condition: quantity > position.quantity.
  - Expected: Throws Cannot sell more than current holding.
  - Test examples: applyselltoposition-deterministic-quantity-position-quantity
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in portfolio.js: quantity > position.quantity; Detected direct throw for validation condition: Cannot sell more than current holding

1 - **Deterministic example: calculateMarketValue return behaviour** / calculateMarketValue
  - Type: unit
  - Scenario: Call calculateMarketValue with valid representative inputs.
  - Expected: Returns 1000.
  - Test examples: calculatemarketvalue-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateMarketValue validation exception** / calculateMarketValue
  - Type: unit
  - Scenario: Call calculateMarketValue with invalid input for validation condition: quantity <= 0.
  - Expected: Throws Quantity must be positive.
  - Test examples: calculatemarketvalue-deterministic-quantity-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: quantity <= 0; Detected direct throw for validation condition: Quantity must be positive

1 - **Deterministic example: calculateMarketValue validation exception** / calculateMarketValue
  - Type: unit
  - Scenario: Call calculateMarketValue with invalid input for validation condition: price < 0.
  - Expected: Throws Price cannot be negative.
  - Test examples: calculatemarketvalue-deterministic-price-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: price < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: applyPriceMovement return behaviour** / applyPriceMovement
  - Type: unit
  - Scenario: Call applyPriceMovement with valid representative inputs.
  - Expected: Returns 110.
  - Test examples: applypricemovement-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyPriceMovement validation exception** / applyPriceMovement
  - Type: unit
  - Scenario: Call applyPriceMovement with invalid input for validation condition: price < 0.
  - Expected: Throws Price cannot be negative.
  - Test examples: applypricemovement-deterministic-price-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: price < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: applyPriceMovement validation exception** / applyPriceMovement
  - Type: unit
  - Scenario: Call applyPriceMovement with invalid input for validation condition: movementPercent < -100.
  - Expected: Throws Movement percent cannot reduce price below zero.
  - Test examples: applypricemovement-deterministic-movementpercent-100
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: movementPercent < -100; Detected direct throw for validation condition: Movement percent cannot reduce price below zero

1 - **Deterministic example: calculateWeightedAveragePrice return behaviour** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Call calculateWeightedAveragePrice with valid representative inputs.
  - Expected: Returns 10.
  - Test examples: calculateweightedaverageprice-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from pricing.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: existingQuantity < 0.
  - Expected: Throws Existing quantity cannot be negative.
  - Test examples: calculateweightedaverageprice-deterministic-existingquantity-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: existingQuantity < 0; Detected direct throw for validation condition: Existing quantity cannot be negative

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: existingAveragePrice < 0 || tradePrice < 0.
  - Expected: Throws Price cannot be negative.
  - Test examples: calculateweightedaverageprice-deterministic-existingaverageprice-0-tradeprice-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: existingAveragePrice < 0 || tradePrice < 0; Detected direct throw for validation condition: Price cannot be negative

1 - **Deterministic example: calculateWeightedAveragePrice validation exception** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Call calculateWeightedAveragePrice with invalid input for validation condition: tradeQuantity <= 0.
  - Expected: Throws Trade quantity must be positive.
  - Test examples: calculateweightedaverageprice-deterministic-tradequantity-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in pricing.js: tradeQuantity <= 0; Detected direct throw for validation condition: Trade quantity must be positive

1 - **Deterministic example: hasSufficientCash validation exception** / hasSufficientCash
  - Type: unit
  - Scenario: Call hasSufficientCash with invalid input for validation condition: cashBalance < 0.
  - Expected: Throws Cash balance cannot be negative.
  - Test examples: hassufficientcash-deterministic-cashbalance-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: cashBalance < 0; Detected direct throw for validation condition: Cash balance cannot be negative

1 - **Deterministic example: checkConcentrationLimit validation exception** / checkConcentrationLimit
  - Type: unit
  - Scenario: Call checkConcentrationLimit with invalid input for validation condition: orderValue < 0 || portfolioValue < 0.
  - Expected: Throws Values cannot be negative.
  - Test examples: checkconcentrationlimit-deterministic-ordervalue-0-portfoliovalue-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: orderValue < 0 || portfolioValue < 0; Detected direct throw for validation condition: Values cannot be negative

1 - **Deterministic example: checkConcentrationLimit validation exception** / checkConcentrationLimit
  - Type: unit
  - Scenario: Call checkConcentrationLimit with invalid input for validation condition: maxPercent <= 0 || maxPercent > 100.
  - Expected: Throws Invalid concentration limit.
  - Test examples: checkconcentrationlimit-deterministic-maxpercent-0-maxpercent-100
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: maxPercent <= 0 || maxPercent > 100; Detected direct throw for validation condition: Invalid concentration limit

1 - **Deterministic example: calculateRiskScore validation exception** / calculateRiskScore
  - Type: unit
  - Scenario: Call calculateRiskScore with invalid input for validation condition: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0.
  - Expected: Throws Risk inputs cannot be negative.
  - Test examples: calculateriskscore-deterministic-cashbalance-0-portfoliovalue-0-openordervalue-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in risk.js: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0; Detected direct throw for validation condition: Risk inputs cannot be negative

1 - **Deterministic example: calculateSettlementDate validation exception** / calculateSettlementDate
  - Type: unit
  - Scenario: Call calculateSettlementDate with invalid input for validation condition: tradeDayIndex < 0.
  - Expected: Throws Trade day index cannot be negative.
  - Test examples: calculatesettlementdate-deterministic-tradedayindex-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: tradeDayIndex < 0; Detected direct throw for validation condition: Trade day index cannot be negative

1 - **Deterministic example: isSettlementDue validation exception** / isSettlementDue
  - Type: unit
  - Scenario: Call isSettlementDue with invalid input for validation condition: currentDayIndex < 0 || settlementDayIndex < 0.
  - Expected: Throws Day index cannot be negative.
  - Test examples: issettlementdue-deterministic-currentdayindex-0-settlementdayindex-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: currentDayIndex < 0 || settlementDayIndex < 0; Detected direct throw for validation condition: Day index cannot be negative

1 - **Deterministic example: calculateSettlementCashAmount validation exception** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Call calculateSettlementCashAmount with invalid input for validation condition: !order.
  - Expected: Throws Order is required.
  - Test examples: calculatesettlementcashamount-deterministic-order
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: !order; Detected direct throw for validation condition: Order is required

1 - **Deterministic example: calculateSettlementCashAmount validation exception** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Call calculateSettlementCashAmount with invalid input for validation condition: executionPrice < 0 || charges < 0.
  - Expected: Throws Amount cannot be negative.
  - Test examples: calculatesettlementcashamount-deterministic-executionprice-0-charges-0
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in settlement.js: executionPrice < 0 || charges < 0; Detected direct throw for validation condition: Amount cannot be negative

1 - **Deterministic example: calculatePositionReport return behaviour** / calculatePositionReport
  - Type: unit
  - Scenario: Call calculatePositionReport with valid representative inputs.
  - Expected: Returns [object Object].
  - Test examples: calculatepositionreport-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, dataFlow, dependencyFlow, mutation
  - Evidence: Expected value computed by evaluating reachable statements from stockbroking.js.; Execution path validated: Generated valid input does not hit a throw path and all branch/expression guards are evaluable.

1 - **Deterministic example: applyCorporateActionToPosition validation exception** / applyCorporateActionToPosition
  - Type: unit
  - Scenario: Call applyCorporateActionToPosition with invalid input for validation condition: !corporateAction.
  - Expected: Throws Corporate action is required.
  - Test examples: applycorporateactiontoposition-deterministic-corporateaction
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in stockbroking.js: !corporateAction; Detected direct throw for validation condition: Corporate action is required

1 - **Deterministic example: calculateIncomeEvent validation exception** / calculateIncomeEvent
  - Type: unit
  - Scenario: Call calculateIncomeEvent with invalid input for validation condition: !incomeEvent.
  - Expected: Throws Income event is required.
  - Test examples: calculateincomeevent-deterministic-incomeevent
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in stockbroking.js: !incomeEvent; Detected direct throw for validation condition: Income event is required

1 - **Cover applyStockSplit exception** / applyStockSplit
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateDividendPayment exception** / calculateDividendPayment
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applyRightsIssue exception** / applyRightsIssue
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateCommission exception** / calculateCommission
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateStampDuty exception** / calculateStampDuty
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateFxFee exception** / calculateFxFee
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover validateOrder exception** / validateOrder
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover valuePosition exception** / valuePosition
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateUnrealisedPnl exception** / calculateUnrealisedPnl
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applyBuyToPosition exception** / applyBuyToPosition
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applySellToPosition exception** / applySellToPosition
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculatePortfolioValue exception** / calculatePortfolioValue
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateMarketValue exception** / calculateMarketValue
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applyPriceMovement exception** / applyPriceMovement
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateWeightedAveragePrice exception** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover hasSufficientCash exception** / hasSufficientCash
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover checkConcentrationLimit exception** / checkConcentrationLimit
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateRiskScore exception** / calculateRiskScore
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateSettlementDate exception** / calculateSettlementDate
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover isSettlementDue exception** / isSettlementDue
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateSettlementCashAmount exception** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applyExecutionToPosition exception** / applyExecutionToPosition
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover applyCorporateActionToPosition exception** / applyCorporateActionToPosition
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateIncomeEvent exception** / calculateIncomeEvent
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

2 - **Cover applyStockSplit condition** / applyStockSplit
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover applyStockSplit condition** / applyStockSplit
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: numerator <= 0 || denominator <= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / numerator <= 0 || denominator <= 0

2 - **Cover calculateDividendPayment condition** / calculateDividendPayment
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover calculateDividendPayment condition** / calculateDividendPayment
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: dividendPerShare < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / dividendPerShare < 0

2 - **Cover calculateDividendPayment condition** / calculateDividendPayment
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: withholdingTaxRate < 0 || withholdingTaxRate > 1
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / withholdingTaxRate < 0 || withholdingTaxRate > 1

2 - **Cover calculateDividendPayment domain-edge-case** / calculateDividendPayment
  - Type: unit
  - Scenario: Cover zero divisor and non-zero divisor behaviour.
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: domain-edge-case / division by zero

2 - **Cover applyRightsIssue condition** / applyRightsIssue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover applyRightsIssue condition** / applyRightsIssue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: rightsRatio < 0 || subscriptionPrice < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / rightsRatio < 0 || subscriptionPrice < 0

2 - **Cover calculateCommission condition** / calculateCommission
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tradeValue < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tradeValue < 0

2 - **Cover calculateCommission condition** / calculateCommission
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tier === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tier === ""

2 - **Cover calculateStampDuty condition** / calculateStampDuty
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tradeValue < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tradeValue < 0

2 - **Cover calculateStampDuty condition** / calculateStampDuty
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: normalizedSide !== ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / normalizedSide !== ""

2 - **Cover calculateStampDuty condition** / calculateStampDuty
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: normalizedMarket === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / normalizedMarket === ""

2 - **Cover calculateFxFee condition** / calculateFxFee
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tradeValue < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tradeValue < 0

2 - **Cover calculateFxFee condition** / calculateFxFee
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !settlementCurrency || !instrumentCurrency
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !settlementCurrency || !instrumentCurrency

2 - **Cover calculateFxFee condition** / calculateFxFee
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: String(settlementCurrency
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / String(settlementCurrency

2 - **Cover validateOrder condition** / validateOrder
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !order
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !order

2 - **Cover validateOrder condition** / validateOrder
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !["", ""].includes(String(order.side || ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !["", ""].includes(String(order.side || ""

2 - **Cover validateOrder condition** / validateOrder
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !order.symbol
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !order.symbol

2 - **Cover validateOrder condition** / validateOrder
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: order.quantity <= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / order.quantity <= 0

2 - **Cover validateOrder condition** / validateOrder
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: order.limitPrice !== undefined && order.limitPrice < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / order.limitPrice !== undefined && order.limitPrice < 0

2 - **Cover calculateTotalCashImpact condition** / calculateTotalCashImpact
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: side === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / side === ""

2 - **Cover valuePosition condition** / valuePosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover calculateUnrealisedPnl condition** / calculateUnrealisedPnl
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover applyBuyToPosition condition** / applyBuyToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover applySellToPosition condition** / applySellToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !position
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !position

2 - **Cover applySellToPosition condition** / applySellToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: quantity <= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / quantity <= 0

2 - **Cover applySellToPosition condition** / applySellToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: quantity > position.quantity
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / quantity > position.quantity

2 - **Cover calculatePortfolioValue condition** / calculatePortfolioValue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !Array.isArray(positions
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !Array.isArray(positions

2 - **Cover calculatePortfolioValue condition** / calculatePortfolioValue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: price === undefined
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / price === undefined

2 - **Cover calculatePortfolioValue loop** / calculatePortfolioValue
  - Type: unit
  - Scenario: Cover empty input, single item, multiple items, and boundary cases.
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: loop / loop behaviour

2 - **Cover calculateMarketValue condition** / calculateMarketValue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: quantity <= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / quantity <= 0

2 - **Cover calculateMarketValue condition** / calculateMarketValue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: price < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / price < 0

2 - **Cover applyPriceMovement condition** / applyPriceMovement
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: price < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / price < 0

2 - **Cover applyPriceMovement condition** / applyPriceMovement
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: movementPercent < -100
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / movementPercent < -100

2 - **Cover calculateWeightedAveragePrice condition** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: existingQuantity < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / existingQuantity < 0

2 - **Cover calculateWeightedAveragePrice condition** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: existingAveragePrice < 0 || tradePrice < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / existingAveragePrice < 0 || tradePrice < 0

2 - **Cover calculateWeightedAveragePrice condition** / calculateWeightedAveragePrice
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tradeQuantity <= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tradeQuantity <= 0

2 - **Cover hasSufficientCash condition** / hasSufficientCash
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: cashBalance < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / cashBalance < 0

2 - **Cover hasSufficientCash condition** / hasSufficientCash
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: impact >= 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / impact >= 0

2 - **Cover checkConcentrationLimit condition** / checkConcentrationLimit
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: orderValue < 0 || portfolioValue < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / orderValue < 0 || portfolioValue < 0

2 - **Cover checkConcentrationLimit condition** / checkConcentrationLimit
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: maxPercent <= 0 || maxPercent > 100
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / maxPercent <= 0 || maxPercent > 100

2 - **Cover checkConcentrationLimit condition** / checkConcentrationLimit
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: portfolioValue === 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / portfolioValue === 0

2 - **Cover calculateRiskScore condition** / calculateRiskScore
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / cashBalance < 0 || portfolioValue < 0 || openOrderValue < 0

2 - **Cover calculateRiskScore condition** / calculateRiskScore
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: totalAssets === 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / totalAssets === 0

2 - **Cover calculateSettlementDate condition** / calculateSettlementDate
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: tradeDayIndex < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / tradeDayIndex < 0

2 - **Cover calculateSettlementDate condition** / calculateSettlementDate
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: normalizedMarket === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / normalizedMarket === ""

2 - **Cover isSettlementDue condition** / isSettlementDue
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: currentDayIndex < 0 || settlementDayIndex < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / currentDayIndex < 0 || settlementDayIndex < 0

2 - **Cover calculateSettlementCashAmount condition** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !order
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !order

2 - **Cover calculateSettlementCashAmount condition** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: executionPrice < 0 || charges < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / executionPrice < 0 || charges < 0

2 - **Cover calculateSettlementCashAmount condition** / calculateSettlementCashAmount
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: side === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / side === ""

2 - **Cover applyExecutionToPosition condition** / applyExecutionToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: side === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / side === ""

2 - **Cover applyCorporateActionToPosition condition** / applyCorporateActionToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !corporateAction
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !corporateAction

2 - **Cover applyCorporateActionToPosition condition** / applyCorporateActionToPosition
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: type === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / type === ""

2 - **Cover calculateIncomeEvent condition** / calculateIncomeEvent
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: !incomeEvent
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / !incomeEvent

2 - **Cover calculateIncomeEvent condition** / calculateIncomeEvent
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: type === ""
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / type === ""
