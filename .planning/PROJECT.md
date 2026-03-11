# Eidiya

## What This Is

A web app for organizing Eid money exchanges. Family members contribute cash for gifting to kids during Eid, each with their own preferred note denomination breakdown. The organizer tracks contributions, calculates total notes needed from the bank, and manages distribution — eliminating confusion and miscalculation when handling money for multiple family members.

## Core Value

Accurately track who contributed what, how they want it exchanged, and ensure everyone receives their correct notes without miscalculation.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Record family member contributions with name, date, amount, and custom note breakdown
- [ ] Verify that note breakdowns sum correctly to the contribution amount
- [ ] Track whether each person has received their exchanged notes
- [ ] Generate summary of total notes needed from bank (by denomination)
- [ ] Generate per-person printable list for distribution
- [ ] Support UAE Dirham (AED) currency with standard notes: 5, 10, 20, 50, 100, 200, 500, 1000
- [ ] Deploy to free hosting with zero maintenance

### Out of Scope

- Multi-user access / family members logging in themselves — Organizer-only use
- Payment processing / digital transfers — Cash-only tracking
- Historical analytics / reporting beyond current Eid — Focus on immediate need
- Mobile native app — Web app is sufficient
- Authentication / login — Single user, local/device access acceptable

## Context

Built for UAE-based family Eid celebrations. During Eid al-Fitr (after Ramadan), it's traditional to gift money (Eidiya) to children. Extended family members pool money with specific denomination preferences — some want many small notes for many kids, others prefer larger denominations. The organizer handles all cash exchanges at the bank and distribution, which becomes complex with 10+ contributors each wanting different breakdowns.

## Constraints

- **Hosting**: Must be free with no server maintenance (static site preferred)
- **Platform**: Web app accessible on mobile and desktop browsers
- **Data**: Local/device storage acceptable (single user, no sync needed)
- **Currency**: UAE Dirham (AED) only
- **Timeline**: Needed before Eid (approximately within days to weeks)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Static web app with localStorage | Free hosting, no backend needed, single user | — Pending |
| No authentication | Single organizer use, reduces complexity | — Pending |
| Client-side only | Zero hosting costs, works offline | — Pending |

---
*Last updated: 2026-03-11 after initialization*
