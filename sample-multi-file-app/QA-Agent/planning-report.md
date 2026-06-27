# QA Planning Report

## Summary

The system calculates the total for a checkout process by applying discounts and tax to a list of items.

## Evidence Summary

- README/docs available: No
- Code available: Yes
- Deterministic analysis available: Yes
- Dependency graph available: Yes
- Call graph available: Yes
- Primary evidence: code, deterministic-analysis, dependency-graph, call-graph, inferred

## Public APIs

- **calculateCheckoutTotal** (checkout.js): Public function detected from repository analysis: calculateCheckoutTotal.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateCheckoutTotal in checkout.js.

- **applyDiscount** (discount.js): Public function detected from repository analysis: applyDiscount.
  - Source: code
  - Confidence: high
  - Evidence: Detected function applyDiscount in discount.js.

- **calculateTax** (tax.js): Public function detected from repository analysis: calculateTax.
  - Source: code
  - Confidence: high
  - Evidence: Detected function calculateTax in tax.js.

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

1 - **Deterministic example: calculateCheckoutTotal return behaviour** / calculateCheckoutTotal
  - Scenario: Call calculateCheckoutTotal with valid representative inputs.
  - Inputs: Call calculateCheckoutTotal with valid representative inputs. | args: [{"price":100,"quantity":2},{"price":50,"quantity":1}]; 10; 0.2 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 270
  - Expected calculation: subtotal = items.reduce = total + item.price * item.quantity = 0 + 100 * 2 = 200 -> total + item.price * item.quantity = 200 + 50 * 1 = 250 = 250; discounted = applyDiscount(subtotal, discountPercent) = 225; tax = calculateTax(discounted, taxRate) = 45; result = discounted + tax = 225 + 45 = 270
  - Expected behaviour: Returns 270.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 270.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from checkout.js.

1 - **Deterministic example: applyDiscount return behaviour** / applyDiscount
  - Scenario: Call applyDiscount with valid representative inputs.
  - Inputs: Call applyDiscount with valid representative inputs. | args: 100; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 90
  - Expected calculation: result = amount - (amount * discountPercent / 100) = 100 - (100 * 10 / 100) = 90
  - Expected behaviour: Returns 90.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 90.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from discount.js.

1 - **Deterministic example: applyDiscount lower invalid boundary** / applyDiscount
  - Scenario: Call applyDiscount with an input below the accepted boundary.
  - Inputs: Call applyDiscount with an input below the accepted boundary. | args: 100; -1 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Invalid discount.
  - Expected exception: Invalid discount
  - Assertion hint: Assert call throws Invalid discount.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in discount.js: discountPercent < 0 || discountPercent > 100

1 - **Deterministic example: applyDiscount upper invalid boundary** / applyDiscount
  - Scenario: Call applyDiscount with an input above the accepted boundary.
  - Inputs: Call applyDiscount with an input above the accepted boundary. | args: 100; 101 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws Invalid discount.
  - Expected exception: Invalid discount
  - Assertion hint: Assert call throws Invalid discount.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in discount.js: discountPercent < 0 || discountPercent > 100

1 - **Deterministic example: calculateTax return behaviour** / calculateTax
  - Scenario: Call calculateTax with valid representative inputs.
  - Inputs: Call calculateTax with valid representative inputs. | args: 100; 0.2 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 20
  - Expected calculation: result = amount * rate = 100 * 0.2 = 20
  - Expected behaviour: Returns 20.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 20.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from tax.js.

1 - **Deterministic example: calculateTax lower invalid boundary** / calculateTax
  - Scenario: Call calculateTax with an input below the accepted boundary.
  - Inputs: Call calculateTax with an input below the accepted boundary. | args: -1; 0.2 | setup: 
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
  - Evidence: Detected validation condition in tax.js: amount < 0

## Missing Requirements

None identified.

## Prioritised Test Plan

1 - **Deterministic example: calculateCheckoutTotal return behaviour** / calculateCheckoutTotal
  - Type: unit
  - Scenario: Call calculateCheckoutTotal with valid representative inputs.
  - Expected: Returns 270.
  - Test examples: calculatecheckouttotal-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from checkout.js.

1 - **Deterministic example: applyDiscount return behaviour** / applyDiscount
  - Type: unit
  - Scenario: Call applyDiscount with valid representative inputs.
  - Expected: Returns 90.
  - Test examples: applydiscount-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from discount.js.

1 - **Deterministic example: applyDiscount lower invalid boundary** / applyDiscount
  - Type: unit
  - Scenario: Call applyDiscount with an input below the accepted boundary.
  - Expected: Throws Invalid discount.
  - Test examples: applydiscount-deterministic-lower-bound
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in discount.js: discountPercent < 0 || discountPercent > 100

1 - **Deterministic example: applyDiscount upper invalid boundary** / applyDiscount
  - Type: unit
  - Scenario: Call applyDiscount with an input above the accepted boundary.
  - Expected: Throws Invalid discount.
  - Test examples: applydiscount-deterministic-upper-bound
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in discount.js: discountPercent < 0 || discountPercent > 100

1 - **Deterministic example: calculateTax return behaviour** / calculateTax
  - Type: unit
  - Scenario: Call calculateTax with valid representative inputs.
  - Expected: Returns 20.
  - Test examples: calculatetax-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from tax.js.

1 - **Deterministic example: calculateTax lower invalid boundary** / calculateTax
  - Type: unit
  - Scenario: Call calculateTax with an input below the accepted boundary.
  - Expected: Throws Amount cannot be negative.
  - Test examples: calculatetax-deterministic-lower-bound
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in tax.js: amount < 0

1 - **Cover applyDiscount exception** / applyDiscount
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

1 - **Cover calculateTax exception** / calculateTax
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

2 - **Cover calculateCheckoutTotal loop** / calculateCheckoutTotal
  - Type: unit
  - Scenario: Cover empty input, single item, multiple items, and boundary cases.
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: loop / loop behaviour

2 - **Cover applyDiscount condition** / applyDiscount
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: discountPercent < 0 || discountPercent > 100
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / discountPercent < 0 || discountPercent > 100

2 - **Cover calculateTax condition** / calculateTax
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: amount < 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / amount < 0
