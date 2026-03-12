# Phase 4: Distribution - Research

**Researched:** 2026-03-12
**Domain:** Distribution tracking, print CSS, checkbox UI patterns
**Confidence:** HIGH

## Summary

Phase 4 implements distribution tracking for the Eidiya app, allowing users to mark contributors as "received" their exchanged notes and generate printable distribution lists. The implementation builds on the existing Store pattern, ContributorCard component architecture, and state management system established in previous phases.

**Primary recommendation:** Extend the Contributor schema with a `received` boolean flag, add toggle UI to ContributorCard, create a DistributionPanel component for remaining notes calculation, and implement a print-optimized view using CSS @media print with window.print() API.

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DIST-01 | User can mark each contributor as "received" or "not received" their exchanged notes | Add `received` boolean to Contributor schema; implement toggle checkbox in ContributorCard; Store.updateContributor handles updates |
| DIST-02 | System displays remaining notes to distribute after each marked receipt | Create distribution selector to calculate remaining notes (total - received); display in new DistributionPanel component |
| DIST-03 | User can generate a printable per-person distribution list showing what notes each person should receive | Create print view component with window.print(); use @media print CSS for clean layout; show per-contributor breakdown |

## Standard Stack

### Core (Already in Use)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JS (ES2022+) | Native | Component logic | Zero runtime overhead, sufficient for this feature |
| Pico CSS 2.x | 2.x | Base styling | Already used, classless semantic styling |
| Vite | 7.3.1 | Build tooling | Already configured |
| Vitest | 4.0.18 | Testing | Already configured with jsdom |

### No New Dependencies Required
All functionality can be implemented with existing stack:
- **State management:** Existing Store class with `updateContributor()`
- **Schema migrations:** Existing schema.js migration pattern
- **Print functionality:** Native `window.print()` API + CSS `@media print`
- **Checkboxes:** Native HTML `<input type="checkbox">` with Pico CSS styling

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── ContributorCard.js          # Add received toggle
│   ├── DistributionPanel.js        # NEW: Remaining notes display
│   ├── DistributionPrintView.js    # NEW: Print-optimized view
│   └── AppContainer.js             # Integrate new components
├── modules/
│   └── state/
│       ├── schema.js               # Add received field + migration
│       ├── selectors.js            # Add distribution selectors
│       └── Store.js                # May need toggleReceived method
└── styles/
    └── main.css                    # Add print styles
```

### Pattern 1: Schema Extension with Migration
**What:** Add new field to Contributor type with backward-compatible migration
**When to use:** When adding new data fields that need persistence
**Example:**
```javascript
// In schema.js - extend Contributor typedef
/**
 * @typedef {Object} Contributor
 * @property {string} id
 * @property {string} name
 * @property {string} date
 * @property {number} amountInFils
 * @property {DenominationBreakdown} breakdown
 * @property {boolean} [received] - Whether contributor has received their notes (NEW)
 */

// In migrateState - handle missing field
export function migrateState(data) {
  return {
    version: CURRENT_SCHEMA_VERSION, // Bump to 1.1.0
    contributors: Array.isArray(data.contributors)
      ? data.contributors.map(c => ({
          ...c,
          received: c.received ?? false, // Default to false for existing
        }))
      : [],
    // ...rest
  };
}
```

### Pattern 2: Toggle UI in ContributorCard
**What:** Add checkbox toggle for received status within existing card component
**When to use:** When adding a simple boolean state to existing list items
**Example:**
```javascript
// In ContributorCard render method
const receivedSection = document.createElement('div');
receivedSection.className = 'received-section';

const checkbox = document.createElement('input');
checkbox.type = 'checkbox';
checkbox.checked = this._contributor.received || false;
checkbox.id = `received-${this._contributor.id}`;
checkbox.addEventListener('change', (e) => {
  this._onUpdate(this._contributor.id, { received: e.target.checked });
});

const label = document.createElement('label');
label.htmlFor = checkbox.id;
label.textContent = 'Received';

receivedSection.appendChild(checkbox);
receivedSection.appendChild(label);
```

### Pattern 3: Distribution Selector Pattern
**What:** Pure function to calculate remaining notes based on received status
**When to use:** When deriving computed state from existing data
**Example:**
```javascript
// In selectors.js
/**
 * Calculate remaining notes to distribute
 * @param {Array} contributors - All contributors
 * @returns {Object} Remaining counts by denomination
 */
export function calculateRemainingNotes(contributors) {
  if (!Array.isArray(contributors)) {
    return { /* all zeros */ };
  }

  return contributors
    .filter(c => !c.received) // Only unreceived
    .reduce((totals, contributor) => {
      const bd = contributor.breakdown || {};
      return {
        five: totals.five + (bd.five || 0),
        ten: totals.ten + (bd.ten || 0),
        // ... all denominations
      };
    }, { /* initial zeros */ });
}

/**
 * Calculate distribution progress
 * @param {Array} contributors
 * @returns {Object} { total, received, remaining, percentComplete }
 */
export function calculateDistributionProgress(contributors) {
  if (!Array.isArray(contributors)) {
    return { total: 0, received: 0, remaining: 0, percentComplete: 0 };
  }

  const total = contributors.length;
  const received = contributors.filter(c => c.received).length;

  return {
    total,
    received,
    remaining: total - received,
    percentComplete: total > 0 ? Math.round((received / total) * 100) : 0,
  };
}
```

### Pattern 4: Print View Component
**What:** Dedicated component for print-optimized display
**When to use:** When print layout differs significantly from screen layout
**Example:**
```javascript
// DistributionPrintView.js
export class DistributionPrintView {
  constructor(contributors) {
    this._contributors = contributors;
  }

  render() {
    const container = document.createElement('div');
    container.className = 'print-view';

    // Header
    const header = document.createElement('header');
    header.innerHTML = `
      <h1>Eidiya Distribution List</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
    `;
    container.appendChild(header);

    // Per-person lists
    const lists = document.createElement('div');
    lists.className = 'distribution-lists';

    this._contributors.forEach(contributor => {
      lists.appendChild(this._renderPersonList(contributor));
    });

    container.appendChild(lists);
    return container;
  }

  _renderPersonList(contributor) {
    const card = document.createElement('div');
    card.className = 'distribution-card';

    card.innerHTML = `
      <h3>${contributor.name}</h3>
      <p class="amount">${formatAED(contributor.amountInFils)}</p>
      <ul class="breakdown-list">
        ${this._formatBreakdownList(contributor.breakdown)}
      </ul>
      <div class="checkbox-line">
        <span>Received:</span>
        <span class="checkbox">[ ]</span>
      </div>
    `;

    return card;
  }
}
```

### Pattern 5: Print CSS
**What:** Hide UI chrome, optimize layout for paper
**When to use:** Any printable view
**Example:**
```css
/* In main.css */
@media print {
  /* Hide non-printable elements */
  .form-section,
  .menu-container,
  .storage-warning,
  .action-menu,
  button:not(.print-button) {
    display: none !important;
  }

  /* Show print-only elements */
  .print-only {
    display: block !important;
  }

  /* Optimize layout */
  .distribution-card {
    break-inside: avoid;
    border: 1px solid #000;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  /* Ensure backgrounds print */
  * {
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}

/* Hide print elements on screen */
.print-only {
  display: none;
}
```

### Anti-Patterns to Avoid
- **Separate print page:** Don't create a separate route/page for print view; use CSS media queries
- **Manual print button implementation:** Don't try to generate PDFs client-side; browser print is sufficient
- **Storing computed state:** Don't store "remaining notes" in state; calculate via selectors
- **Mutating contributor directly:** Always use Store.updateContributor() to ensure persistence

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Print layout engine | Custom PDF generation | CSS @media print + window.print() | Browser handles pagination, margins, printer selection |
| Checkbox styling | Custom toggle component | Native checkbox + CSS | Accessibility, keyboard support built-in |
| Print preview | Custom modal | Browser print preview | Native printer selection, scaling options |
| Progress calculation | Derived state in Store | Selector functions | Keeps state minimal, calculations always fresh |

## Common Pitfalls

### Pitfall 1: Schema Migration Breaking Existing Data
**What goes wrong:** Adding `received` field without migration causes undefined values for existing contributors
**Why it happens:** localStorage has existing data without the new field
**How to avoid:** Always provide default in migrateState; use `c.received ?? false`
**Warning signs:** Console warnings about undefined values; checkbox state inconsistent

### Pitfall 2: Print Styles Not Applied
**What goes wrong:** Print view shows UI chrome, navigation, buttons
**Why it happens:** @media print selectors not specific enough or missing !important
**How to avoid:** Test with browser print preview; use `display: none !important` for hidden elements
**Warning signs:** Print preview shows elements that should be hidden

### Pitfall 3: Checkbox State Out of Sync
**What goes wrong:** Checkbox appears checked but state shows unchecked (or vice versa)
**Why it happens:** Re-rendering component without preserving checkbox state; not using contributor.received value
**How to avoid:** Always render checkbox state from `contributor.received`; let Store subscription trigger re-render
**Warning signs:** Checkbox state flips unexpectedly on re-render

### Pitfall 4: Remaining Notes Calculation Stale
**What goes wrong:** Remaining notes display doesn't update when marking received
**Why it happens:** DistributionPanel not subscribed to store or selector not re-running
**How to avoid:** Ensure DistributionPanel subscribes to store like SummaryPanel; recalculate on every render
**Warning signs:** Numbers don't change when toggling received status

### Pitfall 5: Print View Missing Data
**What goes wrong:** Print view shows incomplete or outdated contributor list
**Why it happens:** Print view rendered once with stale data instead of reading from store at print time
**How to avoid:** Generate print view content dynamically when print is triggered; or use CSS to show/hide existing content
**Warning signs:** Print preview missing recently added contributors

## Code Examples

### Toggle Received Status in Store
```javascript
// In Store.js - optional convenience method
/**
 * Toggle received status for a contributor
 * @param {string} id - Contributor ID
 * @returns {Object|null} Updated contributor or null if not found
 */
toggleReceived(id) {
  const state = this.getState();
  const contributor = state.contributors.find(c => c.id === id);

  if (!contributor) return null;

  return this.updateContributor(id, { received: !contributor.received });
}
```

### CSS for Received Toggle
```css
/* In main.css */
.received-section {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-sm);
  padding-top: var(--spacing-sm);
  border-top: 1px solid var(--pico-muted-border-color);
}

.received-section input[type="checkbox"] {
  width: 1.25rem;
  height: 1.25rem;
  margin: 0;
  cursor: pointer;
}

.received-section label {
  margin: 0;
  cursor: pointer;
  user-select: none;
}

/* Visual indication when received */
.contributor-card.received {
  opacity: 0.7;
}

.contributor-card.received .contributor-name {
  text-decoration: line-through;
}
```

### Distribution Panel Component Structure
```javascript
// DistributionPanel.js - similar pattern to SummaryPanel
export class DistributionPanel {
  constructor(store) {
    this._store = store;
    this._element = null;
    this._unsubscribe = null;
  }

  render() {
    const state = this._store.getState();
    const remaining = calculateRemainingNotes(state.contributors);
    const progress = calculateDistributionProgress(state.contributors);

    this._element = document.createElement('aside');
    this._element.className = 'distribution-panel';

    // Progress section
    // Remaining notes table
    // Print button

    return this._element;
  }

  subscribe() {
    if (this._unsubscribe) return;
    this._unsubscribe = this._store.subscribe(() => {
      this._rerender();
    });
  }

  _rerender() {
    if (!this._element) return;
    const newElement = this.render();
    this._element.replaceWith(newElement);
    this._element = newElement;
  }
}
```

### Triggering Print
```javascript
// In AppContainer or DistributionPanel
_handlePrint() {
  // Optional: add print-mode class for any last-minute adjustments
  document.body.classList.add('printing');

  window.print();

  // Remove class after print dialog closes
  setTimeout(() => {
    document.body.classList.remove('printing');
  }, 100);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Print-specific pages/routes | CSS @media print | Always current | Simpler architecture, no routing needed |
| Custom toggle switches | Native checkboxes with CSS | 2020+ | Better accessibility, less code |
| PDF generation libraries | Browser print | Always | Zero dependencies, native printer support |
| Storing derived state | Selector functions | Phase 3 pattern | Single source of truth |

**Deprecated/outdated:**
- None for this phase - using modern, stable patterns

## Open Questions

1. **Should received status be editable in inline edit mode or only via checkbox?**
   - What we know: ContributorCard has inline edit mode for name/amount/breakdown
   - What's unclear: Whether received toggle should be available during inline edit
   - Recommendation: Keep received toggle always visible (outside edit mode) for quick access; it's a simple boolean that doesn't need edit mode protection

2. **Should print view include received status or be a "blank" checklist?**
   - What we know: DIST-03 asks for "what notes each person should receive"
   - What's unclear: Whether to show current received status or blank checkboxes
   - Recommendation: Show blank checkboxes in print view for physical marking; screen view shows actual status

3. **Should there be a "Mark All Received" or bulk action?**
   - What we know: Not explicitly required by DIST requirements
   - What's unclear: Whether users would want bulk operations
   - Recommendation: Defer to Phase 5 or user feedback; implement per-contributor first

## Validation Architecture

> Nyquist validation is enabled in config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | vite.config.js (implicit) |
| Quick run command | `npm test -- --reporter=dot` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DIST-01 | Toggle received status updates contributor | unit | `npm test -- Store.test.js` | Yes |
| DIST-01 | Checkbox reflects contributor.received | unit | `npm test -- ContributorCard.test.js` | Yes (needs extension) |
| DIST-02 | Remaining notes calculation | unit | `npm test -- selectors.test.js` | Yes (needs extension) |
| DIST-02 | Distribution panel updates on toggle | integration | `npm test -- DistributionPanel.test.js` | No - Wave 0 gap |
| DIST-03 | Print view renders all contributors | unit | `npm test -- DistributionPrintView.test.js` | No - Wave 0 gap |
| DIST-03 | Print CSS hides UI chrome | e2e/visual | Manual browser test | N/A |

### Sampling Rate
- **Per task commit:** `npm test -- --reporter=dot`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/DistributionPanel.test.js` - covers DIST-02 panel rendering
- [ ] `src/components/DistributionPrintView.test.js` - covers DIST-03 print view
- [ ] `src/modules/state/selectors.test.js` - extend for distribution selectors
- [ ] `src/components/ContributorCard.test.js` - extend for received toggle

## Sources

### Primary (HIGH confidence)
- `/src/modules/state/schema.js` - Existing schema patterns
- `/src/modules/state/Store.js` - Existing store patterns
- `/src/components/ContributorCard.js` - Component architecture reference
- `/src/components/SummaryPanel.js` - Panel component pattern
- `/src/styles/main.css` - Existing CSS patterns including @media print section

### Secondary (MEDIUM confidence)
- MDN: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/print - Print CSS reference
- MDN: https://developer.mozilla.org/en-US/docs/Web/API/Window/print - window.print() API
- Pico CSS docs: https://picocss.com/docs/forms - Checkbox styling

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - using existing project stack
- Architecture: HIGH - follows established patterns from Phases 1-3
- Pitfalls: HIGH - based on existing codebase patterns and common web dev issues

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days - stable patterns)
