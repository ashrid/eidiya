# Eidiya

## What This Is

A web app for organizing Eid money exchanges. Family members contribute cash for gifting to kids during Eid, each with their own preferred note denomination breakdown. The organizer tracks contributions, calculates total notes needed from the bank, and manages distribution — eliminating confusion and miscalculation when handling money for multiple family members.

Shipped v1.0 with contributor management, denomination validation, distribution tracking, and data export/import.

---

## Current State

**Version:** v1.0 MVP (shipped 2026-03-14)
**Tech Stack:** Vanilla JavaScript, Pico CSS, Vite
**LOC:** ~8,800 lines
**Tests:** 100+ unit tests
**Storage:** localStorage with fallback

---

## Core Value

Accurately track who contributed what, how they want it exchanged, and ensure everyone receives their correct notes without miscalculation.

---

## Requirements

### Validated (v1.0)

- ✅ Record family member contributions with name, date, amount, and custom note breakdown — v1.0
- ✅ Verify that note breakdowns sum correctly to the contribution amount — v1.0
- ✅ Edit and delete existing contributors — v1.0
- ✅ Track whether each person has received their exchanged notes — v1.0
- ✅ Generate summary of total notes needed from bank (by denomination) — v1.0
- ✅ Generate per-person printable list for distribution — v1.0
- ✅ Support UAE Dirham (AED) currency with standard notes: 5, 10, 20, 50, 100, 200, 500, 1000 — v1.0
- ✅ Export/import data as JSON for backup — v1.0
- ✅ Light and dark mode support — v1.0

### Active (Next Milestone)

- [ ] Save denomination breakdown templates for quick reuse
- [ ] Display amounts in Arabic words
- [ ] Undo last action
- [ ] Multiple Eid sessions with history

### Out of Scope

- Multi-user access / family members logging in themselves — Organizer-only use
- Payment processing / digital transfers — Cash-only tracking
- Historical analytics / reporting beyond current Eid — Focus on immediate need
- Mobile native app — Web app is sufficient
- Authentication / login — Single user, local/device access acceptable
- Cloud sync — Single-device use is acceptable

---

## Context

Built for UAE-based family Eid celebrations. During Eid al-Fitr (after Ramadan), it's traditional to gift money (Eidiya) to children. Extended family members pool money with specific denomination preferences — some want many small notes for many kids, others prefer larger denominations. The organizer handles all cash exchanges at the bank and distribution, which becomes complex with 10+ contributors each wanting different breakdowns.

**Shipped v1.0** with full feature set in 3 days. App handles all core workflows: add contributors with denomination breakdowns, validate totals match, view summary of bank notes needed, track distribution with received toggle, generate printable lists, and export/import data.

---

## Constraints

- **Hosting:** Static site on free hosting (GitHub Pages/Netlify compatible)
- **Platform:** Web app accessible on mobile and desktop browsers
- **Data:** LocalStorage with memory fallback (single user, no sync)
- **Currency:** UAE Dirham (AED) only
- **Timeline:** Shipped before Eid 2026

---

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static web app with localStorage | Free hosting, no backend needed, single user | ✅ Validated — works reliably |
| No authentication | Single organizer use, reduces complexity | ✅ Validated — no security concerns for single-user local app |
| Client-side only | Zero hosting costs, works offline | ✅ Validated — no server needed |
| Integer fils storage | Prevent floating-point errors in money calculations | ✅ Validated — precise calculations guaranteed |
| Observer pattern for state | Reactive UI updates without framework | ✅ Validated — clean component updates |
| Pico CSS CDN | Zero-build styling, semantic HTML | ✅ Validated — fast development, clean look |
| Schema versioning | Enable data migration on import | ✅ Validated — forward compatibility assured |

---

*Last updated: 2026-03-14 after v1.0 milestone*
