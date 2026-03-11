# Feature Landscape: Eidiya Money Tracking App

**Domain:** Money contribution tracking with denomination breakdown
**Researched:** 2026-03-11
**Confidence:** HIGH

---

## Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Add contributor with name & amount** | Core purpose of the app | LOW | Simple form with name, amount fields |
| **Denomination breakdown input** | Users need to specify how they want their money exchanged | MEDIUM | Input fields for each AED note type (5, 10, 20, 50, 100, 200, 500, 1000) |
| **Real-time validation** | Users expect immediate feedback if math is wrong | LOW | Check that note breakdown sums to contribution amount |
| **View all contributors list** | Need to see who contributed what | LOW | Simple table/list view with totals |
| **Total notes needed summary** | Organizer needs this for bank visit | LOW | Aggregate count per denomination across all contributors |
| **Delete/edit entries** | Mistakes happen, data needs correction | LOW | Basic CRUD operations |
| **Responsive mobile design** | Will be used on phones during family gatherings | MEDIUM | Touch-friendly inputs, readable on small screens |
| **Clear visual feedback** | Users need to know actions succeeded | LOW | Success/error messages, loading states |

---

## Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Per-person printable distribution list** | Eliminates confusion when handing out exchanged notes | MEDIUM | Clean print-friendly layout with person's name, their breakdown, checkboxes |
| **Received/distributed tracking** | Know who has gotten their money vs who hasn't | LOW | Toggle/checkbox per contributor for distribution status |
| **Auto-calculation of remaining notes** | Track how many notes left after each distribution | LOW | Subtract distributed from total needed |
| **Data persistence without login** | No friction for single-user scenario | LOW | localStorage or similar, with optional export |
| **Amount in words display** | Helpful for verification, official feel | LOW | Convert numbers to Arabic/English words |
| **Undo last action** | Safety net for accidental deletions | LOW | Simple undo stack for recent changes |
| **Quick-add templates** | Common amounts (e.g., 500 AED, 1000 AED) with typical breakdowns | MEDIUM | Pre-fill denomination fields based on selected pattern |

---

## Anti-Features (Deliberately NOT Building)

Features that seem good but create problems for this use case.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Multi-user accounts / family login** | "Everyone could see their own status" | Adds complexity (auth, backend, sync) for single-organizer use case | Organizer shares screen or prints lists |
| **Payment processing / digital transfers** | "Could handle actual money transfers" | Scope creep into fintech, regulatory issues, fees | Track cash only, handle exchange physically |
| **Historical analytics / multi-year tracking** | "Could see patterns over years" | Complicates UI, not needed for immediate Eid use | Export data before clearing for next year |
| **Cloud sync across devices** | "Access from any device" | Requires backend, auth, ongoing maintenance | Single-device use is acceptable per constraints |
| **Currency conversion / multi-currency** | "Might need other currencies" | Adds complexity, AED-only is sufficient | Hardcode AED denominations |
| **Receipt photo upload** | "Could attach proof of contribution" | Requires file storage, privacy concerns, unnecessary for family trust | Text notes field if needed |
| **Real-time collaboration** | "Multiple family members updating" | WebSocket complexity, conflict resolution | Single organizer model |

---

## Feature Dependencies

```
[Add contributor with name & amount]
    └──requires──> [Denomination breakdown input]
                       └──requires──> [Real-time validation]

[View all contributors list]
    └──requires──> [Add contributor with name & amount]
    └──enhances──> [Total notes needed summary]

[Per-person printable distribution list]
    └──requires──> [Denomination breakdown input]
    └──enhances──> [Received/distributed tracking]

[Received/distributed tracking]
    └──enhances──> [Auto-calculation of remaining notes]

[Delete/edit entries]
    └──requires──> [View all contributors list]

[Undo last action]
    └──requires──> [Delete/edit entries]
```

### Dependency Notes

- **Denomination breakdown requires validation:** Users must know immediately if their math is wrong
- **Distribution list requires tracking:** Can't mark distributed without tracking mechanism
- **Printable lists enhance tracking:** Physical lists work best with checkboxes for received status
- **Undo requires edit capability:** Same underlying data manipulation layer

---

## MVP Definition

### Launch With (v1)

Minimum viable product — what's needed to validate the concept.

- [ ] **Add contributor** — Core functionality, can't track without this
- [ ] **Denomination breakdown with validation** — Essential for the app's purpose
- [ ] **Contributors list view** — See all data in one place
- [ ] **Total notes summary** — The output needed for bank visit
- [ ] **localStorage persistence** — Data shouldn't disappear on refresh
- [ ] **Responsive design** — Will be used on mobile devices

### Add After Validation (v1.x)

Features to add once core is working.

- [ ] **Per-person printable list** — Trigger: User asks how to distribute
- [ ] **Received/distributed tracking** — Trigger: Organizer needs to track during distribution
- [ ] **Edit/delete entries** — Trigger: User makes a mistake
- [ ] **Export data (JSON/CSV)** — Trigger: User wants to save before clearing

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **Quick-add templates** — Why defer: Can add contributors manually for first Eid
- [ ] **Amount in words** — Why defer: Nice polish, not essential
- [ ] **Undo functionality** — Why defer: Edit/delete covers most cases
- [ ] **Multiple Eid sessions/history** — Why defer: Clear and restart is fine initially

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Add contributor with breakdown | HIGH | LOW | P1 |
| Real-time validation | HIGH | LOW | P1 |
| Contributors list view | HIGH | LOW | P1 |
| Total notes summary | HIGH | LOW | P1 |
| localStorage persistence | HIGH | LOW | P1 |
| Responsive design | HIGH | MEDIUM | P1 |
| Edit/delete entries | MEDIUM | LOW | P2 |
| Per-person printable list | MEDIUM | MEDIUM | P2 |
| Received/distributed tracking | MEDIUM | LOW | P2 |
| Export data | LOW | LOW | P2 |
| Quick-add templates | MEDIUM | MEDIUM | P3 |
| Amount in words | LOW | LOW | P3 |
| Undo functionality | LOW | LOW | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | Spreadsheet (Excel/Google Sheets) | Cash Calculator Apps | Our Approach |
|---------|-----------------------------------|----------------------|--------------|
| Denomination breakdown | Manual formula setup | Generic calculators | Purpose-built for AED, contributor-focused |
| Validation | Formula errors possible | Basic sum check | Real-time with clear error messages |
| Print distribution lists | Manual formatting | Not available | Auto-generated, clean layout |
| Track received status | Manual checkbox | Not available | Built-in toggle per person |
| Mobile-friendly | Poor | Varies | Designed for phone use |
| Zero setup | No (create template) | Yes | Yes, purpose-built |
| Offline capable | Yes | Yes | Yes, no backend needed |

---

## Sources

- [Personal finance app development best practices 2025](https://diceus.com/guide-to-personal-finance-app-development/)
- [Table stakes for web user interfaces](https://www.chromatic.com/blog/table-stakes-for-web-user-interfaces/)
- [Cash denomination calculator tools analysis](https://cashdenominationcalculator.github.io/)
- [NewStore cash management features](https://docs.newstore.com/docs/managing-cash)
- [Custom web application must-have features 2026](https://quokkalabs.com/blog/custom-web-application-features/)

---

*Feature research for: Eidiya money contribution tracking app*
*Researched: 2026-03-11*
