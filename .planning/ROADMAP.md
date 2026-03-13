# Eidiya Roadmap

**Project:** Eidiya - Eid money tracking web app
**Depth:** Coarse (5 phases)
**Created:** 2026-03-11
**Status:** Draft

---

## Phases

- [x] **Phase 1: Foundation** - Data layer, persistence, and calculation engine (completed 2026-03-11)
- [x] **Phase 2: Data Entry** - Add contributors with denomination breakdown and validation (completed 2026-03-12)
- [x] **Phase 3: Display & Edit** - View contributors, totals, and manage entries (completed 2026-03-12)
- [ ] **Phase 3.1: Gap Closure** - Fix UI/UX issues identified in Phase 3 verification
- [x] **Phase 4: Distribution** - Track receipts and generate printable lists (completed 2026-03-12)
- [x] **Phase 5: Data Management** - Export/import and UI polish (completed 2026-03-13)

---

## Phase Details

### Phase 1: Foundation

**Goal:** Establish a working data layer with safe persistence and accurate financial calculations

**Depends on:** Nothing (first phase)

**Requirements:** PERS-01, PERS-02, PERS-03, VAL-03, UX-01, UX-02

**Success Criteria** (what must be TRUE):
1. App loads without errors and initializes empty state when no data exists
2. All monetary values are stored internally as integers (fils) to prevent floating-point errors
3. Data persists automatically to localStorage on every change
4. App handles localStorage errors gracefully (quota exceeded, private browsing mode) with clear user messaging
5. App displays AED currency formatting correctly throughout (e.g., "AED 1,250.00")
6. App layout is responsive and usable on mobile devices

**Plans:** 3/3 plans complete

Plans:
- [x] 01-PLAN.md - Data Layer & Money Math (Wave 1) - Money class, SafeStorage, unit tests
- [x] 02-PLAN.md - Persistence & State Management (Wave 2) - Store, schema, formatters
- [x] 03-PLAN.md - UI Foundation & Formatting (Wave 3) - Pico CSS, responsive layout, app shell

---

### Phase 2: Data Entry

**Goal:** Users can add contributors with their preferred denomination breakdown

**Depends on:** Phase 1

**Requirements:** CONT-01, CONT-02, CONT-05, VAL-01, VAL-02

**Success Criteria** (what must be TRUE):
1. User can add a new contributor with name, date, and total amount
2. User can specify denomination breakdown across all 8 AED note types (5, 10, 20, 50, 100, 200, 500, 1000)
3. System validates in real-time that denomination breakdown sums equal the contribution amount
4. System shows clear validation errors inline during data entry
5. User can view all contributors in a scrollable list with their details visible
6. Form submission is blocked until all validation passes

**Plans:** 3 plans in 3 waves

Plans:
- [x] 02-01-PLAN.md — Denomination Validation (Wave 0) - Validation utilities and unit tests for VAL-01
- [x] 02-02-PLAN.md — Contributor Form Component (Wave 1) - Form with real-time validation for CONT-01, CONT-02, VAL-02
- [x] 02-03-PLAN.md — Form Integration & List Display (Wave 2) - Integrate form, enhance list for CONT-05

---

### Phase 3: Display & Edit

**Goal:** Users can view aggregated data and manage existing contributors

**Depends on:** Phase 2

**Requirements:** CONT-03, CONT-04, SUM-01, SUM-02, SUM-03, UX-03

**Success Criteria** (what must be TRUE):
1. User can see a summary dashboard showing grand total of all contributions
2. User can see total notes needed from bank broken down by denomination
3. Summary totals update automatically when contributors are added, edited, or deleted
4. User can edit existing contributor details (name, amount, breakdown)
5. User can delete a contributor with a confirmation prompt
6. All actions provide clear visual feedback (success/error notifications)

**Plans:** 2 plans in 2 waves

Plans:
- [x] 03-01-PLAN.md — Summary Dashboard (Wave 1) - Aggregate calculations and responsive summary component for SUM-01, SUM-02, SUM-03
- [x] 03-02-PLAN.md — Edit & Delete Management (Wave 2) - Store actions, inline editing, delete confirmation for CONT-03, CONT-04, UX-03

---

### Phase 3.1: Gap Closure

**Goal:** Address UI/UX issues identified during Phase 3 verification

**Depends on:** Phase 3

**Requirements:** UX-03

**Success Criteria** (what must be TRUE):
1. Edit menu button is visible in both light and dark modes
2. Name and amount edit modes have explicit Save and Cancel buttons
3. Status badges appear after edit and delete actions
4. Denomination input spinners do not overlap value text
5. Add Contributor form has adequate width for comfortable input

**Plans:** 2 plans in 1 wave (parallel)

Plans:
- [ ] 03.1-01-PLAN.md — CSS Fixes (Wave 1) - Dark mode button styling, spinner padding, form width
- [ ] 03.1-02-PLAN.md — Component Fixes (Wave 1) - Save/Cancel buttons, status badge timing

---

### Phase 4: Distribution

**Goal:** Users can track distribution and generate printable lists for handout

**Depends on:** Phase 3

**Requirements:** DIST-01, DIST-02, DIST-03

**Success Criteria** (what must be TRUE):
1. User can mark each contributor as "received" or "not received" their exchanged notes
2. System displays remaining notes to distribute after each marked receipt
3. User can generate a printable per-person distribution list showing what notes each person should receive
4. Print layout is optimized for physical printing (clean, readable, no UI chrome)
5. Distribution status persists across page reloads

**Plans:** 4 plans in 3 waves

Plans:
- [x] 04-00-PLAN.md — Test Scaffolding (Wave 0) - Distribution selectors, panel, and print view tests
- [x] 04-01-PLAN.md — Schema & Selectors (Wave 1) - Add received field, migration, distribution selectors for DIST-01
- [x] 04-02-PLAN.md — Received Toggle & Distribution Panel (Wave 2) - UI components, remaining notes display for DIST-01, DIST-02
- [x] 04-03-PLAN.md — Print View (Wave 3) - Printable distribution lists for DIST-03

---

### Phase 5: Data Management

**Goal:** Users can backup, restore, and customize their experience

**Depends on:** Phase 4

**Requirements:** PERS-04, PERS-05, UX-04

**Success Criteria** (what must be TRUE):
1. User can export all data as a JSON file for backup
2. User can import data from a previously exported JSON file
3. Import validates file format and provides feedback on success/failure
4. App supports both light and dark color modes
5. Mode preference persists across sessions

**Plans:** 4/4 plans complete

Plans:
- [x] 05-00-PLAN.md — Test Scaffolding (Wave 0) - DataManager and ThemeManager test scaffolding
- [x] 05-01-PLAN.md — Export Functionality (Wave 1) - JSON export with file download for PERS-04
- [x] 05-02-PLAN.md — Import Functionality (Wave 2) - JSON import with validation for PERS-05
- [x] 05-03-PLAN.md — Dark Mode (Wave 3) - Theme toggle, persistence, and UI for UX-04

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete    | 2026-03-11 |
| 2. Data Entry | 3/3 | Complete    | 2026-03-12 |
| 3. Display & Edit | 2/2 | Complete | 2026-03-12 |
| 3.1. Gap Closure | 0/2 | Planned | - |
| 4. Distribution | 4/4 | Complete | 2026-03-12 |
| 5. Data Management | 4/4 | Complete   | 2026-03-13 |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 2 | Complete |
| CONT-02 | Phase 2 | Complete |
| CONT-03 | Phase 3 | Complete |
| CONT-04 | Phase 3 | Complete |
| CONT-05 | Phase 2 | Complete |
| VAL-01 | Phase 2 | Complete |
| VAL-02 | Phase 2 | Complete |
| VAL-03 | Phase 1 | Complete |
| SUM-01 | Phase 3 | Complete |
| SUM-02 | Phase 3 | Complete |
| SUM-03 | Phase 3 | Complete |
| DIST-01 | Phase 4 | Complete |
| DIST-02 | Phase 4 | Complete |
| DIST-03 | Phase 4 | Complete |
| PERS-01 | Phase 1 | Complete |
| PERS-02 | Phase 1 | Complete |
| PERS-03 | Phase 1 | Complete |
| PERS-04 | Phase 5 | Complete |
| PERS-05 | Phase 5 | Complete |
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 3.1 | Planned |
| UX-04 | Phase 5 | Complete |

**Coverage Summary:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0
- Duplicates: 0

---

## Phase Ordering Rationale

1. **Foundation first:** Data layer must exist before UI can function; integer money handling is a schema-level decision that affects all calculations
2. **Entry before display:** Must be able to add data before viewing it; validation prevents corrupt data from entering system
3. **Display before distribution:** Need aggregated totals before printing individual lists; edit/delete needed to correct mistakes before distribution
4. **Gap closure:** Fix identified issues before considering phase complete
5. **Management last:** Export/import and polish features are recovery/enhancement features, not core workflow

---

*Last updated: 2026-03-13*
