# Phase 5: Data Management - Research

**Researched:** 2026-03-12
**Domain:** Client-side data export/import, file handling, CSS theming
**Confidence:** HIGH

## Summary

Phase 5 implements data portability (export/import JSON) and user experience customization (dark/light mode). Both features leverage existing infrastructure: the export/import builds on the established schema validation and SafeStorage patterns, while dark mode utilizes Pico CSS's built-in theming capabilities.

**Primary recommendation:** Use native browser File API for import, anchor element download for export, and Pico CSS's data-theme attribute for dark mode. Store theme preference in localStorage with the existing SafeStorage wrapper.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PERS-04 | User can export all data as a JSON file | Native download via `<a>` element with `download` attribute, Blob URL |
| PERS-05 | User can import data from a previously exported JSON file | File API with `<input type="file">`, FileReader for text parsing |
| UX-04 | App supports both light and dark color modes | Pico CSS `data-theme` attribute, localStorage persistence |

---

## Standard Stack

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Pico CSS | 2.x | Classless CSS framework | Already used, has built-in dark mode via `data-theme` |
| SafeStorage | Custom | localStorage wrapper with fallback | Existing pattern for persistence |
| Schema validation | Custom | State structure validation | Already validates contributor data, can validate imports |

### No Additional Dependencies Required
All functionality for Phase 5 can be implemented with native browser APIs:
- **File download:** `URL.createObjectURL()` + `<a download>`
- **File upload:** `<input type="file" accept=".json">` + `FileReader`
- **Theme switching:** `document.documentElement.setAttribute('data-theme', ...)`

---

## Architecture Patterns

### Pattern 1: JSON Export (File Download)
**What:** Trigger browser download of state as JSON file
**When to use:** User clicks "Export Data" button
**Example:**
```javascript
// Source: Native File API pattern
function exportToJSON(data, filename = 'eidiya-backup.json') {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json'
  });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}
```

### Pattern 2: JSON Import (File Upload)
**What:** Read user-selected file, parse JSON, validate against schema
**When to use:** User selects file via input or drag-and-drop
**Example:**
```javascript
// Source: Native FileReader API pattern
function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);
        resolve(data);
      } catch (error) {
        reject(new Error('Invalid JSON format'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
```

### Pattern 3: Theme Toggle with Persistence
**What:** Toggle between light/dark modes, persist preference
**When to use:** User clicks theme toggle button
**Example:**
```javascript
// Source: Pico CSS documentation pattern
const ThemeManager = {
  STORAGE_KEY: 'eidiya:theme',

  get() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored === 'dark' || stored === 'light') return stored;
    // Default to system preference
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
  },

  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(this.STORAGE_KEY, theme);
  },

  toggle() {
    const current = this.get();
    this.set(current === 'dark' ? 'light' : 'dark');
  },

  init() {
    this.set(this.get());
  }
};
```

### Pattern 4: Import Validation Flow
**What:** Multi-step validation before replacing state
**When to use:** Import file selected
**Flow:**
1. Parse JSON (catch syntax errors)
2. Validate against schema using existing `validateState()`
3. Check version compatibility
4. Confirm with user if data exists (merge vs replace)
5. Apply via `store.setState()`

### Anti-Patterns to Avoid
- **Direct state mutation on import:** Always use `store.setState()` for consistency
- **Silent import failures:** Always provide user feedback on validation errors
- **Theme flash on load:** Set theme before first paint (in `<head>` or early init)
- **Trusting imported data:** Always validate, even from "trusted" exports

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File download | Custom XHR/fetch logic | `URL.createObjectURL()` + `<a download>` | Native, works offline, no server needed |
| File reading | Custom binary parsing | `FileReader` API | Handles encoding, progress events, errors |
| Theme detection | Custom media query polling | `matchMedia('(prefers-color-scheme: dark)')` | Native, efficient, responds to system changes |
| JSON validation | Regex or manual parsing | `JSON.parse()` with try-catch | Native, handles all edge cases |
| CSS theme variables | Manual color swapping | Pico CSS `data-theme` attribute | Already integrated, accessible, tested |

**Key insight:** All Phase 5 features use well-established native browser APIs. Adding libraries would increase bundle size without adding capability.

---

## Common Pitfalls

### Pitfall 1: File Import Security
**What goes wrong:** Imported JSON could contain malicious data or prototype pollution
**Why it happens:** `JSON.parse()` doesn't validate structure, only syntax
**How to avoid:**
- Always validate against schema using existing `validateState()`
- Sanitize strings (though innerHTML is not used for contributor data)
- Never use `eval()` on imported data
- Check for unexpected keys before merging

### Pitfall 2: Theme Flash on Page Load
**What goes wrong:** Page renders in light mode then flashes to dark mode
**Why it happens:** Theme script runs after initial paint
**How to avoid:**
- Set `data-theme` attribute in HTML before CSS loads (inline script in `<head>`)
- Or use CSS `color-scheme` media query as fallback

### Pitfall 3: Blob URL Memory Leaks
**What goes wrong:** Repeated exports without revoking URLs exhausts memory
**Why it happens:** `URL.createObjectURL()` creates references that persist
**How to avoid:** Always call `URL.revokeObjectURL(url)` after download starts

### Pitfall 4: Import Overwriting Unsaved Data
**What goes wrong:** User accidentally imports, losing current work
**Why it happens:** No confirmation before state replacement
**How to avoid:**
- Show confirmation dialog if contributors exist
- Offer "Merge" vs "Replace" options, or just warn and require explicit confirm

### Pitfall 5: Large File Handling
**What goes wrong:** Very large imports block the main thread
**Why it happens:** FileReader and JSON.parse are synchronous
**How to avoid:**
- For this app: not a concern (data is small - max ~100 contributors = ~50KB)
- For larger apps: use Web Workers

---

## Code Examples

### Export Component Pattern
```javascript
// src/components/DataManager.js - Export functionality
export class DataManager {
  constructor(store) {
    this._store = store;
  }

  exportData() {
    const state = this._store.getState();
    const exportData = {
      ...state,
      exportedAt: new Date().toISOString(),
      appVersion: '1.0.0'
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    const filename = `eidiya-backup-${new Date().toISOString().split('T')[0]}.json`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return { success: true };
  }
}
```

### Import with Validation Pattern
```javascript
// Import with full validation
async importData(file) {
  // Step 1: Read file
  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });

  // Step 2: Parse JSON
  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    return { success: false, error: 'Invalid JSON format' };
  }

  // Step 3: Validate against schema (using existing validation)
  const validation = validateState(data);
  if (!validation.valid) {
    return { success: false, error: `Invalid data: ${validation.error}` };
  }

  // Step 4: Migrate to current version
  const migrated = migrateState(data);

  // Step 5: Apply to store
  this._store.setState(migrated);

  return { success: true };
}
```

### Theme Toggle Component
```javascript
// src/components/ThemeToggle.js
export class ThemeToggle {
  constructor() {
    this._button = null;
  }

  render() {
    const button = document.createElement('button');
    button.className = 'theme-toggle';
    button.setAttribute('aria-label', 'Toggle dark mode');
    button.innerHTML = this._getIcon();

    button.addEventListener('click', () => {
      ThemeManager.toggle();
      button.innerHTML = this._getIcon();
    });

    this._button = button;
    return button;
  }

  _getIcon() {
    return ThemeManager.get() === 'dark' ? '☀️' : '🌙';
  }
}
```

### CSS for Theme Toggle Button
```css
/* src/styles/main.css - Theme toggle styles */
.theme-toggle {
  position: fixed;
  top: var(--spacing-md);
  right: var(--spacing-md);
  background: var(--pico-card-background-color);
  border: 1px solid var(--pico-muted-border-color);
  border-radius: var(--pico-border-radius);
  padding: var(--spacing-sm);
  cursor: pointer;
  font-size: 1.25rem;
  z-index: 1000;
  box-shadow: var(--pico-card-box-shadow);
}

.theme-toggle:hover {
  background: var(--pico-muted-border-color);
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `window.showModalDialog()` for file operations | Native File API | 2015+ | Better UX, no deprecated APIs |
| Manual cookie-based theme storage | localStorage + matchMedia | 2018+ | Simpler API, larger storage |
| Custom dark mode CSS | `prefers-color-scheme` media query | 2019+ | Respects system preference |
| Flash-based file operations | Native File API | 2020+ | No plugins needed |

**Deprecated/outdated:**
- `window.showModalDialog()`: Removed from modern browsers
- `document.execCommand('copy')`: Replaced by Clipboard API (not needed for downloads)
- Synchronous `localStorage` access in render: Can cause layout thrashing (not an issue here)

---

## Open Questions

1. **Import Strategy: Replace vs Merge?**
   - What we know: Current store only supports one dataset
   - What's unclear: Should import replace entirely or offer merge?
   - Recommendation: Replace with confirmation (simpler, matches current model)

2. **Export Filename Format?**
   - What we know: Should include date for organization
   - What's unclear: Include time or just date?
   - Recommendation: `eidiya-backup-YYYY-MM-DD.json` (date only, cleaner)

3. **Theme Toggle Placement?**
   - What we know: Should be accessible but not intrusive
   - What's unclear: Header, fixed position, or settings panel?
   - Recommendation: Fixed position top-right (common pattern, always accessible)

---

## Validation Architecture

> nyquist_validation is enabled in config.json

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.0.18 |
| Config file | `vite.config.js` (implicit) |
| Quick run command | `npm test` |
| Full suite command | `npm test` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PERS-04 | Export generates valid JSON file | unit | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-04 | Export filename includes date | unit | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-05 | Import parses valid JSON | unit | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-05 | Import rejects invalid JSON | unit | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-05 | Import validates against schema | unit | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-05 | Import shows success feedback | integration | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| PERS-05 | Import shows error feedback | integration | `npm test -- DataManager.test.js` | ❌ Wave 0 |
| UX-04 | Theme toggle switches modes | unit | `npm test -- ThemeManager.test.js` | ❌ Wave 0 |
| UX-04 | Theme preference persists | unit | `npm test -- ThemeManager.test.js` | ❌ Wave 0 |
| UX-04 | Theme respects system preference | unit | `npm test -- ThemeManager.test.js` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm test -- <component>.test.js -x`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/components/DataManager.test.js` — covers PERS-04, PERS-05
- [ ] `src/modules/theme/ThemeManager.test.js` — covers UX-04
- [ ] `src/modules/theme/ThemeManager.js` — theme management module
- [ ] `src/components/ThemeToggle.test.js` — theme toggle component

---

## Sources

### Primary (HIGH confidence)
- Pico CSS 2.x documentation - `data-theme` attribute theming
- MDN File API - Blob, FileReader, URL.createObjectURL
- Project codebase - SafeStorage, schema validation, Store patterns

### Secondary (MEDIUM confidence)
- Web platform standards - File API stability and browser support
- Pico CSS source - CSS custom properties for theming

### Tertiary (LOW confidence)
- None - all features use well-established native APIs

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Uses existing Pico CSS and native APIs
- Architecture: HIGH - Patterns are well-established in codebase
- Pitfalls: HIGH - Common issues well-documented in web dev community

**Research date:** 2026-03-12
**Valid until:** 2026-06-12 (stable APIs, unlikely to change)

---

## Implementation Notes for Planner

### Component Structure
```
src/
├── components/
│   ├── DataManager.js          # Export/import UI component
│   ├── DataManager.test.js     # Component tests
│   ├── ThemeToggle.js          # Theme toggle button
│   └── ThemeToggle.test.js     # Component tests
├── modules/
│   └── theme/
│       ├── ThemeManager.js     # Theme state management
│       └── ThemeManager.test.js # Unit tests
```

### Integration Points
1. **AppContainer.js**: Add DataManager and ThemeToggle to render pipeline
2. **index.html**: Add early theme initialization script to prevent flash
3. **main.css**: Add theme toggle button styles

### Data Flow for Import
```
User selects file → FileReader → JSON.parse → validateState → migrateState → store.setState → UI re-render
```

### Data Flow for Export
```
store.getState() → add metadata → JSON.stringify → Blob → URL.createObjectURL → <a download> click
```
