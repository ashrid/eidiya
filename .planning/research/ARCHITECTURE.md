# Architecture Patterns: Eidiya Money Tracking App

**Domain:** Client-side single-user money tracking web app
**Researched:** 2026-03-11
**Overall Confidence:** HIGH

## Recommended Architecture

Eidiya is a **client-side only, single-user application** with no backend requirements. The architecture follows a **layered component pattern** with clear separation between data, state, and presentation layers.

```
┌─────────────────────────────────────────────────────────────┐
│                      PRESENTATION LAYER                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  Form View  │  │ Summary View│  │ Distribution View   │  │
│  │  (Inputs)   │  │ (Dashboard) │  │ (Printable Lists)   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         └─────────────────┴────────────────────┘            │
│                         │                                    │
│                    UI Components                             │
│         (Currency Input, Note Breakdown, Tables)             │
└─────────────────────────┬────────────────────────────────────┘
                          │ Events / Actions
┌─────────────────────────┼────────────────────────────────────┐
│                      STATE LAYER                             │
│  ┌────────────────────────────────────────────────────────┐  │
│  │              Store (Single Source of Truth)             │  │
│  │  • Contributors array                                   │  │
│  │  • Calculated totals (notes needed, distributed)        │  │
│  │  • UI state (current view, selected contributor)        │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│                    Validation Engine                         │
│              (Note breakdown sum verification)               │
└───────────────────────────┼──────────────────────────────────┘
                            │
┌───────────────────────────┼──────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌────────────────────────┴───────────────────────────────┐  │
│  │              localStorage Persistence                   │  │
│  │  • Auto-save on every state change                      │  │
│  │  • Hydrate on app startup                               │  │
│  │  • JSON serialization                                   │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

## Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **Store** | Central state management, data integrity | All UI components, Persistence layer |
| **Form View** | Add/edit contributor data, note breakdown inputs | Store (write), Validation Engine |
| **Summary View** | Display totals, bank notes needed, distribution status | Store (read) |
| **Distribution View** | Per-person printable lists, mark as distributed | Store (read/write) |
| **Validation Engine** | Verify note breakdowns sum to contribution | Form View, Store |
| **Calculation Engine** | Aggregate notes needed, remaining to distribute | Store, Summary View |
| **Persistence Layer** | localStorage read/write, data migration | Store only |
| **Currency/Note Components** | AED-specific inputs, denomination handling | Form View |

## Data Flow

### Unidirectional Data Flow Pattern

```
User Action → Event Handler → Store Update → Re-render → Persistence
```

**Example: Adding a Contributor**

1. User fills form (name, amount, note breakdown)
2. Form View validates inputs client-side (required fields, numbers)
3. Validation Engine verifies: sum of (notes × denomination) = total amount
4. Form View dispatches `ADD_CONTRIBUTOR` action to Store
5. Store updates contributors array immutably
6. Calculation Engine recomputes derived state (totals)
7. Store notifies subscribed views (Summary, Distribution)
8. Views re-render with new data
9. Persistence Layer auto-saves to localStorage

**Example: Marking Distribution Complete**

1. User clicks "Mark as Distributed" in Distribution View
2. Distribution View dispatches `UPDATE_CONTRIBUTOR` action
3. Store updates contributor's `isDistributed` flag
4. Summary View re-renders (progress indicator updates)
5. Persistence Layer saves

### Data Flow Diagram

```
                    ┌──────────────┐
                    │   User Input  │
                    └──────┬───────┘
                           │
                    ┌──────▼───────┐
                    │  Form View    │
                    │  Validation   │
                    └──────┬───────┘
                           │ ADD_CONTRIBUTOR
                    ┌──────▼───────┐
         ┌─────────►│     Store     │◄────────┐
         │          │  (State Mgmt) │         │
         │          └──────┬───────┘         │
         │                 │                  │
    ┌────┴────┐       ┌────┴────┐       ┌────┴────┐
    │Summary  │       │Calculate│       │Persist  │
    │  View   │◄──────│ Engine  │       │ Layer   │
    └────┬────┘       └─────────┘       └────┬────┘
         │                                    │
         │         ┌──────────────┐           │
         └────────►│ localStorage │◄──────────┘
                   └──────────────┘
```

## Data Model

### Core Entities

```typescript
// Contributor (Primary Entity)
interface Contributor {
  id: string;                    // UUID for stable references
  name: string;                  // Family member name
  amount: number;                // Total AED contributed
  breakdown: NoteBreakdown;      // Denomination preferences
  isDistributed: boolean;        // Has received their notes
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
}

// Note Breakdown (Embedded in Contributor)
interface NoteBreakdown {
  5: number;     // Count of 5 AED notes
  10: number;    // Count of 10 AED notes
  20: number;    // Count of 20 AED notes
  50: number;    // Count of 50 AED notes
  100: number;   // Count of 100 AED notes
  200: number;   // Count of 200 AED notes
  500: number;   // Count of 500 AED notes
  1000: number;  // Count of 1000 AED notes
}

// Application State
interface AppState {
  contributors: Contributor[];
  ui: {
    currentView: 'form' | 'summary' | 'distribution';
    selectedContributorId: string | null;
    formErrors: ValidationErrors;
  };
}

// Calculated/Derived State (not stored, computed on demand)
interface CalculatedState {
  totalContributed: number;
  totalNotesNeeded: NoteBreakdown;    // Sum across all contributors
  totalDistributed: number;
  remainingToDistribute: number;
  bankWithdrawal: NoteBreakdown;      // What to get from bank
}

// Validation Errors
interface ValidationErrors {
  name?: string;
  amount?: string;
  breakdown?: string;  // "Note breakdown must equal total amount"
}
```

### Data Integrity Rules

1. **Note Breakdown Validation**: `sum(denomination × count) === amount`
2. **Non-negative Values**: All note counts and amounts >= 0
3. **Required Fields**: Name and amount cannot be empty
4. **Unique IDs**: Each contributor has a stable UUID

## State Management Pattern

### Store Implementation (Vanilla JS)

```javascript
// Simple observable store pattern
class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
    this.persistence = new PersistenceLayer();

    // Hydrate from localStorage on init
    this.hydrate();
  }

  // Get current state (immutable copy)
  getState() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Subscribe to changes
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Dispatch action to update state
  dispatch(action) {
    const newState = this.reducer(this.state, action);
    if (newState !== this.state) {
      this.state = newState;
      this.notify();
      this.persistence.save(this.state);
    }
  }

  // Notify all subscribers
  notify() {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  // Reducer: pure function (state + action -> newState)
  reducer(state, action) {
    switch (action.type) {
      case 'ADD_CONTRIBUTOR':
        return {
          ...state,
          contributors: [...state.contributors, action.payload]
        };
      case 'UPDATE_CONTRIBUTOR':
        return {
          ...state,
          contributors: state.contributors.map(c =>
            c.id === action.payload.id ? action.payload : c
          )
        };
      case 'DELETE_CONTRIBUTOR':
        return {
          ...state,
          contributors: state.contributors.filter(c => c.id !== action.payload)
        };
      case 'SET_VIEW':
        return {
          ...state,
          ui: { ...state.ui, currentView: action.payload }
        };
      default:
        return state;
    }
  }

  hydrate() {
    const saved = this.persistence.load();
    if (saved) {
      this.state = { ...this.state, ...saved };
    }
  }
}
```

## Persistence Layer

### localStorage Strategy

```javascript
class PersistenceLayer {
  constructor() {
    this.key = 'eidiya_data_v1';
  }

  save(state) {
    try {
      const data = JSON.stringify(state);
      localStorage.setItem(this.key, data);
    } catch (e) {
      // Handle quota exceeded
      console.error('Failed to save:', e);
    }
  }

  load() {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Failed to load:', e);
      return null;
    }
  }

  // Export for backup/sharing
  export() {
    return localStorage.getItem(this.key);
  }

  // Import from backup
  import(jsonString) {
    const data = JSON.parse(jsonString);
    this.save(data);
  }

  clear() {
    localStorage.removeItem(this.key);
  }
}
```

### Data Migration Considerations

- Version key in storage (`eidiya_data_v1`)
- Migration function if schema changes in future
- Export/import for backup (JSON file download/upload)

## UI Component Structure

### Component Hierarchy

```
App (root)
├── Header (navigation, title)
├── Main Content (switches based on view)
│   ├── FormView (when currentView === 'form')
│   │   ├── ContributorForm
│   │   │   ├── TextInput (name)
│   │   │   ├── CurrencyInput (amount)
│   │   │   └── NoteBreakdownInput
│   │   │       ├── NoteRow (5 AED)
│   │   │       ├── NoteRow (10 AED)
│   │   │       ├── NoteRow (20 AED)
│   │   │       ├── NoteRow (50 AED)
│   │   │       ├── NoteRow (100 AED)
│   │   │       ├── NoteRow (200 AED)
│   │   │       ├── NoteRow (500 AED)
│   │   │       └── NoteRow (1000 AED)
│   │   └── ValidationMessage
│   ├── SummaryView (when currentView === 'summary')
│   │   ├── TotalCard (total contributed)
│   │   ├── BankNotesCard (what to withdraw)
│   │   ├── ProgressCard (distributed vs remaining)
│   │   └── ContributorsTable
│   │       └── ContributorRow
│   └── DistributionView (when currentView === 'distribution')
│       ├── DistributionList
│       │   └── DistributionCard (per contributor, printable)
│       └── PrintButton
└── Footer (optional, links)
```

### Component Communication

- **Props down**: Parent passes data to children via constructor/methods
- **Events up**: Children emit custom events or call callbacks
- **Store access**: Views subscribe to store, get state updates

## Calculation Engine

### Derived State Calculations

```javascript
class CalculationEngine {
  // Calculate total notes needed from bank
  static calculateBankNotes(contributors) {
    const notes = { 5: 0, 10: 0, 20: 0, 50: 0, 100: 0, 200: 0, 500: 0, 1000: 0 };

    contributors.forEach(c => {
      Object.entries(c.breakdown).forEach(([denom, count]) => {
        notes[denom] += count;
      });
    });

    return notes;
  }

  // Calculate total amount contributed
  static calculateTotalContributed(contributors) {
    return contributors.reduce((sum, c) => sum + c.amount, 0);
  }

  // Calculate distribution progress
  static calculateProgress(contributors) {
    const total = contributors.length;
    const distributed = contributors.filter(c => c.isDistributed).length;
    return { total, distributed, remaining: total - distributed };
  }

  // Validate note breakdown
  static validateBreakdown(amount, breakdown) {
    const calculated = Object.entries(breakdown).reduce(
      (sum, [denom, count]) => sum + (parseInt(denom) * count),
      0
    );
    return calculated === amount;
  }
}
```

## Suggested Build Order

Based on component dependencies, build in this order:

### Phase 1: Foundation (Core Infrastructure)
1. **Data Model** - Define TypeScript interfaces/schemas
2. **Persistence Layer** - localStorage read/write
3. **Store** - State management with reducer pattern
4. **Calculation Engine** - Pure functions for derived state

### Phase 2: Data Entry (Input Layer)
5. **NoteBreakdownInput Component** - Individual denomination rows
6. **ContributorForm Component** - Full form with validation
7. **Form View** - Page container for adding contributors

### Phase 3: Display (Output Layer)
8. **Summary Cards** - Total, bank notes, progress
9. **ContributorsTable** - List of all contributors
10. **Summary View** - Dashboard page

### Phase 4: Distribution (Workflow Completion)
11. **DistributionCard Component** - Per-person printable card
12. **Distribution View** - List with print functionality
13. **Distribution Actions** - Mark as distributed

### Phase 5: Polish
14. **Navigation** - Header with view switching
15. **Print Styles** - CSS for clean printing
16. **Export/Backup** - JSON download/upload

## Patterns to Follow

### 1. Immutable State Updates
Always create new objects/arrays, never mutate existing state.

```javascript
// GOOD
const newContributors = [...contributors, newContributor];

// BAD
contributors.push(newContributor);
```

### 2. Pure Calculation Functions
Derived state should be calculated by pure functions, not stored.

### 3. Defensive Validation
Validate at input boundaries (form submission), not just display.

### 4. Progressive Enhancement
Core functionality works without JavaScript (form submission), enhanced with JS (validation, auto-save).

## Anti-Patterns to Avoid

### 1. Direct DOM Manipulation from Multiple Places
**Why bad:** Creates tight coupling, hard to debug
**Instead:** Centralize DOM updates in view components, driven by state

### 2. Storing Derived State
**Why bad:** Risk of inconsistency, requires manual updates
**Instead:** Calculate on demand from source data

### 3. Mutating State Outside Store
**Why bad:** Breaks change detection, persistence may miss updates
**Instead:** Always use `store.dispatch()` for state changes

### 4. Synchronous localStorage on Every Keystroke
**Why bad:** Performance hit, potential quota errors
**Instead:** Debounce saves, or save on blur/navigation

## Scalability Considerations

| Concern | At 10 Contributors | At 50 Contributors | At 200 Contributors |
|---------|-------------------|-------------------|---------------------|
| **localStorage** | ~10KB, fine | ~50KB, fine | ~200KB, approaching 5MB limit |
| **Rendering** | Simple loop | May need virtual scrolling | Definitely need pagination |
| **Calculations** | Instant | Instant | May need memoization |
| **Print View** | Single page | Multiple pages | Batch printing |

**Recommendation:** For Eidiya's use case (typically 10-30 family members), all approaches are fine. No premature optimization needed.

## Sources

- [Web Application Architecture: Guide 2025](https://implex.dev/blog/web-application-architecture-guide-2025) — HIGH confidence
- [Implementing a SPA with Vanilla JavaScript](https://zenn.dev/tattu/articles/ea83971e768a0b?locale=en) — HIGH confidence
- [Build a Single Page Application (SPA) Site With Vanilla.js](https://blog.jeremylikness.com/blog/build-a-spa-site-with-vanillajs/) — HIGH confidence
- [Personal Finance Tracker Design Manual](https://showcase.itcarlow.ie/C00273575/pdfs/Personal%20Finance%20Tracker%20Design.pdf) — MEDIUM confidence
- [How to Build a Personal Finance & Expense Tracker App](https://koder.ai/blog/build-mobile-app-personal-finance-expense-tracking) — MEDIUM confidence
- [The Vanilla Javascript Component Pattern](https://www.alexlockhart.me/2018/07/the-vanilla-javascript-component-pattern.html) — MEDIUM confidence
- [Why Vanilla JavaScript Is Making a Comeback in 2025](https://devtechinsights.com/vanilla-javascript-comeback-2025/) — MEDIUM confidence
