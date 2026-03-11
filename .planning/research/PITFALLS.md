# Pitfalls Research: Eidiya Money Tracking App

**Domain:** Client-side money tracking with localStorage
**Researched:** 2026-03-11
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Floating-Point Money Calculation Errors

**What goes wrong:**
JavaScript's IEEE 754 floating-point arithmetic cannot precisely represent common decimal values like 0.1, 0.2, or 0.01. This causes calculation errors that compound across multiple operations.

```javascript
// The classic example
0.1 + 0.2 === 0.3  // false (actually 0.30000000000000004)

// Real impact for Eidiya
const total = 100.5 + 50.25 + 25.75;  // May not equal 176.50 exactly
```

**Why it happens:**
Binary floating-point representation cannot exactly represent decimal fractions. Financial calculations require exact precision, but JavaScript Numbers are approximations.

**How to avoid:**
- **Store all amounts as integers (fils/cent equivalents)** — store 176.50 AED as 17650 fils
- Perform all calculations in integers, convert to display format only at render time
- Never use native `Number` for money math

```javascript
// Safe pattern for AED
const toFils = (aed) => Math.round(aed * 100);
const toAed = (fils) => (fils / 100).toFixed(2);

// All calculations in fils
const totalFils = contributions.reduce((sum, c) => sum + c.amountFils, 0);
```

**Warning signs:**
- Totals that don't visually match sum of line items
- "Off by a few fils" discrepancies in reports
- Tests passing with approximate equality (`toBeCloseTo`) instead of exact

**Phase to address:**
Phase 1 (Data Model) — Fix at the schema level before any calculations exist

---

### Pitfall 2: Silent Data Loss from localStorage Quota Exceeded

**What goes wrong:**
When localStorage exceeds its ~5MB per-origin limit, `setItem()` throws a `QuotaExceededError`. Without handling, this error bubbles up and the save operation fails silently from the user's perspective.

**Why it happens:**
- localStorage has a hard limit (typically 5-10MB per origin)
- No warning before limit is reached
- Error only thrown on write attempts
- Many developers don't wrap localStorage calls in try-catch

**How to avoid:**
```javascript
function safeSetItem(key, value) {
  try {
    const serialized = JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return { success: true };
  } catch (error) {
    if (error.name === 'QuotaExceededError' ||
        error.code === 22 ||
        error.message?.includes('quota')) {
      // Alert user, offer export/backup
      return { success: false, error: 'STORAGE_FULL' };
    }
    throw error; // Re-throw unexpected errors
  }
}
```

**Warning signs:**
- User reports "my data disappeared" after adding many entries
- App works on desktop but fails on mobile Safari
- Data saves intermittently

**Phase to address:**
Phase 1 (Storage Layer) — Implement safe storage wrapper from day one

---

### Pitfall 3: Safari Private Browsing Mode Data Loss

**What goes wrong:**
Safari on iOS (and macOS) completely disables localStorage writes in Private Browsing mode. All `setItem()` calls throw `QuotaExceededError`, making the app appear broken to users.

**Why it happens:**
Safari's privacy implementation blocks all script-writable storage in private mode. Unlike Chrome/Firefox (which allow writes but clear on exit), Safari throws errors on every write attempt.

**How to avoid:**
1. Detect storage availability on app load
2. Provide clear messaging when storage is unavailable
3. Offer export/import as fallback workflow

```javascript
function isStorageAvailable() {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

// On app init
if (!isStorageAvailable()) {
  // Show banner: "Private mode detected. Use export feature to save your work."
}
```

**Warning signs:**
- App works on Android but "doesn't save" on iPhone
- Errors in Safari console: `QuotaExceededError: DOM Exception 22`
- User confusion about why app "doesn't work"

**Phase to address:**
Phase 1 (App Bootstrap) — Detect and handle before any data operations

---

### Pitfall 4: JSON Parse Errors from Corrupted localStorage

**What goes wrong:**
Data retrieved from localStorage may fail `JSON.parse()` due to corruption, manual editing, schema changes, or partial writes. Without handling, this crashes the app on load.

**Why it happens:**
- localStorage stores strings only; corruption can happen at any point
- Manual DevTools manipulation by users
- App updates may change data structure expectations
- Browser crashes during write can leave partial data

**How to avoid:**
```javascript
function safeGetItem(key, defaultValue = null) {
  try {
    const data = localStorage.getItem(key);
    if (data === null) return defaultValue;
    return JSON.parse(data);
  } catch (error) {
    console.error(`Corrupted data for key "${key}":`, error);
    // Option 1: Return default (data loss)
    // Option 2: Return raw string for inspection
    // Option 3: Prompt user to clear or recover
    return defaultValue;
  }
}
```

**Warning signs:**
- White screen on app load
- Console error: `Unexpected token in JSON at position X`
- App works in incognito but not normal mode (corrupted data in normal)

**Phase to address:**
Phase 1 (Storage Layer) — All reads must be wrapped with fallbacks

---

### Pitfall 5: Denomination Breakdown Sum Validation Failure

**What goes wrong:**
Users enter note breakdowns (e.g., "5 x 100 AED + 10 x 50 AED") that don't sum to their total contribution. Without validation, this creates data integrity issues when calculating bank withdrawal needs.

**Why it happens:**
- Manual entry errors are common
- Users may misunderstand the breakdown requirement
- No real-time validation allows errors to persist

**How to avoid:**
```javascript
function validateBreakdown(totalFils, breakdown) {
  const calculatedFils = breakdown.reduce((sum, item) => {
    return sum + (item.count * item.denomination * 100);
  }, 0);

  return totalFils === calculatedFils;
}

// Show error inline, prevent form submission
```

**Warning signs:**
- Bank summary shows impossible totals
- Negative or fractional note counts in calculations
- User confusion about "missing" money

**Phase to address:**
Phase 2 (Contribution Form) — Real-time validation with visual feedback

---

### Pitfall 6: Mobile Currency Input UX Friction

**What goes wrong:**
Default mobile keyboards make currency entry frustrating. Users get alphabetical keyboards for number fields, or decimal points are hard to access, leading to input errors and abandonment.

**Why it happens:**
- `type="number"` behavior varies across devices
- Some keyboards don't show decimal point
- Input masking can interfere with native keyboard behavior

**How to avoid:**
```html
<!-- Use inputmode for better mobile keyboards -->
<input
  type="text"
  inputmode="decimal"
  pattern="[0-9]*[.]?[0-9]*"
  placeholder="0.00"
/>
```

- Use `inputmode="decimal"` for currency fields
- Validate on blur, not during typing
- Show formatted value separately from input

**Warning signs:**
- User complaints about "keyboard keeps changing"
- High form abandonment on mobile
- Invalid amount errors from user typos

**Phase to address:**
Phase 2 (Form Design) — Test on actual iOS and Android devices

---

### Pitfall 7: Data Loss on Browser Data Clear

**What goes wrong:**
Users clear browser data (cookies, cache) to fix unrelated issues, inadvertently wiping all Eidiya data with no recovery path.

**Why it happens:**
- localStorage is treated as "site data" by browsers
- Clearing cookies/cache typically clears localStorage
- Users don't understand the connection

**How to avoid:**
- Provide explicit export to file functionality
- Show warning before critical operations
- Consider periodic auto-export prompts

```javascript
function exportToFile(data) {
  const blob = new Blob([JSON.stringify(data, null, 2)],
    { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `eidiya-backup-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
}
```

**Warning signs:**
- User reports "all my data is gone" after "fixing" browser issues
- No way to help them recover

**Phase to address:**
Phase 3 (Data Management) — Export/import features with clear UI

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip storage error handling | Faster initial build | Silent data loss, hard-to-debug issues | Never — implement from day one |
| Use floats for money | Simpler code | Calculation errors, financial inaccuracies | Never — always use integer cents/fils |
| No data validation | Faster form implementation | Corrupted state, impossible data | MVP only with clear tech debt ticket |
| Skip Safari private mode detection | Less code | Broken experience for iOS users | Never — detection is trivial |
| No export functionality | Fewer features | No recovery path for users | Acceptable for very early MVP only |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No visual confirmation on save | Users unsure if data was saved | Show toast/confirmation on every save |
| Complex denomination entry | Users abandon contribution form | Step-by-step wizard with validation |
| No printable summary | Organizer can't bring list to bank | Generate clean, printable view |
| Missing "received" confirmation | Confusion about distribution status | Clear checkboxes with timestamps |
| No undo on delete | Accidental data loss | Soft delete with undo option or confirmation |

## "Looks Done But Isn't" Checklist

- [ ] **Data persistence:** Wraps all localStorage calls in try-catch with error handling
- [ ] **Money calculations:** Uses integer fils, never floating-point AED
- [ ] **Input validation:** Denomination breakdowns sum to contribution amount
- [ ] **Mobile UX:** Tested currency input on iOS Safari and Android Chrome
- [ ] **Private mode:** Detects and handles Safari private browsing gracefully
- [ ] **Data recovery:** Export to file functionality implemented
- [ ] **Corruption handling:** JSON parse errors caught with fallbacks
- [ ] **Storage limits:** Monitors quota and warns user when approaching limit

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Floating-point errors | HIGH | Migrate all data to integer format; recalculate all totals |
| localStorage quota exceeded | MEDIUM | Implement data export; clear old data; restructure storage |
| Safari private mode | LOW | Show explanatory message; guide user to regular mode |
| JSON corruption | MEDIUM | Clear corrupted keys; restore from backup if available |
| Denomination mismatch | LOW | Fix individual entries with validation errors |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Floating-point errors | Phase 1 (Data Model) | Unit tests verify all calculations use integers |
| localStorage quota | Phase 1 (Storage Layer) | Error handling tests pass; quota monitoring works |
| Safari private mode | Phase 1 (App Bootstrap) | Tested on iOS Safari private mode |
| JSON parse errors | Phase 1 (Storage Layer) | Corrupted data tests return defaults gracefully |
| Denomination validation | Phase 2 (Contribution Form) | Form rejects invalid breakdowns; shows inline errors |
| Mobile input UX | Phase 2 (Form Design) | Tested on physical iOS and Android devices |
| Data loss on clear | Phase 3 (Data Management) | Export produces valid JSON; import restores data |

## Sources

- [JavaScript Rounding Errors in Financial Applications](https://www.robinwieruch.de/javascript-rounding-errors/)
- [Precise Financial Calculation in JavaScript - Stack Overflow](https://stackoverflow.com/questions/2876536/precise-financial-calculation-in-javascript-what-are-the-gotchas)
- [iOS Private Browsing + localStorage = Frustration](https://spin.atomicobject.com/ios-private-browsing-localstorage/)
- [localStorage does not work in Safari Private Browsing](https://www.robin-drexler.com/2015/07/12/til-localstorage-does-not-work-in-safari-in-private-browsing-mode)
- [10 LocalStorage Mistakes to Avoid](https://javascript.plainenglish.io/10-localstorage-mistakes-to-avoid-ff49bc7d46a0)
- [Handling Currency and Financial Calculations with JavaScript](https://www.slingacademy.com/article/handling-currency-and-financial-calculations-with-javascript-numbers/)
- [Top 10 UX Mistakes Fintech Apps Make](https://www.pragmaticcoders.com/blog/ux-mistakes-in-fintech-apps)
- [7 Common Bugs When Using LocalStorage](https://javascript.plainenglish.io/7-common-bugs-when-using-localstorage-72eb9974a82c)

---
*Pitfalls research for: Eidiya money tracking app*
*Researched: 2026-03-11*
