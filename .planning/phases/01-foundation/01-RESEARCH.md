# Phase 1: Foundation - Research

**Researched:** 2026-03-11
**Domain:** Vanilla JavaScript, localStorage, Currency Handling, Pico CSS, Vite
**Confidence:** HIGH

---

## Summary

Phase 1 establishes the foundational data layer for Eidiya, a client-side Eid money tracking application. The core technical challenges are: (1) preventing floating-point errors by storing all monetary values as integers (fils), (2) implementing robust localStorage persistence with graceful degradation for Safari private browsing, and (3) establishing a responsive, mobile-first UI foundation using Pico CSS.

**Primary recommendation:** Use integer fils (1 AED = 100 fils) for all internal storage, wrap localStorage in a safe wrapper with in-memory fallback, and leverage Pico CSS's automatic dark mode and responsive typography. Structure the Vite vanilla JavaScript project with feature-based modules and path aliases for maintainability.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PERS-01 | System saves all data to localStorage automatically | SafeStorage wrapper pattern with auto-save on state changes |
| PERS-02 | System loads data from localStorage on app start | Initialization pattern with schema validation and migration |
| PERS-03 | System handles localStorage errors gracefully | Feature detection + in-memory Map fallback + user notification |
| VAL-03 | System stores all monetary values as integers (fils) | Integer-based money pattern (fils = AED * 100) |
| UX-01 | App is responsive and works on mobile devices | Pico CSS mobile-first + viewport meta + responsive grid |
| UX-02 | App uses AED currency formatting throughout | Intl.NumberFormat with 'en-AE' locale |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vite | 6.x (latest) | Build tool + dev server | Official vanilla template, HMR, optimized builds |
| Pico CSS | 2.x | Classless CSS framework | Automatic dark mode, semantic HTML, mobile-first |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| Native ES Modules | ES2022+ | Module system | Zero runtime overhead, native browser support |
| Intl.NumberFormat | Built-in | Currency formatting | Native API, locale-aware, no dependencies |

### Installation
```bash
npm create vite@latest eidiya -- --template vanilla
npm install @picocss/pico
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/
├── main.js                 # App entry point
├── app.js                  # Core application controller
├── styles/
│   ├── main.css           # Global styles + Pico overrides
│   └── variables.css      # Custom CSS properties
├── modules/
│   ├── storage/           # Persistence layer
│   │   ├── SafeStorage.js # localStorage wrapper with fallback
│   │   └── migrations.js  # Data version migrations
│   ├── money/             # Currency handling
│   │   ├── Money.js       # Money value object
│   │   └── formatters.js  # AED formatting utilities
│   └── state/             # Application state
│       ├── Store.js       # Observable state container
│       └── schema.js      # Data structure definitions
├── components/            # UI components (vanilla JS)
│   └── AppContainer.js
└── utils/
    ├── validators.js      # Input validation helpers
    └── dom.js            # DOM manipulation utilities
```

### Pattern 1: Integer Money Storage (Fils)
**What:** Store all monetary values as integers representing fils (1 AED = 100 fils)
**When to use:** All internal storage, calculations, and API boundaries
**Why:** Eliminates floating-point errors (0.1 + 0.2 !== 0.3)

```javascript
// src/modules/money/Money.js
export class Money {
  constructor(fils) {
    if (!Number.isInteger(fils)) {
      throw new TypeError('Money must be initialized with integer fils');
    }
    this._fils = fils;
  }

  static fromAED(aedAmount) {
    return new Money(Math.round(aedAmount * 100));
  }

  toAED() {
    return this._fils / 100;
  }

  toFils() {
    return this._fils;
  }

  add(other) {
    return new Money(this._fils + other._fils);
  }

  subtract(other) {
    return new Money(this._fils - other._fils);
  }

  multiply(factor) {
    return new Money(Math.round(this._fils * factor));
  }

  format(locale = 'en-AE') {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'AED'
    }).format(this.toAED());
  }

  toJSON() {
    return this._fils; // Serialize as integer
  }
}
```

### Pattern 2: SafeStorage Wrapper
**What:** localStorage wrapper with feature detection, error handling, and in-memory fallback
**When to use:** All persistence operations
**Why:** Safari private browsing throws QuotaExceededError; need graceful degradation

```javascript
// src/modules/storage/SafeStorage.js
export class SafeStorage {
  constructor() {
    this._fallback = new Map();
    this._available = this._checkAvailability();
    this._usingFallback = !this._available;
  }

  _checkAvailability() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  isAvailable() {
    return this._available;
  }

  isUsingFallback() {
    return this._usingFallback;
  }

  setItem(key, value) {
    const serialized = JSON.stringify(value);

    if (this._usingFallback) {
      this._fallback.set(key, serialized);
      return { success: false, fallback: true };
    }

    try {
      localStorage.setItem(key, serialized);
      return { success: true, fallback: false };
    } catch (error) {
      if (this._isQuotaError(error)) {
        this._usingFallback = true;
        this._fallback.set(key, serialized);
        return { success: false, fallback: true, error: 'quota_exceeded' };
      }
      throw error;
    }
  }

  getItem(key) {
    if (this._usingFallback) {
      const value = this._fallback.get(key);
      return value ? JSON.parse(value) : null;
    }

    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      const value = this._fallback.get(key);
      return value ? JSON.parse(value) : null;
    }
  }

  removeItem(key) {
    if (this._usingFallback) {
      this._fallback.delete(key);
      return;
    }
    try {
      localStorage.removeItem(key);
    } catch (error) {
      // Silently ignore removal errors
    }
  }

  _isQuotaError(error) {
    return error.name === 'QuotaExceededError' ||
           error.code === 22 ||
           error.code === 1014 ||
           error.message?.includes('quota');
  }
}
```

### Pattern 3: Observable State Store
**What:** Simple observable pattern for state management with auto-persistence
**When to use:** Application state that needs to trigger UI updates
**Why:** Decouples state from UI, enables auto-save

```javascript
// src/modules/state/Store.js
export class Store {
  constructor(initialState = {}, storage = null) {
    this._state = { ...initialState };
    this._listeners = new Set();
    this._storage = storage;
    this._storageKey = 'eidiya_data';
  }

  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  getState() {
    return { ...this._state };
  }

  setState(updater) {
    const prevState = this._state;
    this._state = typeof updater === 'function'
      ? updater(prevState)
      : { ...prevState, ...updater };

    this._notify(prevState);
    this._persist();
  }

  _notify(prevState) {
    this._listeners.forEach(listener => {
      listener(this._state, prevState);
    });
  }

  _persist() {
    if (this._storage) {
      const result = this._storage.setItem(this._storageKey, this._state);
      if (result.fallback && result.error === 'quota_exceeded') {
        this._notifyQuotaExceeded();
      }
    }
  }

  _notifyQuotaExceeded() {
    // Dispatch custom event for UI to handle
    window.dispatchEvent(new CustomEvent('eidiya:quota-exceeded'));
  }

  load() {
    if (this._storage) {
      const data = this._storage.getItem(this._storageKey);
      if (data) {
        this._state = { ...this._state, ...data };
        this._notify(this._state);
      }
    }
  }
}
```

### Pattern 4: Data Schema with Validation
**What:** TypeScript-style JSDoc + runtime validation for data integrity
**When to use:** Loading persisted data, API boundaries
**Why:** Prevents corrupted data from crashing the app

```javascript
// src/modules/state/schema.js

/**
 * @typedef {Object} DenominationBreakdown
 * @property {number} five - Count of 5 AED notes
 * @property {number} ten - Count of 10 AED notes
 * @property {number} twenty - Count of 20 AED notes
 * @property {number} fifty - Count of 50 AED notes
 * @property {number} hundred - Count of 100 AED notes
 * @property {number} twoHundred - Count of 200 AED notes
 * @property {number} fiveHundred - Count of 500 AED notes
 * @property {number} thousand - Count of 1000 AED notes
 */

/**
 * @typedef {Object} Contributor
 * @property {string} id - UUID v4
 * @property {string} name - Contributor name
 * @property {string} date - ISO 8601 date string
 * @property {number} amountInFils - Total amount in fils (integer)
 * @property {DenominationBreakdown} breakdown - Note denomination counts
 */

/**
 * @typedef {Object} AppState
 * @property {string} version - Data schema version
 * @property {Contributor[]} contributors - List of contributors
 * @property {number} createdAt - Timestamp
 * @property {number} updatedAt - Timestamp
 */

export const CURRENT_SCHEMA_VERSION = '1.0.0';

export const DEFAULT_STATE = {
  version: CURRENT_SCHEMA_VERSION,
  contributors: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

export function validateState(data) {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Data must be an object' };
  }

  if (!Array.isArray(data.contributors)) {
    return { valid: false, error: 'contributors must be an array' };
  }

  for (const contributor of data.contributors) {
    if (!contributor.id || typeof contributor.id !== 'string') {
      return { valid: false, error: 'Contributor missing valid id' };
    }
    if (!Number.isInteger(contributor.amountInFils)) {
      return { valid: false, error: 'Contributor amount must be integer fils' };
    }
  }

  return { valid: true };
}

export function migrateState(data) {
  // Future migrations go here
  if (!data.version) {
    data.version = '1.0.0';
  }
  return data;
}
```

### Anti-Patterns to Avoid
- **Storing money as floats:** Never use `50.25` for AED amounts; always use `5025` fils
- **Direct localStorage access:** Always wrap in abstraction for error handling
- **Synchronous validation on every keystroke:** Debounce validation for performance
- **Global state mutations:** Always use immutable updates

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Currency formatting | Custom regex/string manipulation | `Intl.NumberFormat` | Handles locales, RTL, symbol placement automatically |
| Money arithmetic | Raw JavaScript operators on floats | Integer fils + Money class | Floating-point errors accumulate |
| CSS reset/normalize | Custom reset CSS | Pico CSS built-in | Already optimized for semantic HTML |
| Dark mode toggle | Custom theme system | Pico CSS `data-theme` | Handles all component variants automatically |
| Storage quota detection | Complex heuristics | Try/catch on setItem | Only reliable method across browsers |

---

## Common Pitfalls

### Pitfall 1: Floating-Point Money Errors
**What goes wrong:** `0.1 + 0.2 !== 0.3` causes calculation errors in financial totals
**Why it happens:** JavaScript uses IEEE 754 double-precision floats
**How to avoid:** Store as integer fils, only convert to decimal for display
**Warning signs:** Totals that don't match expected values, "off by 0.01" errors

### Pitfall 2: Safari Private Browsing Data Loss
**What goes wrong:** App appears to work but data disappears on refresh
**Why it happens:** Safari exposes localStorage but throws on setItem in private mode
**How to avoid:** Always use SafeStorage wrapper with feature detection
**Warning signs:** Works in Chrome/Firefox but not Safari; data loss reported by iOS users

### Pitfall 3: JSON Serialization of Money Objects
**What goes wrong:** Money instances serialize to `{}` or lose methods
**Why it happens:** JSON.stringify only serializes own enumerable properties
**How to avoid:** Implement `toJSON()` method returning integer, reconstruct on load
**Warning signs:** Loaded data has amount: undefined or NaN

### Pitfall 4: localeStorage Quota Exceeded Silent Failure
**What goes wrong:** App stops saving without warning user
**Why it happens:** 5-10MB limit varies by browser; no native quota API
**How to avoid:** Wrap setItem, detect QuotaExceededError, show user notification
**Warning signs:** Changes appear to save but disappear on refresh

### Pitfall 5: AED Symbol Position in Arabic
**What goes wrong:** Currency symbol appears on wrong side in Arabic locale
**Why it happens:** Arabic is RTL; AED symbol has specific placement rules
**How to avoid:** Use `Intl.NumberFormat` with proper locale, test in both LTR/RTL
**Warning signs:** Symbol overlaps numbers or appears on wrong side

---

## Code Examples

### AED Currency Formatting
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat

function formatAED(filsAmount, locale = 'en-AE') {
  const aedAmount = filsAmount / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'AED',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(aedAmount);
}

// Examples:
formatAED(5000);        // "AED 50.00"
formatAED(125000);      // "AED 1,250.00"
formatAED(5025);        // "AED 50.25"
formatAED(5025, 'ar-AE'); // "د.إ.‏ ٥٠٫٢٥" (Eastern Arabic numerals)
```

### Pico CSS Responsive Foundation
```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Eidiya - Eid Money Tracker</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@picocss/pico@2/css/pico.min.css">
  <link rel="stylesheet" href="/src/styles/main.css">
</head>
<body>
  <main class="container">
    <header>
      <h1>Eidiya</h1>
      <p>Eid money tracking made simple</p>
    </header>
    <div id="app"></div>
  </main>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

```css
/* src/styles/main.css */

/* Custom properties override */
:root {
  --pico-primary: #0172ad;
  --pico-primary-hover: #015887;
  --pico-font-family: system-ui, -apple-system, sans-serif;
}

/* Mobile-first custom styles */
.app-container {
  padding: var(--pico-spacing);
}

/* Tablet and up */
@media (min-width: 768px) {
  .app-container {
    padding: calc(var(--pico-spacing) * 2);
  }
}

/* Storage warning banner */
.storage-warning {
  background-color: var(--pico-contrast-focus);
  color: var(--pico-contrast-inverse);
  padding: var(--pico-spacing);
  border-radius: var(--pico-border-radius);
  margin-bottom: var(--pico-spacing);
}
```

### Vite Configuration
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@modules': resolve(__dirname, 'src/modules'),
      '@components': resolve(__dirname, 'src/components'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@styles': resolve(__dirname, 'src/styles')
    }
  },
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});
```

### App Initialization Pattern
```javascript
// src/main.js
import './styles/main.css';
import { SafeStorage } from '@modules/storage/SafeStorage.js';
import { Store } from '@modules/state/Store.js';
import { DEFAULT_STATE, validateState, migrateState } from '@modules/state/schema.js';
import { App } from './app.js';

function init() {
  // Initialize storage with fallback
  const storage = new SafeStorage();

  // Create store with storage integration
  const store = new Store(DEFAULT_STATE, storage);

  // Load persisted data
  const savedData = storage.getItem('eidiya_data');
  if (savedData) {
    const validation = validateState(savedData);
    if (validation.valid) {
      const migrated = migrateState(savedData);
      store.setState(migrated);
    } else {
      console.warn('Saved data invalid, using defaults:', validation.error);
    }
  }

  // Show storage warning if using fallback
  if (storage.isUsingFallback()) {
    showStorageWarning();
  }

  // Initialize app
  const app = new App(document.getElementById('app'), store);
  app.init();
}

function showStorageWarning() {
  const warning = document.createElement('div');
  warning.className = 'storage-warning';
  warning.textContent = 'Data will not persist: Private browsing mode detected';
  document.querySelector('main').prepend(warning);
}

document.addEventListener('DOMContentLoaded', init);
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store money as float decimals | Store as integer minor units (fils) | Industry standard since ~2015 | Eliminates floating-point errors |
| Manual currency formatting | `Intl.NumberFormat` API | ES2015 (2015), widely supported since 2018 | Native locale support, no libraries needed |
| localStorage without checks | Feature detection + fallback | Best practice since Safari private mode issue known | Graceful degradation |
| Framework-based state | Native ES modules + observable patterns | 2020+ trend | Zero runtime overhead |
| Custom CSS frameworks | Classless semantic CSS (Pico) | 2022+ with Pico v2 | Faster development, automatic dark mode |

**Deprecated/outdated:**
- `toLocaleString()` for currency: Use `Intl.NumberFormat` instead
- `Number.prototype.toFixed()`: Insufficient for currency formatting (no symbol, no locale)
- Framework-specific state management (Redux, etc.): Overkill for this use case

---

## Validation Architecture

Since `nyquist_validation` is enabled in config, Phase 1 requires test infrastructure setup.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (Vite-native) |
| Config file | `vitest.config.js` (to be created) |
| Quick run command | `npm test` |
| Full suite command | `npm run test:ui` (with UI) |

### Phase Requirements to Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| VAL-03 | Money stores as integer fils | Unit | `npm test -- Money.test.js` | No - Wave 0 |
| PERS-01 | Data saves to localStorage | Unit | `npm test -- SafeStorage.test.js` | No - Wave 0 |
| PERS-02 | Data loads from localStorage | Unit | `npm test -- Store.test.js` | No - Wave 0 |
| PERS-03 | Graceful fallback on quota error | Unit | `npm test -- SafeStorage.test.js` | No - Wave 0 |
| UX-02 | AED formatting correct | Unit | `npm test -- formatters.test.js` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- --run`
- **Per wave merge:** `npm run test`
- **Phase gate:** All tests green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.js` - Vitest configuration
- [ ] `package.json` test scripts - Add test commands
- [ ] `tests/unit/Money.test.js` - Money class unit tests
- [ ] `tests/unit/SafeStorage.test.js` - Storage wrapper tests
- [ ] `tests/unit/Store.test.js` - State management tests
- [ ] `tests/unit/formatters.test.js` - Currency formatting tests
- [ ] Framework install: `npm install -D vitest @vitest/ui jsdom`

---

## Open Questions

1. **Data Migration Strategy**
   - What we know: Need version field in state schema
   - What's unclear: How many schema changes expected in v1?
   - Recommendation: Implement basic version checking, add migrations as needed

2. **localStorage Size Limits**
   - What we know: Generally 5-10MB, varies by browser
   - What's unclear: Exact limit for target user base
   - Recommendation: Monitor data size, warn if approaching 1MB

3. **Offline Detection**
   - What we know: `navigator.onLine` exists but is unreliable
   - What's unclear: Whether offline indicator is needed for Phase 1
   - Recommendation: Defer to Phase 3 (UX enhancements)

---

## Sources

### Primary (HIGH confidence)
- [Pico CSS Official Docs - CSS Variables](https://picocss.com/docs/css-variables) - Variable structure and customization
- [Pico CSS Official Docs - Color Schemes](https://picocss.com/docs/color-schemes) - Dark mode implementation
- [Pico CSS v2 What's New](https://picocss.com/docs/v2) - v2.x features and breaking changes
- [Vite Official Guide](https://vite.dev/guide/) - Project structure and configuration
- [MDN - Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat) - Currency formatting API

### Secondary (MEDIUM confidence)
- [frontstuff.io - Handling Monetary Values in JavaScript](https://frontstuff.io/how-to-handle-monetary-values-in-javascript) - Integer money pattern
- [HackerOne - Precision Matters](https://www.hackerone.com/blog/precision-matters-why-using-cents-instead-floating-point-transaction-amounts-crucial) - Why integers for money
- [muffinman.io - Safari Private Mode localStorage](https://muffinman.io/blog/localstorage-and-sessionstorage-in-safaris-private-mode/) - Safari behavior details
- [TrackJS - localStorage Errors](https://trackjs.com/javascript-errors/failed-to-execute-setitem-on-storage/) - Error handling patterns

### Tertiary (LOW confidence)
- Various blog posts on Zod/Yup validation - Not applicable since project uses vanilla JS
- Web search results for Vite 7 - Vite 6 is current stable; patterns remain valid

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official docs and stable versions
- Architecture: HIGH - Established patterns, widely used
- Pitfalls: HIGH - Well-documented issues with known solutions
- Validation: MEDIUM - Vitest is standard but config needs project-specific tuning

**Research date:** 2026-03-11
**Valid until:** 2026-06-11 (90 days for stable stack)
