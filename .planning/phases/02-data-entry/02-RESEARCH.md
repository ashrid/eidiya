# Phase 2: Data Entry - Research

**Researched:** 2026-03-12
**Domain:** Vanilla JavaScript DOM forms, Pico CSS validation patterns, real-time validation architecture
**Confidence:** HIGH

## Summary

Phase 2 implements the contributor data entry form with denomination breakdown inputs. The existing codebase provides a solid foundation: Observable Store pattern for state management, schema validation for data integrity, and Pico CSS for semantic styling. The key challenge is implementing real-time validation that ensures denomination sums match the total contribution amount while maintaining a smooth user experience.

**Primary recommendation:** Build a `ContributorForm` component that manages its own internal state during editing, validates on blur events, and dispatches to `Store.addContributor()` on successful submission. Use Pico CSS's built-in validation styling with custom error message display.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Form Layout & Placement:** Inline form at top of contributors list, visible immediately even when empty, wrapped in Pico CSS card container, collapsible toggle when contributors exist
- **Denomination Input Method:** Number inputs for entering note counts, two-column grid layout for 8 denominations, ordered smallest (5 AED) to largest (1000 AED), total auto-calculates from breakdown, user enters total contribution amount directly
- **Validation Feedback Style:** Inline errors with visual field highlighting (red borders), validation runs on blur (not while typing), errors only (no success checkmarks), detailed error messages showing actual vs expected values
- **Post-Submission Flow:** Form clears immediately on successful submit, no scroll position change, no toast notification, form remains visible and ready for next entry

### Claude's Discretion
- Exact field label text and placeholder wording
- Specific spacing within the form card
- Error message exact styling (which Pico CSS validation classes to use)
- "Add Contributor" button placement and styling

### Deferred Ideas (OUT OF SCOPE)
- Quick-fill templates (e.g., "Many small notes", "Mixed") — v2 requirement TEMP-01
- Edit/delete contributors — Phase 3 scope
- Keyboard shortcuts for power users — v2 enhancement
- Import from CSV — out of scope (JSON export/import is Phase 5)
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-01 | User can add a contributor with name, contribution date, and total amount | Form component with text input, date input, and number input fields; Store.addContributor() action needed |
| CONT-02 | User can specify denomination breakdown per contributor (5, 10, 20, 50, 100, 200, 500, 1000 AED notes) | 8 number inputs in two-column grid layout; map to DenominationBreakdown schema keys |
| CONT-05 | User can view all contributors in a list with their details | Enhance existing _renderContributorsList() and _renderContributorCard() in AppContainer |
| VAL-01 | System validates that denomination breakdown sums equal the contribution amount | Real-time validation function comparing sum(denomination * value) to total amount in fils |
| VAL-02 | System shows real-time validation errors during data entry | Blur-event validation with inline error display; Pico CSS :invalid styling |
</phase_requirements>

## Standard Stack

### Core (Already Established)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript (ES2022+) | Native | Component logic, DOM manipulation | Zero runtime overhead, sufficient for simple CRUD |
| Pico CSS | 2.x | Classless semantic styling, form validation | Automatic dark mode, minimal custom CSS needed |
| Vite | 7.3.1 | Dev server, build tool | Established in Phase 1 |
| Vitest | 4.0.18 | Unit testing | jsdom environment for DOM testing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Intl.NumberFormat | Native | Currency formatting | Already used in formatAED() |
| crypto.randomUUID() | Native | Generate contributor IDs | Modern browser support, no library needed |

## Architecture Patterns

### Recommended Component Structure

```
src/
├── components/
│   ├── AppContainer.js          # Existing - needs form integration
│   └── ContributorForm.js       # NEW - Data entry form component
├── modules/
│   ├── state/
│   │   ├── Store.js             # Existing - needs addContributor() method
│   │   └── schema.js            # Existing - validation functions
│   └── validation/
│       └── contributor.js       # NEW - Form validation logic
```

### Pattern 1: Form Component with Internal State
**What:** Component maintains local state during editing, validates on blur, submits to Store on success
**When to use:** Complex forms with real-time validation requirements
**Example:**
```javascript
// src/components/ContributorForm.js
export class ContributorForm {
  constructor(onSubmit) {
    this._onSubmit = onSubmit;
    this._errors = new Map();
    this._values = {
      name: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: '',
      breakdown: { five: 0, ten: 0, /* ... */ }
    };
  }

  _validate() {
    // Return { valid: boolean, errors: Map<string, string> }
  }

  _handleBlur(field) {
    // Validate single field, update error display
  }

  _handleSubmit(event) {
    event.preventDefault();
    const result = this._validate();
    if (result.valid) {
      this._onSubmit(this._getContributorData());
      this._reset();
    } else {
      this._displayErrors(result.errors);
    }
  }
}
```

### Pattern 2: Denomination Sum Validation
**What:** Calculate expected total from breakdown, compare to entered total
**When to use:** VAL-01 requirement
**Example:**
```javascript
// src/modules/validation/contributor.js
const DENOMINATION_VALUES = {
  five: 5,
  ten: 10,
  twenty: 20,
  fifty: 50,
  hundred: 100,
  twoHundred: 200,
  fiveHundred: 500,
  thousand: 1000
};

export function calculateBreakdownTotal(breakdown) {
  return Object.entries(breakdown).reduce((sum, [key, count]) => {
    return sum + (DENOMINATION_VALUES[key] * (count || 0) * 100); // Convert to fils
  }, 0);
}

export function validateDenominationSum(totalFils, breakdown) {
  const calculated = calculateBreakdownTotal(breakdown);
  if (calculated !== totalFils) {
    const diff = Math.abs(calculated - totalFils);
    return {
      valid: false,
      error: `Breakdown sum is ${calculated / 100} AED, but total is ${totalFils / 100} AED (difference: ${diff / 100} AED)`
    };
  }
  return { valid: true };
}
```

### Pattern 3: Store Action for Adding Contributors
**What:** Store method that creates contributor object and updates state
**When to use:** CONT-01, CONT-02 requirements
**Example:**
```javascript
// In Store.js - add this method
addContributor(contributorData) {
  const contributor = {
    id: crypto.randomUUID(),
    name: contributorData.name,
    date: contributorData.date,
    amountInFils: contributorData.amountInFils,
    breakdown: contributorData.breakdown
  };

  this.setState(state => ({
    contributors: [...state.contributors, contributor]
  }));
}
```

### Pattern 4: Pico CSS Form Validation Styling
**What:** Use semantic HTML with Pico's built-in validation states
**When to use:** VAL-02 requirement
**Example:**
```html
<!-- Valid field -->
<input type="number" name="totalAmount" required>

<!-- Invalid field with error message -->
<input type="number" name="five" aria-invalid="true" aria-describedby="five-error">
<small id="five-error" class="error-message">Must be a non-negative integer</small>
```

```css
/* Pico CSS automatically styles [aria-invalid="true"] with red borders */
/* Add custom error message styling */
.error-message {
  color: var(--pico-color-red-500);
  display: block;
  margin-top: var(--spacing-xs);
}
```

### Anti-Patterns to Avoid
- **Validating on every keystroke:** Causes premature error display, poor UX. Use blur events per user decision.
- **Storing form state in global Store:** Store should only hold committed data, not draft form state.
- **Using floating-point for money calculations:** Always convert to integer fils immediately.
- **Manual DOM manipulation for lists:** Let AppContainer re-render via Store subscription.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form validation library | Custom validation framework | Simple functions + Pico CSS validation states | Overkill for single form; adds bundle size |
| Date picker widget | Custom calendar component | Native `<input type="date">` | Pico CSS styles native inputs, works on mobile |
| Number input formatting | Custom text parsing | Native `<input type="number" min="0" step="1">` | Handles validation, keyboard type on mobile |
| UUID generation | Custom ID algorithm | `crypto.randomUUID()` | Native, cryptographically random |
| Currency input mask | Complex input masking | Plain number input + display formatting | Simpler, more accessible |

**Key insight:** This is a single form with 11 fields. A validation library adds complexity without benefit. Native HTML inputs with proper types provide built-in validation and optimal mobile UX.

## Common Pitfalls

### Pitfall 1: Floating-Point in Denomination Calculations
**What goes wrong:** Using AED decimals in calculations causes rounding errors (e.g., 0.1 + 0.2 !== 0.3)
**Why it happens:** JavaScript uses IEEE 754 floating-point representation
**How to avoid:** Convert to fils (integer) immediately upon input. All calculations in fils.
```javascript
// CORRECT: Convert to fils once, calculate in integers
const totalFils = Math.round(parseFloat(input.value) * 100);
const calculatedFils = (five * 500) + (ten * 1000) + ...; // All integers

// WRONG: Calculate in AED decimals
const total = parseFloat(input.value); // 1000.50
const calculated = (five * 5) + (ten * 10) + ...; // Floating-point math
```

### Pitfall 2: Race Condition Between Total and Breakdown
**What goes wrong:** User enters breakdown first, total auto-updates, then user changes total causing mismatch
**Why it happens:** Auto-calculation from breakdown conflicts with manual total entry
**How to avoid:** Per user decision, total is entered manually (not derived). Breakdown sum validates against entered total.

### Pitfall 3: Empty String vs Zero Confusion
**What goes wrong:** Empty denomination fields parse as empty string, causing NaN in calculations
**Why it happens:** HTML number inputs return empty string when cleared, not 0
**How to avoid:** Coerce to number with fallback: `parseInt(value, 10) || 0`

### Pitfall 4: Date Input Timezone Issues
**What goes wrong:** Date displayed differently than entered due to timezone conversion
**Why it happens:** `new Date()` parses as UTC, toLocaleDateString() uses local timezone
**How to avoid:** Store ISO date string (YYYY-MM-DD), display using local formatting without time component

### Pitfall 5: Form Resets Losing Default Date
**What goes wrong:** After submit, form clears and date field becomes empty
**Why it happens:** Resetting all values to empty strings
**How to avoid:** On reset, set date to today's date, not empty string

## Code Examples

### Denomination Breakdown Validation
```javascript
// src/modules/validation/contributor.js
/**
 * Denomination values in fils for integer calculations
 */
const DENOMINATION_FILS = {
  five: 500,
  ten: 1000,
  twenty: 2000,
  fifty: 5000,
  hundred: 10000,
  twoHundred: 20000,
  fiveHundred: 50000,
  thousand: 100000
};

/**
 * Calculate total fils from breakdown
 * @param {Object} breakdown - Denomination counts
 * @returns {number} Total in fils
 */
export function calculateBreakdownTotal(breakdown) {
  return Object.entries(breakdown).reduce((sum, [key, count]) => {
    const fils = DENOMINATION_FILS[key] || 0;
    const countNum = parseInt(count, 10) || 0;
    return sum + (fils * countNum);
  }, 0);
}

/**
 * Validate contributor form data
 * @param {Object} data - Form values
 * @returns {{valid: boolean, errors: Map<string, string>}}
 */
export function validateContributorForm(data) {
  const errors = new Map();

  // Name validation
  if (!data.name || data.name.trim() === '') {
    errors.set('name', 'Name is required');
  }

  // Date validation
  if (!data.date) {
    errors.set('date', 'Date is required');
  }

  // Total amount validation
  const totalFils = Math.round(parseFloat(data.totalAmount) * 100);
  if (isNaN(totalFils) || totalFils <= 0) {
    errors.set('totalAmount', 'Please enter a valid amount greater than 0');
  }

  // Breakdown sum validation
  const breakdownTotal = calculateBreakdownTotal(data.breakdown);
  if (breakdownTotal !== totalFils) {
    const diff = Math.abs(breakdownTotal - totalFils) / 100;
    errors.set('breakdown', `Breakdown sum is ${breakdownTotal / 100} AED, but total is ${totalFils / 100} AED (difference: ${diff} AED)`);
  }

  return {
    valid: errors.size === 0,
    errors
  };
}
```

### ContributorForm Component Structure
```javascript
// src/components/ContributorForm.js
export class ContributorForm {
  constructor(onSubmit) {
    this._onSubmit = onSubmit;
    this._element = null;
    this._errorElements = new Map();
    this._resetValues();
  }

  _resetValues() {
    this._values = {
      name: '',
      date: new Date().toISOString().split('T')[0],
      totalAmount: '',
      breakdown: {
        five: 0, ten: 0, twenty: 0, fifty: 0,
        hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0
      }
    };
  }

  render() {
    const form = document.createElement('form');
    form.className = 'contributor-form';
    form.addEventListener('submit', (e) => this._handleSubmit(e));

    // Form fields...
    form.innerHTML = `
      <article class="form-card">
        <header>
          <h3>Add Contributor</h3>
        </header>
        <div class="form-grid">
          <label>
            Name
            <input type="text" name="name" value="${this._values.name}" required>
          </label>
          <label>
            Date
            <input type="date" name="date" value="${this._values.date}" required>
          </label>
          <label>
            Total Amount (AED)
            <input type="number" name="totalAmount" min="0" step="0.01"
                   value="${this._values.totalAmount}" required>
          </label>
        </div>
        <fieldset>
          <legend>Denomination Breakdown</legend>
          <div class="denomination-grid">
            <!-- 8 denomination inputs in 2-column grid -->
          </div>
        </fieldset>
        <footer>
          <button type="submit">Add Contributor</button>
        </footer>
      </article>
    `;

    this._element = form;
    this._attachListeners();
    return form;
  }

  _attachListeners() {
    // Blur validation for individual fields
    const inputs = this._element.querySelectorAll('input');
    inputs.forEach(input => {
      input.addEventListener('blur', () => this._validateField(input.name));
    });
  }

  _validateField(fieldName) {
    // Field-level validation, update aria-invalid and error message
  }

  _handleSubmit(event) {
    event.preventDefault();
    // Full validation, submit if valid
  }
}
```

### Store addContributor Method
```javascript
// Add to Store.js
/**
 * Add a new contributor to the state
 * @param {Object} contributorData - Raw contributor data from form
 * @param {string} contributorData.name - Contributor name
 * @param {string} contributorData.date - ISO date string
 * @param {number} contributorData.amountInFils - Amount in fils
 * @param {Object} contributorData.breakdown - Denomination counts
 */
addContributor(contributorData) {
  const contributor = {
    id: crypto.randomUUID(),
    name: contributorData.name.trim(),
    date: contributorData.date,
    amountInFils: contributorData.amountInFils,
    breakdown: { ...contributorData.breakdown }
  };

  this.setState(state => ({
    contributors: [...state.contributors, contributor]
  }));
}
```

### CSS for Form Layout
```css
/* src/styles/main.css additions */

/* Form Card Container */
.form-card {
  margin-bottom: var(--spacing-xl);
}

/* Two-column grid for denominations */
.denomination-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

@media (min-width: 768px) {
  .denomination-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* Error message styling */
.error-message {
  color: var(--pico-color-red-500);
  font-size: 0.875rem;
  margin-top: var(--spacing-xs);
}

/* Field with error */
input[aria-invalid="true"] {
  border-color: var(--pico-color-red-500);
}

/* Collapsible form section */
.form-section {
  margin-bottom: var(--spacing-xl);
}

.form-section.collapsed .form-card {
  display: none;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery form plugins | Native Web APIs + Custom components | Phase 1 decision | Reduced bundle size, modern patterns |
| Moment.js for dates | Native Date + ISO strings | Phase 1 | No library needed for simple date handling |
| Custom validation libraries | Schema validation functions | Phase 1 | Type-safe, testable validation |
| Manual DOM diffing | Observable Store pattern | Phase 1 | Reactive UI updates, simpler components |

**Deprecated/outdated:**
- None in this phase — all patterns established in Phase 1 remain current

## Open Questions

1. **Should the form show a running total of the breakdown?**
   - What we know: User enters total manually, breakdown validates against it
   - What's unclear: Whether to display calculated breakdown sum in real-time
   - Recommendation: Show calculated sum next to total field for visual feedback

2. **How to handle very long contributor lists?**
   - What we know: Form stays at top, list grows below
   - What's unclear: Whether to implement virtual scrolling or pagination
   - Recommendation: Standard scrollable list is fine for <100 contributors (typical Eid scenario)

3. **Should negative denomination counts be allowed?**
   - What we know: Schema validates integers only
   - What's unclear: Whether to allow 0 only or positive integers
   - Recommendation: min="0" on number inputs, validation enforces non-negative

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vitest.config.js |
| Quick run command | `npm test` |
| Full suite command | `npm test` |
| Environment | jsdom |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-01 | Add contributor with name, date, total | unit | `npm test -- ContributorForm.test.js` | ❌ Wave 0 |
| CONT-02 | Specify denomination breakdown | unit | `npm test -- ContributorForm.test.js` | ❌ Wave 0 |
| CONT-05 | View contributors in list | integration | `npm test -- AppContainer.test.js` | ❌ Wave 0 |
| VAL-01 | Validate breakdown sum equals total | unit | `npm test -- contributor.validation.test.js` | ❌ Wave 0 |
| VAL-02 | Show real-time validation errors | unit | `npm test -- ContributorForm.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- <specific-test>.test.js -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/ContributorForm.test.js` — covers CONT-01, CONT-02, VAL-02
- [ ] `src/modules/validation/contributor.test.js` — covers VAL-01
- [ ] `src/components/AppContainer.test.js` — covers CONT-05 (enhancement)
- [ ] Store.addContributor() method — prerequisite for form submission

## Sources

### Primary (HIGH confidence)
- `/mnt/c/Users/force/.projects/eidiya/src/modules/state/schema.js` — Existing validation patterns
- `/mnt/c/Users/force/.projects/eidiya/src/modules/state/Store.js` — Observable state pattern
- `/mnt/c/Users/force/.projects/eidiya/src/components/AppContainer.js` — Component structure
- Pico CSS Documentation — https://picocss.com/docs/forms (semantic form styling)

### Secondary (MEDIUM confidence)
- MDN Web Docs — `<input type="date">`, `<input type="number">` behavior
- Web Crypto API — `crypto.randomUUID()` browser support (95%+ global)

### Tertiary (LOW confidence)
- None — all findings verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Established in Phase 1, no changes needed
- Architecture: HIGH — Patterns already proven in codebase
- Pitfalls: HIGH — Based on established Money class patterns and schema validation

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days — vanilla JS patterns are stable)
