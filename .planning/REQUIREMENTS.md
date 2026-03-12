# Requirements: Eidiya

**Defined:** 2026-03-11
**Core Value:** Accurately track who contributed what, how they want it exchanged, and ensure everyone receives their correct notes without miscalculation.

---

## v1 Requirements

### Contributors (CONT)

- [ ] **CONT-01**: User can add a contributor with name, contribution date, and total amount
- [ ] **CONT-02**: User can specify denomination breakdown per contributor (5, 10, 20, 50, 100, 200, 500, 1000 AED notes)
- [x] **CONT-03**: User can edit existing contributor details
- [x] **CONT-04**: User can delete a contributor
- [ ] **CONT-05**: User can view all contributors in a list with their details

### Validation (VAL)

- [ ] **VAL-01**: System validates that denomination breakdown sums equal the contribution amount
- [ ] **VAL-02**: System shows real-time validation errors during data entry
- [x] **VAL-03**: System stores all monetary values as integers (fils) to prevent floating-point errors

### Summary (SUM)

- [ ] **SUM-01**: System calculates total notes needed from bank per denomination
- [ ] **SUM-02**: System displays grand total of all contributions
- [ ] **SUM-03**: System updates totals automatically when contributors change

### Distribution (DIST)

- [ ] **DIST-01**: User can mark contributors as "received" or "not received"
- [ ] **DIST-02**: System shows remaining notes to distribute after each marked receipt
- [ ] **DIST-03**: User can generate printable per-person distribution list

### Persistence (PERS)

- [x] **PERS-01**: System saves all data to localStorage automatically
- [x] **PERS-02**: System loads data from localStorage on app start
- [x] **PERS-03**: System handles localStorage errors gracefully (quota exceeded, private mode)
- [ ] **PERS-04**: User can export data as JSON file
- [ ] **PERS-05**: User can import data from JSON file

### UI/UX (UX)

- [x] **UX-01**: App is responsive and works on mobile devices
- [x] **UX-02**: App uses AED currency formatting throughout
- [x] **UX-03**: App provides clear visual feedback for all actions
- [ ] **UX-04**: App supports both light and dark modes

---

## v2 Requirements

### Templates (TEMP)

- **TEMP-01**: User can save denomination breakdown templates (e.g., "Many small notes", "Mixed")
- **TEMP-02**: User can apply templates when adding contributors

### Enhancements (ENH)

- **ENH-01**: Display amounts in Arabic words
- **ENH-02**: Undo last action
- **ENH-03**: Multiple Eid sessions with history

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-user accounts / authentication | Single organizer use case, adds unnecessary complexity |
| Payment processing / digital transfers | Cash-only tracking per requirements |
| Cloud sync across devices | Requires backend, single-device use is acceptable |
| Multi-currency support | AED-only is sufficient for UAE context |
| Historical analytics / reports | Focus on immediate Eid need |
| Receipt photo upload | Privacy concerns, unnecessary for family trust |
| Real-time collaboration | Single organizer model, no conflict resolution needed |

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| CONT-01 | Phase 2 | Pending |
| CONT-02 | Phase 2 | Pending |
| CONT-03 | Phase 3 | Complete |
| CONT-04 | Phase 3 | Complete |
| CONT-05 | Phase 2 | Pending |
| VAL-01 | Phase 2 | Pending |
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
| UX-01 | Phase 1 | Complete |
| UX-02 | Phase 1 | Complete |
| UX-03 | Phase 3 | Complete |
| UX-04 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0

---

*Requirements defined: 2026-03-11*
*Last updated: 2026-03-11 after completing Plan 01-01*
