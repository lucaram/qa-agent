# QA Planning Report

## Summary

This system provides basic arithmetic operations: addition, subtraction, and division.

## Evidence Summary

- README/docs available: No
- Code available: Yes
- Deterministic analysis available: Yes
- Dependency graph available: Yes
- Call graph available: No
- Primary evidence: code, deterministic-analysis, dependency-graph, call-graph, inferred

## Public APIs

- **add** (calculator.py): Public function detected from repository analysis: add.
  - Source: code
  - Confidence: high
  - Evidence: Detected function add in calculator.py.

- **subtract** (calculator.py): Public function detected from repository analysis: subtract.
  - Source: code
  - Confidence: high
  - Evidence: Detected function subtract in calculator.py.

- **divide** (calculator.py): Public function detected from repository analysis: divide.
  - Source: code
  - Confidence: high
  - Evidence: Detected function divide in calculator.py.

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

1 - **Deterministic example: add return behaviour** / add
  - Scenario: Call add with valid representative inputs.
  - Inputs: Call add with valid representative inputs. | args: 100; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 110
  - Expected calculation: result = a + b = 100 + 10 = 110
  - Expected behaviour: Returns 110.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 110.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: subtract return behaviour** / subtract
  - Scenario: Call subtract with valid representative inputs.
  - Inputs: Call subtract with valid representative inputs. | args: 100; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 90
  - Expected calculation: result = a - b = 100 - 10 = 90
  - Expected behaviour: Returns 90.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 90.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: divide return behaviour** / divide
  - Scenario: Call divide with valid representative inputs.
  - Inputs: Call divide with valid representative inputs. | args: 100; 10 | setup: 
  - Expected kind: return
  - Expected value available: Yes
  - Expected value: 10
  - Expected calculation: result = a / b = 100 / 10 = 10
  - Expected behaviour: Returns 10.
  - Expected exception: Not specified
  - Assertion hint: Assert return value equals 10.
  - Safe for direct generation: Yes
  - Reliability: high — Expected value was computed deterministically from source expressions and data flow.
  - Source: deterministic-test-data-builder
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: divide lower invalid boundary** / divide
  - Scenario: Call divide with an input below the accepted boundary.
  - Inputs: Call divide with an input below the accepted boundary. | args: 100; 0 | setup: 
  - Expected kind: exception
  - Expected value available: No
  - Expected value: Not specified.
  - Expected calculation: Not specified
  - Expected behaviour: Throws division by zero.
  - Expected exception: division by zero
  - Assertion hint: Assert call throws division by zero.
  - Safe for direct generation: Yes
  - Reliability: high — Exception path was generated from explicit validation logic.
  - Source: deterministic-test-data-builder
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in calculator.py: b == 0

## Missing Requirements

None identified.

## Prioritised Test Plan

1 - **Deterministic example: add return behaviour** / add
  - Type: unit
  - Scenario: Call add with valid representative inputs.
  - Expected: Returns 110.
  - Test examples: add-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: subtract return behaviour** / subtract
  - Type: unit
  - Scenario: Call subtract with valid representative inputs.
  - Expected: Returns 90.
  - Test examples: subtract-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: divide return behaviour** / divide
  - Type: unit
  - Scenario: Call divide with valid representative inputs.
  - Expected: Returns 10.
  - Test examples: divide-deterministic-return
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: publicApi, algorithmStep, calculationFormula, mutation
  - Evidence: Expected value computed by evaluating assignments and return expression from calculator.py.

1 - **Deterministic example: divide lower invalid boundary** / divide
  - Type: unit
  - Scenario: Call divide with an input below the accepted boundary.
  - Expected: Throws division by zero.
  - Test examples: divide-deterministic-lower-bound
  - Source: deterministic-test-data-builder
  - Confidence: high
  - Covers: validationRule, exceptionPath, mutation
  - Evidence: Detected validation condition in calculator.py: b == 0

1 - **Cover divide exception** / divide
  - Type: unit
  - Scenario: Cover invalid input path and verify exception type/message where specified.
  - Expected: Throws or rejects as implemented for the invalid path.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: exceptionPath, mutation
  - Evidence: Deterministic target: exception / exception path

2 - **Cover subtract domain-edge-case** / subtract
  - Type: unit
  - Scenario: Cover non-commutative operand order, including a > b and a < b.
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: domain-edge-case / operand order

2 - **Cover divide condition** / divide
  - Type: unit
  - Scenario: Cover true and false outcomes for condition: b == 0
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: condition / b == 0

2 - **Cover divide domain-edge-case** / divide
  - Type: unit
  - Scenario: Cover zero divisor and non-zero divisor behaviour.
  - Expected: Behaves according to the implementation for this deterministic target.
  - Test examples: None
  - Source: deterministic-analysis
  - Confidence: high
  - Covers: edgeCase, mutation
  - Evidence: Deterministic target: domain-edge-case / division by zero
