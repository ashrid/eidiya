---
phase: 01-foundation
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/modules/money/Money.js
  - src/modules/money/Money.test.js
  - src/modules/storage/SafeStorage.js
  - src/modules/storage/SafeStorage.test.js
  - vitest.config.js
  - package.json
autonomous: true
requirements:
  - VAL-03
  - PERS-01
  - PERS-02
must_haves:
  truths:
    - Money class stores all amounts as integer fils internally
    - Money class converts AED to fils and fils to AED correctly
    - Money class supports arithmetic operations without floating-point errors
    - SafeStorage detects localStorage availability on initialization
    - SafeStorage saves data to localStorage when available
    - SafeStorage falls back to in-memory Map when localStorage unavailable
    - SafeStorage handles quota exceeded errors gracefully
  artifacts:
    - path: src/modules/money/Money.js
      provides: Money value object with integer fils storage
      exports: [Money]
    - path: src/modules/storage/SafeStorage.js
      provides: localStorage wrapper with fallback
      exports: [SafeStorage]
    - path: src/modules/money/Money.test.js
      provides: Unit tests for Money class
    - path: src/modules/storage/SafeStorage.test.js
      provides: Unit tests for SafeStorage
  key_links:
    - from: SafeStorage
      to: localStorage
      via: setItem/getItem/removeItem with try-catch
    - from: Money
      to: integer fils
      via: _fils property and fromAED/toAED methods
---

<objective>
Create the core data layer with integer-based money handling and safe localStorage persistence.

Purpose: Prevent floating-point errors in financial calculations and ensure data persistence works reliably across all browsers including Safari private mode.
Output: Money class for currency operations, SafeStorage wrapper for persistence, and unit tests for both.
</objective>

<execution_context>
@/home/rashid/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-RESEARCH.md

## Key Patterns from Research

### Integer Money Pattern (VAL-03)
- Store all monetary values as integer fils (1 AED = 100 fils)
- Convert to/from AED only at display boundaries
- Use Math.round() when converting from AED to handle floating-point input

### SafeStorage Pattern (PERS-01, PERS-02, PERS-03)
- Feature detection on initialization (_checkAvailability)
- In-memory Map fallback for Safari private browsing
- QuotaExceededError detection and graceful degradation
- Return result objects: { success, fallback, error? }

### Test Setup (Wave 0)
- Vitest with jsdom environment for DOM-less testing
- Path aliases matching vite.config.js
- Unit tests for Money arithmetic and SafeStorage operations
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Install Vitest and configure test infrastructure</name>
  <files>package.json, vitest.config.js</files>
  <behavior>
    - Vitest runs with `npm test` command
    - Tests can import from @modules alias
    - jsdom environment available for DOM mocking
  </behavior>
  <action>
    1. Add to package.json devDependencies: vitest, @vitest/ui, jsdom
    2. Add test script: "test": "vitest run"
    3. Create vitest.config.js with path aliases matching project structure:
       - @/ -> src/
       - @modules/ -> src/modules/
       - @utils/ -> src/utils/
    4. Configure jsdom environment for DOM-less testing
  </action>
  <verify>
    <automated>npm install && npm test -- --version</automated>
  </verify>
  <done>Vitest installed and `npm test` runs without errors</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement Money class with integer fils storage</name>
  <files>src/modules/money/Money.js, src/modules/money/Money.test.js</files>
  <behavior>
    - new Money(5000) stores 5000 fils
    - Money.fromAED(50) creates Money with 5000 fils
    - Money.fromAED(50.25) creates Money with 5025 fils (handles rounding)
    - money.toAED() returns 50.25 for 5025 fils
    - money.toFils() returns 5025
    - money.format() returns "AED 50.25" using Intl.NumberFormat
    - money.add(other) returns new Money with sum
    - money.subtract(other) returns new Money with difference
    - money.multiply(factor) returns new Money with product (rounded)
    - money.toJSON() returns integer fils for serialization
    - Throws TypeError if initialized with non-integer
  </behavior>
  <action>
    1. Create src/modules/money/Money.js with:
       - Constructor accepting integer fils with validation
       - Static fromAED(aedAmount) using Math.round(aedAmount * 100)
       - toAED() returning fils / 100
       - toFils() returning raw integer
       - format(locale='en-AE') using Intl.NumberFormat with AED currency
       - add(other), subtract(other), multiply(factor) methods
       - toJSON() returning this._fils
    2. Create comprehensive unit tests in Money.test.js covering:
       - Construction with valid/invalid inputs
       - AED to fils conversion (including rounding edge cases)
       - Arithmetic operations
       - Formatting output
       - JSON serialization
  </action>
  <verify>
    <automated>npm test -- Money.test.js</automated>
  </verify>
  <done>All Money class tests pass, including edge cases for rounding and arithmetic</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement SafeStorage wrapper with fallback</name>
  <files>src/modules/storage/SafeStorage.js, src/modules/storage/SafeStorage.test.js</files>
  <behavior>
    - new SafeStorage() detects localStorage availability
    - storage.isAvailable() returns true if localStorage works
    - storage.isUsingFallback() returns false initially, true if quota exceeded
    - storage.setItem(key, value) serializes to JSON and stores
    - setItem returns { success: true, fallback: false } on success
    - setItem returns { success: false, fallback: true } when using fallback
    - setItem returns { success: false, fallback: true, error: 'quota_exceeded' } on quota error
    - storage.getItem(key) returns parsed JSON or null
    - storage.removeItem(key) removes from storage or fallback
    - Falls back to in-memory Map when localStorage throws
  </behavior>
  <action>
    1. Create src/modules/storage/SafeStorage.js with:
       - _checkAvailability() method testing localStorage with test key
       - _fallback Map for in-memory storage
       - _usingFallback flag tracking state
       - setItem(key, value) with try-catch and quota detection
       - getItem(key) with fallback support
       - removeItem(key) with error tolerance
       - _isQuotaError(error) checking error.name and error.code
    2. Create unit tests in SafeStorage.test.js using vi.fn() to mock localStorage
    3. Test scenarios:
       - Normal operation with localStorage
       - Unavailable localStorage (private mode simulation)
       - Quota exceeded error handling
       - JSON parse errors on getItem
  </action>
  <verify>
    <automated>npm test -- SafeStorage.test.js</automated>
  </verify>
  <done>All SafeStorage tests pass including quota error and fallback scenarios</done>
</task>

</tasks>

<verification>
1. Run full test suite: `npm test` passes all tests
2. Verify Money class handles edge cases:
   - Money.fromAED(0.1).add(Money.fromAED(0.2)).toFils() === 30 (not 29 or 30.0000000004)
3. Verify SafeStorage fallback works by simulating localStorage failure
</verification>

<success_criteria>
- Money class stores and operates on integer fils without floating-point errors
- SafeStorage provides localStorage abstraction with graceful fallback
- Unit tests cover all public methods and edge cases
- `npm test` runs successfully with all tests passing
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-01-SUMMARY.md`
</output>
