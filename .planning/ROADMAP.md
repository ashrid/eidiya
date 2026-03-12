# Eidiya Roadmap

**Project:** Eidiya - Eid money tracking web app
**Depth:** Coarse (5 phases)
**Created:** 2026-03-11
**Status:** Draft

---

## Phases

- [x] **Phase 1: Foundation** - Data layer, persistence, and calculation engine (completed 2026-03-11)
- [ ] **Phase 2: Data Entry** - Add contributors with denomination breakdown and validation
- [ ] **Phase 3: Display & Edit** - View contributors, totals, and manage entries
- [ ] **Phase 4: Distribution** - Track receipts and generate printable lists
- [ ] **Phase 5: Data Management** - Export/import and UI polish

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
- [ ] 02-02-PLAN.md — Contributor Form Component (Wave 1) - Form with real-time validation for CONT-01, CONT-02, VAL-02
- [ ] 02-03-PLAN.md — Form Integration & List Display (Wave 2) - Integrate form, enhance list for CONT-05

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

**Plans:** TBD

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

**Plans:** TBD

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

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 3/3 | Complete    | 2026-03-11 |
| 2. Data Entry | 1/3 | In Progress | 2026-03-12 |
| 3. Display & Edit | 0/2 | Not started | - |
| 4. Distribution | 0/2 | Not started | - |
| 5. Data Management | 0/2 | Not started | - |

---

## Coverage

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 3 | Pending |
| CONT-04 | Phase 3 | Pending |
| CONT-05 | Phase 2 | Pending |
| VAL-01 | Phase 2 | Complete |
| VAL-02 | Phase 2 | Pending |
| VAL-03 | Phase 1 | Complete |
| SUM-01 | Phase 3 | Pending |
| SUM-02 | Phase 3 | Pending |
| SUM-03 | Phase 3 | Pending |
| DIST-01 | Phase 4 | Pending |
| DIST-02 | Phase 4 | Pending |
| DIST-03 | Phase 4 | Pending |
| PERS-01 | Phase 1 | Complete |
| PERS-02 | Phase 1 | Complete |
| PERS-03 | Phase 1 | Complete |
| PERS-04 | Phase 5 | Pending |
| PERS-05 | Phase 5 | Pending |
| UX-01 | Phase 1 | In Progress |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 3 | Pending |
| UX-04 | Phase 5 | Pending |

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
4. **Management last:** Export/import and polish features are recovery/enhancement features, not core workflow

---

*Last updated: 2026-03-12*
