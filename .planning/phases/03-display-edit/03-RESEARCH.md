# Phase 3: Display & Edit - Research

**Researched:** 2026-03-12
**Domain:** Vanilla JavaScript UI Components, State Management, Responsive Layouts
**Confidence:** HIGH

## Summary

Phase 3 implements the summary dashboard and contributor management (edit/delete) features. The existing codebase provides a solid foundation: Store has `addContributor()` that serves as a pattern for new `updateContributor()` and `deleteContributor()` methods; `AppContainer._renderContributorCard()` can be extended with edit/delete actions; `ContributorForm` has validation patterns that can be adapted for inline editing.

The key technical challenges are: (1) implementing inline editing without full re-renders disrupting focus, (2) calculating aggregated denomination totals efficiently, (3) managing edit state (which contributor is being edited, dimming others), and (4) providing visual feedback for actions.

**Primary recommendation:** Use a hybrid approach where the Summary component subscribes to Store for live updates, inline editing is handled via DOM manipulation within the card (not full re-render), and delete confirmation uses a lightweight modal pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Summary Dashboard Layout:** Sticky sidebar on desktop, top card on mobile (responsive layout)
- **Summary Format:** Simple table showing Denomination | Count | Subtotal
- **Summary Updates:** Live updates with subtle animation/flash when values change
- **Additional Summary Info:** Show contributor count and total notes count alongside grand total
- **Edit Interaction Pattern:** Inline editing — click any field in contributor card to edit directly
- **Edit Visual Focus:** Dim/gray out other contributors when one is being edited
- **Edit Save Behavior:** Auto-save on field blur, no explicit Cancel button
- **Edit Validation:** Same as add form — blur validation with inline errors
- **Delete Confirmation Style:** Claude to decide best approach (modal vs inline vs other)
- **Delete Recovery:** No recovery — deleted contributors are gone forever
- **Delete Details:** Full details in confirmation — "Delete Ahmed with 500 AED (5×100)?"
- **Delete Access:** Delete action in dropdown/menu (not always visible)
- **Visual Feedback Style:** Inline status in card (e.g., "Saved" / "Deleted") — different from Phase 2's no-feedback approach
- **Visual Feedback Duration:** 2 seconds brief acknowledgment
- **Visual Feedback Errors:** Claude to decide appropriate treatment
- **Visual Feedback Animation:** Claude to decide appropriate motion for appearing/disappearing

### Claude's Discretion
- Exact table styling and responsive breakpoint for sidebar
- Toast vs inline error treatment for validation failures
- Animation specifics for live update flash
- Exact "..." menu icon and positioning
- Soft transitions vs instant changes for card states

### Deferred Ideas (OUT OF SCOPE)
- Marking contributors as "received" — Phase 4 (Distribution)
- Per-person printable distribution list — Phase 4 (DIST-03)
- Undo for deletes — noted but not implemented (no recovery decision)
- Bulk edit operations — future enhancement, not in scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CONT-03 | User can edit existing contributor details | Inline editing pattern with DOM manipulation; blur validation reuse from ContributorForm |
| CONT-04 | User can delete a contributor | Store.deleteContributor() method; confirmation modal pattern; menu/dropdown UI |
| SUM-01 | System calculates total notes needed from bank per denomination | Aggregation function summing breakdown across all contributors; derived state pattern |
| SUM-02 | System displays grand total of all contributions | Simple reduce() on contributors array; formatAED() for display |
| SUM-03 | System updates totals automatically when contributors change | Store subscription pattern already established; Summary component as subscriber |
| UX-03 | App provides clear visual feedback for all actions | Inline status badges with CSS transitions; 2s timeout for removal |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Vanilla JavaScript (ES2022+) | Native | Component logic | Established project pattern; no framework overhead |
| Pico CSS 2.x | CDN | Base styling | Already integrated; automatic dark mode; classless semantic HTML |
| Custom CSS | Project | App-specific styling | main.css already has component patterns |
| Web Crypto API | Native | UUID generation | Already used via `crypto.randomUUID()` |

### Supporting
| Pattern | Purpose | When to Use |
|---------|---------|-------------|
| CSS Grid/Flexbox | Responsive layout | Summary sidebar vs top card |
| CSS Custom Properties | Theming | Consistent with existing --pico-* variables |
| CSS Transitions | Visual feedback | Status badges, flash animations |
| Event Delegation | Card actions | Edit/delete buttons on dynamically rendered cards |

### No Additional Dependencies Required
All functionality can be implemented with existing stack. No need for:
- Modal libraries (native `<dialog>` element or simple div overlay)
- Animation libraries (CSS transitions sufficient)
- Chart libraries (simple table adequate for denomination breakdown)

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── AppContainer.js        # Extended with summary integration
│   ├── ContributorForm.js     # Existing - validation patterns to reuse
│   ├── SummaryPanel.js        # NEW - Summary dashboard component
│   ├── ContributorCard.js     # NEW - Extracted card with edit/delete
│   └── DeleteConfirmation.js  # NEW - Modal/confirmation component
├── modules/
│   ├── state/
│   │   ├── Store.js           # Extended with update/delete actions
│   │   └── selectors.js       # NEW - Derived state (totals, aggregations)
│   └── validation/
│       └── contributor.js     # Existing - reuse for edit validation
```

### Pattern 1: Store Actions for Update/Delete
**What:** Follow existing `addContributor()` pattern for new actions
**When to use:** All state mutations go through Store
**Example:**
```javascript
// Store.js - add these methods

/**
 * Update an existing contributor
 * @param {string} id - Contributor ID
 * @param {Object} updates - Partial contributor data to update
 * @returns {Object|null} Updated contributor or null if not found
 */
updateContributor(id, updates) {
  const state = this.getState();
  const index = state.contributors.findIndex(c => c.id === id);

  if (index === -1) return null;

  const updated = {
    ...state.contributors[index],
    ...updates,
    id // Preserve ID
  };

  const newContributors = [...state.contributors];
  newContributors[index] = updated;

  this.setState({ contributors: newContributors });
  return updated;
}

/**
 * Delete a contributor by ID
 * @param {string} id - Contributor ID
 * @returns {boolean} True if deleted, false if not found
 */
deleteContributor(id) {
  const state = this.getState();
  const index = state.contributors.findIndex(c => c.id === id);

  if (index === -1) return false;

  const newContributors = state.contributors.filter(c => c.id !== id);
  this.setState({ contributors: newContributors });
  return true;
}
```

### Pattern 2: Derived State Selectors
**What:** Pure functions to calculate aggregated data from state
**When to use:** Any computed/aggregated data (totals, counts)
**Example:**
```javascript
// modules/state/selectors.js

/**
 * Calculate bank notes needed per denomination
 * @param {Contributor[]} contributors
 * @returns {Object} Denomination counts
 */
export function calculateBankNotes(contributors) {
  const notes = {
    five: 0, ten: 0, twenty: 0, fifty: 0,
    hundred: 0, twoHundred: 0, fiveHundred: 0, thousand: 0
  };

  for (const c of contributors) {
    for (const key of Object.keys(notes)) {
      notes[key] += c.breakdown[key] || 0;
    }
  }

  return notes;
}

/**
 * Calculate summary statistics
 * @param {Contributor[]} contributors
 * @returns {Object} Grand total, contributor count, total notes
 */
export function calculateSummary(contributors) {
  const grandTotalFils = contributors.reduce((sum, c) => sum + c.amountInFils, 0);
  const notes = calculateBankNotes(contributors);
  const totalNotes = Object.values(notes).reduce((sum, count) => sum + count, 0);

  return {
    grandTotalFils,
    contributorCount: contributors.length,
    totalNotes,
    notes
  };
}
```

### Pattern 3: Inline Editing with Focus Preservation
**What:** Edit fields in-place without full component re-render
**When to use:** Contributor card editing
**Key insight:** Full re-render via Store subscription would lose focus; use direct DOM manipulation during edit mode
**Example:**
```javascript
// ContributorCard.js - inline editing pattern

_enterEditMode(fieldName) {
  // Prevent multiple simultaneous edits
  if (this._isEditing) return;
  this._isEditing = true;

  // Notify parent to dim other cards
  this._onEditStart(this._contributor.id);

  // Replace text with input
  const fieldEl = this._element.querySelector(`[data-field="${fieldName}"]`);
  const currentValue = this._getFieldValue(fieldName);

  const input = document.createElement('input');
  input.type = this._getInputType(fieldName);
  input.value = currentValue;
  input.className = 'inline-edit-input';

  // Replace in DOM
  fieldEl.innerHTML = '';
  fieldEl.appendChild(input);
  input.focus();

  // Blur handler for auto-save
  input.addEventListener('blur', () => this._saveEdit(fieldName, input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur(); // Trigger save
  });
}

_saveEdit(fieldName, value) {
  // Validate
  const validation = this._validateField(fieldName, value);
  if (!validation.valid) {
    // Show inline error, don't exit edit mode
    this._showFieldError(fieldName, validation.error);
    return;
  }

  // Dispatch to store
  const updates = this._buildUpdateObject(fieldName, value);
  this._onUpdate(this._contributor.id, updates);

  // Exit edit mode
  this._isEditing = false;
  this._onEditEnd();

  // Show success feedback
  this._showStatus('Saved');
}
```

### Pattern 4: Delete Confirmation Modal
**What:** Lightweight modal using native `<dialog>` or overlay div
**When to use:** Destructive actions requiring confirmation
**Recommendation:** Use native `<dialog>` element (modern, accessible, handles focus trap)
**Example:**
```javascript
// DeleteConfirmation.js

export class DeleteConfirmation {
  constructor(onConfirm, onCancel) {
    this._onConfirm = onConfirm;
    this._onCancel = onCancel;
    this._dialog = null;
  }

  show(contributor) {
    this._dialog = document.createElement('dialog');
    this._dialog.className = 'delete-confirmation';

    // Build confirmation message with full details
    const notes = this._formatNotes(contributor.breakdown);
    const amount = formatAED(contributor.amountInFils);

    this._dialog.innerHTML = `
      <article>
        <header>
          <h3>Delete Contributor?</h3>
        </header>
        <p>Delete <strong>${contributor.name}</strong> with ${amount}?</p>
        <p><small>${notes}</small></p>
        <footer>
          <button class="secondary" data-action="cancel">Cancel</button>
          <button class="contrast" data-action="confirm">Delete</button>
        </footer>
      </article>
    `;

    document.body.appendChild(this._dialog);

    // Event listeners
    this._dialog.querySelector('[data-action="cancel"]')
      .addEventListener('click', () => this._cancel());
    this._dialog.querySelector('[data-action="confirm"]')
      .addEventListener('click', () => this._confirm(contributor.id));

    // Close on backdrop click
    this._dialog.addEventListener('click', (e) => {
      if (e.target === this._dialog) this._cancel();
    });

    this._dialog.showModal();
  }

  _confirm(id) {
    this._onConfirm(id);
    this._close();
  }

  _cancel() {
    this._onCancel();
    this._close();
  }

  _close() {
    if (this._dialog) {
      this._dialog.close();
      this._dialog.remove();
      this._dialog = null;
    }
  }
}
```

### Pattern 5: Visual Feedback (Status Badges)
**What:** Brief inline status indicators with auto-dismiss
**When to use:** After successful save, delete, or error
**Example:**
```javascript
_showStatus(message, type = 'success') {
  // Remove existing status
  this._clearStatus();

  const badge = document.createElement('span');
  badge.className = `status-badge ${type}`;
  badge.textContent = message;
  badge.setAttribute('role', 'status');
  badge.setAttribute('aria-live', 'polite');

  this._element.querySelector('header').appendChild(badge);

  // Auto-remove after 2 seconds
  this._statusTimeout = setTimeout(() => this._clearStatus(), 2000);
}

_clearStatus() {
  if (this._statusTimeout) {
    clearTimeout(this._statusTimeout);
    this._statusTimeout = null;
  }
  const existing = this._element?.querySelector('.status-badge');
  if (existing) existing.remove();
}
```

### Anti-Patterns to Avoid
- **Full re-render during edit:** Store subscription re-rendering entire list would lose focus and edit state
- **Synchronous validation on every keystroke:** Use blur validation as established in ContributorForm
- **Multiple simultaneous edits:** Lock to single contributor edit at a time
- **Auto-save without validation:** Always validate before dispatching to Store
- **Modal without focus management:** Use `<dialog>` or implement focus trap manually

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialog | Custom overlay div with z-index | Native `<dialog>` element | Built-in focus trap, backdrop click handling, accessibility |
| UUID generation | Math.random() based IDs | `crypto.randomUUID()` | Already used in codebase, cryptographically secure |
| Currency formatting | Custom toFixed() logic | `formatAED()` from formatters.js | Proper localization, already implemented |
| Form validation | Inline validation logic | `validateContributorForm()` | Already implemented, consistent behavior |
| State aggregation | Manual reduce() everywhere | Selector functions in selectors.js | Testable, reusable, memoization opportunity |

**Key insight:** The project already has validation, formatting, and state patterns. Reuse them rather than creating parallel implementations.

## Common Pitfalls

### Pitfall 1: Lost Focus on Re-render
**What goes wrong:** When Store updates, AppContainer re-renders entire list, losing focus on inline edit field
**Why it happens:** Store subscription triggers `AppContainer.render()` which replaces all DOM content
**How to avoid:**
- Track edit state in ContributorCard (not Store)
- During edit mode, don't re-render that card from props
- Or: use direct DOM manipulation for inline editing, bypass React-like re-render cycle
**Warning signs:** Input field loses focus immediately after typing or on first blur

### Pitfall 2: Stale Data in Edit Fields
**What goes wrong:** Editing one field shows old values for other fields
**Why it happens:** Not syncing local edit state with Store state
**How to avoid:** Always read current values from DOM or Store before building update object
**Warning signs:** Changes to one field overwrite recent changes to another field

### Pitfall 3: Race Condition on Rapid Edits
**What goes wrong:** Rapidly editing multiple fields creates conflicting updates
**Why it happens:** Each blur triggers async Store update and re-render
**How to avoid:** Lock to single field edit at a time; disable other fields during edit
**Warning signs:** Intermittent data loss or "jumping" values

### Pitfall 4: Summary Flash Animation on Every Keystroke
**What goes wrong:** Denomination counts flash/animate too frequently
**Why it happens:** Store updates on every edit, triggering animation
**How to avoid:** Debounce or only animate on significant changes; use CSS animation classes added/removed via JS
**Warning signs:** Distracting constant flashing during data entry

### Pitfall 5: Delete Confirmation Dismissed Accidentally
**What goes wrong:** User clicks outside modal or presses Escape, delete is cancelled but no feedback given
**Why it happens:** Cancel looks identical to no-action
**How to avoid:** Always provide feedback: either "Delete cancelled" or ensure confirmation requires explicit action
**Warning signs:** Users report "delete didn't work" when they accidentally dismissed

## Code Examples

### Summary Panel Component
```javascript
// components/SummaryPanel.js

import { formatAED } from '@modules/money/formatters.js';
import { calculateSummary } from '@modules/state/selectors.js';

export class SummaryPanel {
  constructor(store) {
    this._store = store;
    this._element = null;
    this._previousSummary = null;
  }

  render() {
    const state = this._store.getState();
    const summary = calculateSummary(state.contributors);

    this._element = document.createElement('aside');
    this._element.className = 'summary-panel';

    // Header with grand total
    const header = document.createElement('header');
    header.innerHTML = `
      <h2>Bank Summary</h2>
      <p class="grand-total">${formatAED(summary.grandTotalFils)}</p>
      <small>${summary.contributorCount} contributors · ${summary.totalNotes} notes</small>
    `;
    this._element.appendChild(header);

    // Denomination table
    const table = document.createElement('table');
    table.className = 'denomination-table';
    table.innerHTML = `
      <thead>
        <tr>
          <th>Note</th>
          <th>Count</th>
          <th>Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${this._renderTableRows(summary.notes)}
      </tbody>
    `;
    this._element.appendChild(table);

    // Trigger flash animation if values changed
    if (this._previousSummary &&
        this._previousSummary.grandTotalFils !== summary.grandTotalFils) {
      this._flashUpdate();
    }
    this._previousSummary = summary;

    return this._element;
  }

  _renderTableRows(notes) {
    const denominations = [
      { key: 'thousand', value: 1000 },
      { key: 'fiveHundred', value: 500 },
      { key: 'twoHundred', value: 200 },
      { key: 'hundred', value: 100 },
      { key: 'fifty', value: 50 },
      { key: 'twenty', value: 20 },
      { key: 'ten', value: 10 },
      { key: 'five', value: 5 },
    ];

    return denominations
      .filter(d => notes[d.key] > 0)
      .map(d => {
        const count = notes[d.key];
        const subtotal = count * d.value * 100; // in fils
        return `
          <tr data-denomination="${d.key}">
            <td>${d.value} AED</td>
            <td>${count}</td>
            <td>${formatAED(subtotal)}</td>
          </tr>
        `;
      })
      .join('');
  }

  _flashUpdate() {
    this._element?.classList.add('updated');
    setTimeout(() => {
      this._element?.classList.remove('updated');
    }, 300);
  }
}
```

### Responsive Layout CSS
```css
/* main.css - Summary panel responsive layout */

/* Mobile: Summary as top card */
.summary-panel {
  background: var(--pico-card-background-color);
  border-radius: var(--pico-border-radius);
  padding: var(--pico-spacing);
  margin-bottom: var(--pico-spacing);
}

.summary-panel .grand-total {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--pico-primary);
  margin: 0;
}

.summary-panel.updated {
  animation: flash-update 0.3s ease;
}

@keyframes flash-update {
  0%, 100% { background: var(--pico-card-background-color); }
  50% { background: var(--pico-primary-focus); }
}

/* Denomination table */
.denomination-table {
  width: 100%;
  margin-top: var(--spacing-md);
}

.denomination-table th,
.denomination-table td {
  text-align: left;
  padding: var(--spacing-xs) var(--spacing-sm);
}

.denomination-table td:last-child {
  text-align: right;
}

/* Desktop: Sticky sidebar */
@media (min-width: 1024px) {
  .app-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: var(--pico-spacing);
    align-items: start;
  }

  .summary-panel {
    position: sticky;
    top: var(--pico-spacing);
  }
}
```

### Contributor Card with Menu
```javascript
// components/ContributorCard.js - menu integration

_renderActions() {
  const actions = document.createElement('div');
  actions.className = 'card-actions';

  // Three-dot menu button
  const menuBtn = document.createElement('button');
  menuBtn.type = 'button';
  menuBtn.className = 'menu-button';
  menuBtn.innerHTML = '&#x22EE;'; // Vertical ellipsis
  menuBtn.setAttribute('aria-label', 'Actions');

  // Dropdown menu
  const menu = document.createElement('div');
  menu.className = 'action-menu';
  menu.hidden = true;

  menu.innerHTML = `
    <button data-action="edit">Edit</button>
    <button data-action="delete" class="contrast">Delete</button>
  `;

  // Toggle menu
  menuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.hidden = !menu.hidden;
  });

  // Menu actions
  menu.querySelector('[data-action="edit"]')
    .addEventListener('click', () => {
      menu.hidden = true;
      this._enterEditMode();
    });

  menu.querySelector('[data-action="delete"]')
    .addEventListener('click', () => {
      menu.hidden = true;
      this._onDeleteRequest(this._contributor);
    });

  // Close menu on outside click
  document.addEventListener('click', () => {
    menu.hidden = true;
  }, { once: true });

  actions.appendChild(menuBtn);
  actions.appendChild(menu);

  return actions;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| jQuery-style DOM manipulation | Class-based components with `_render` helpers | Phase 1-2 | Consistent pattern, testable |
| Manual event attachment | Event delegation for dynamic content | Phase 2 | Fewer listeners, handles re-render |
| Global state mutations | Store pattern with subscriptions | Phase 1 | Predictable updates, auto-persistence |
| Inline styles | CSS custom properties + classes | Phase 1 | Theming, maintainable |

**Deprecated/outdated:**
- None for this phase — all patterns are current

## Open Questions

1. **Edit mode state synchronization**
   - What we know: Need to prevent Store re-render from disrupting edit
   - What's unclear: Whether to unsubscribe during edit or use local state
   - Recommendation: Track `isEditing` in ContributorCard; parent AppContainer skips re-rendering that card

2. **Validation error display during inline edit**
   - What we know: Same validation as ContributorForm
   - What's unclear: Whether to show errors inline or use toast
   - Recommendation: Inline errors per field (consistent with form), block save until valid

3. **Delete confirmation dismissal behavior**
   - What we know: Modal should be dismissible
   - What's unclear: Whether Escape/backdrop click cancels or confirms
   - Recommendation: Both cancel delete; only explicit "Delete" button confirms

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (bundled with Vite) |
| Config file | `vite.config.js` |
| Quick run command | `npm test` |
| Full suite command | `npm run test:ui` (if configured) or `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONT-03 | Edit contributor updates state | unit | `npm test -- Store.test.js` | ✅ |
| CONT-03 | Inline edit validation works | unit | `npm test -- contributor.test.js` | ✅ |
| CONT-04 | Delete removes contributor | unit | `npm test -- Store.test.js` | ❌ Wave 0 |
| CONT-04 | Delete confirmation shows | integration | Manual or E2E | ❌ Wave 0 |
| SUM-01 | Bank notes calculation correct | unit | `npm test -- selectors.test.js` | ❌ Wave 0 |
| SUM-02 | Grand total calculation correct | unit | `npm test -- selectors.test.js` | ❌ Wave 0 |
| SUM-03 | Summary updates on state change | integration | `npm test -- SummaryPanel.test.js` | ❌ Wave 0 |
| UX-03 | Status badges appear/disappear | unit | `npm test -- ContributorCard.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- <relevant-file>.test.js -t "<test-name>"`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/modules/state/selectors.js` — needs creation with tests
- [ ] `src/modules/state/selectors.test.js` — covers SUM-01, SUM-02
- [ ] `src/components/SummaryPanel.test.js` — covers SUM-03
- [ ] `src/components/ContributorCard.test.js` — covers CONT-03, UX-03
- [ ] `src/components/DeleteConfirmation.test.js` — covers CONT-04
- [ ] Extend `Store.test.js` — add updateContributor, deleteContributor tests

## Sources

### Primary (HIGH confidence)
- `/src/modules/state/Store.js` — Existing store pattern, addContributor implementation
- `/src/components/AppContainer.js` — Current rendering pattern
- `/src/components/ContributorForm.js` — Validation pattern to reuse
- `/src/modules/validation/contributor.js` — Validation functions
- `03-CONTEXT.md` — User decisions and constraints

### Secondary (MEDIUM confidence)
- Pico CSS documentation — Table styling, dialog patterns
- MDN `<dialog>` element — Native modal implementation
- Web Crypto API — UUID generation pattern (already in use)

### Tertiary (LOW confidence)
- None — all patterns derived from existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all from existing codebase
- Architecture: HIGH — extends established patterns
- Pitfalls: MEDIUM-HIGH — based on common vanilla JS patterns, no external verification needed

**Research date:** 2026-03-12
**Valid until:** 2026-04-12 (30 days — stable vanilla JS patterns)

---

## RESEARCH COMPLETE

**Phase:** 03 - Display & Edit
**Confidence:** HIGH

### Key Findings
1. **Store needs two new methods:** `updateContributor(id, updates)` and `deleteContributor(id)` following the existing `addContributor()` pattern
2. **Inline editing requires focus preservation:** Cannot use full Store-driven re-render during edit mode; use local DOM state
3. **Summary aggregation:** Simple selector functions can calculate denomination totals; subscribe to Store for live updates
4. **Delete confirmation:** Native `<dialog>` element is best choice — accessible, handles focus trap, no dependencies
5. **Visual feedback:** CSS transitions with 2s auto-dismiss for status badges

### File Created
`/mnt/c/Users/force/.projects/eidiya/.planning/phases/03-display-edit/03-RESEARCH.md`

### Confidence Assessment
| Area | Level | Reason |
|------|-------|--------|
| Standard Stack | HIGH | All from existing codebase |
| Architecture | HIGH | Extends established patterns |
| Pitfalls | HIGH | Common vanilla JS issues well-documented |

### Open Questions
1. Edit mode state synchronization — resolved with local card state approach
2. Validation error display — resolved with inline per-field errors
3. Delete confirmation dismissal — resolved with cancel-on-dismiss

### Ready for Planning
Research complete. Planner can now create PLAN.md files.
