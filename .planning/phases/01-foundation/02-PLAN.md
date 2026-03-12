---
phase: 01-foundation
plan: 02
type: execute
wave: 2
depends_on:
  - 01-PLAN.md
files_modified:
  - src/modules/state/schema.js
  - src/modules/state/Store.js
  - src/modules/state/Store.test.js
  - src/modules/money/formatters.js
  - src/modules/money/formatters.test.js
autonomous: true
requirements:
  - PERS-01
  - PERS-02
  - PERS-03
  - UX-02
must_haves:
  truths:
    - Store loads persisted data on initialization
    - Store automatically saves to storage on every state change
    - Store notifies subscribers when state changes
    - State schema includes version for migrations
    - State validation ensures data integrity on load
    - Quota exceeded errors dispatch custom event for UI handling
    - AED formatter uses Intl.NumberFormat with en-AE locale
    - AED formatter displays "AED 1,250.00" format
  artifacts:
    - path: src/modules/state/Store.js
      provides: Observable state container with auto-persistence
      exports: [Store]
    - path: src/modules/state/schema.js
      provides: Data structure definitions and validation
      exports: [DEFAULT_STATE, CURRENT_SCHEMA_VERSION, validateState, migrateState]
    - path: src/modules/money/formatters.js
      provides: AED currency formatting utilities
      exports: [formatAED, formatFils]
    - path: src/modules/state/Store.test.js
      provides: Unit tests for Store
    - path: src/modules/money/formatters.test.js
      provides: Unit tests for formatters
  key_links:
    - from: Store
      to: SafeStorage
      via: this._storage dependency injection
    - from: Store
      to: schema
      via: DEFAULT_STATE and validateState on load
    - from: formatAED
      to: Intl.NumberFormat
      via: new Intl.NumberFormat('en-AE', { style: 'currency', currency: 'AED' })
    - from: Store.setState
      to: window.dispatchEvent
      via: CustomEvent('eidiya:quota-exceeded')
---

<objective>
Build observable state management with auto-persistence and AED currency formatting utilities.

Purpose: Connect the data layer to a reactive state system that automatically persists changes and provides proper currency display formatting.
Output: Store class with observer pattern, state schema with validation, and AED formatting utilities.
</objective>

<execution_context>
@/home/rashid/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/01-foundation/01-RESEARCH.md
@.planning/phases/01-foundation/01-01-SUMMARY.md

## Dependencies from Plan 01

From src/modules/storage/SafeStorage.js:
- SafeStorage class with setItem, getItem, removeItem
- Returns { success, fallback, error? } from setItem
- isUsingFallback() method

From src/modules/money/Money.js:
- Money class for future integration (not directly used in this plan)

## Key Patterns from Research

### Observable Store Pattern (PERS-01, PERS-02)
- subscribe(listener) returns unsubscribe function
- setState(updater) accepts object or function
- _notify(prevState) calls all listeners with new and previous state
- _persist() calls storage.setItem and handles quota errors
- load() hydrates state from storage with validation

### State Schema Pattern
- CURRENT_SCHEMA_VERSION for future migrations
- DEFAULT_STATE with version, contributors array, timestamps
- validateState() checks data integrity before accepting
- migrateState() handles version upgrades

### Currency Formatting (UX-02)
- Use Intl.NumberFormat with 'en-AE' locale
- Format: "AED 1,250.00" (symbol first for English locale)
- Always show 2 decimal places
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create state schema with validation and migrations</name>
  <files>src/modules/state/schema.js</files>
  <behavior>
    - CURRENT_SCHEMA_VERSION is '1.0.0'
    - DEFAULT_STATE has version, contributors: [], createdAt, updatedAt
    - validateState(data) returns { valid: boolean, error?: string }
    - validateState rejects non-objects
    - validateState rejects non-array contributors
    - validateState checks each contributor has string id and integer amountInFils
    - migrateState(data) adds version if missing
  </behavior>
  <action>
    1. Create src/modules/state/schema.js with:
       - JSDoc typedefs for DenominationBreakdown, Contributor, AppState
       - CURRENT_SCHEMA_VERSION constant
       - DEFAULT_STATE object with schema version and empty contributors array
       - validateState(data) function with comprehensive checks
       - migrateState(data) function for version handling
    2. Validation rules:
       - Data must be object
       - contributors must be array
       - Each contributor must have: id (string), name (string), date (string), amountInFils (integer), breakdown (object)
       - Denominations: five, ten, twenty, fifty, hundred, twoHundred, fiveHundred, thousand (all integers)
  </action>
  <verify>
    <automated>npm test -- schema (create schema.test.js first if needed)</automated>
  </verify>
  <done>Schema validation rejects invalid data and accepts valid state objects</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement Store with observable pattern and auto-save</name>
  <files>src/modules/state/Store.js, src/modules/state/Store.test.js</files>
  <behavior>
    - new Store(initialState, storage) creates store with storage integration
    - store.subscribe(listener) adds listener, returns unsubscribe function
    - store.getState() returns immutable copy of state
    - store.setState({ key: value }) merges partial update
    - store.setState(fn) calls fn with previous state
    - setState notifies all subscribers with (newState, prevState)
    - setState persists to storage after notifying
    - Quota errors dispatch 'eidiya:quota-exceeded' custom event
    - store.load() hydrates from storage with validation
    - Invalid loaded data logs warning and uses defaults
  </behavior>
  <action>
    1. Create src/modules/state/Store.js:
       - Constructor accepts initialState and optional storage
       - _listeners Set for subscriber management
       - subscribe(listener) adds to Set, returns () => delete
       - getState() returns { ...this._state }
       - setState(updater) handles object or function, merges immutably
       - _notify(prevState) iterates listeners
       - _persist() calls storage.setItem, dispatches event on quota error
       - load() gets from storage, validates, migrates, sets state
    2. Create Store.test.js with mocks for SafeStorage
    3. Test scenarios:
       - Subscribe and unsubscribe
       - State updates notify listeners
       - Auto-persistence on change
       - Quota error event dispatch
       - Load with valid/invalid data
  </action>
  <verify>
    <automated>npm test -- Store.test.js</automated>
  </verify>
  <done>Store tests pass including observer pattern, persistence, and error handling</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Implement AED currency formatting utilities</name>
  <files>src/modules/money/formatters.js, src/modules/money/formatters.test.js</files>
  <behavior>
    - formatAED(filsAmount) returns formatted string like "AED 1,250.00"
    - formatAED(5000) returns "AED 50.00"
    - formatAED(5025) returns "AED 50.25"
    - formatAED(0) returns "AED 0.00"
    - formatAED(-1000) returns "AED -10.00" (handles negative)
    - formatFils(filsAmount) returns formatted fils like "5,000 fils"
    - Uses Intl.NumberFormat with 'en-AE' locale
    - Always shows 2 decimal places for AED format
  </behavior>
  <action>
    1. Create src/modules/money/formatters.js:
       - formatAED(filsAmount, locale='en-AE') function
       - Converts fils to AED by dividing by 100
       - Uses Intl.NumberFormat with style: 'currency', currency: 'AED'
       - formatFils(filsAmount) for displaying raw fils
    2. Create formatters.test.js with test cases:
       - Whole AED amounts (5000 fils -> "AED 50.00")
       - Fractional amounts (5025 fils -> "AED 50.25")
       - Large amounts (125000 fils -> "AED 1,250.00")
       - Zero handling
       - Negative amounts
       - Different locales (ar-AE for Arabic formatting)
  </action>
  <verify>
    <automated>npm test -- formatters.test.js</automated>
  </verify>
  <done>All formatting tests pass with correct AED currency display</done>
</task>

</tasks>

<verification>
1. Run full test suite: `npm test` passes all tests
2. Verify Store integration:
   - Create Store with mock storage
   - Subscribe to changes
   - Update state and verify persistence called
   - Verify listeners notified
3. Verify formatting:
   - formatAED(125000) === "AED 1,250.00"
   - formatAED(5025) === "AED 50.25"
</verification>

<success_criteria>
- Store provides observable state with auto-persistence
- State schema validates data integrity on load
- Quota errors dispatch custom events for UI handling
- AED formatting produces correct currency strings
- All unit tests pass
</success_criteria>

<output>
After completion, create `.planning/phases/01-foundation/01-02-SUMMARY.md`
</output>
