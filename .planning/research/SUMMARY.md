# Project Research Summary

**Project:** Eidiya (Eid money tracking web app)
**Domain:** Client-side single-user money tracking with localStorage persistence
**Researched:** 2026-03-11
**Confidence:** HIGH

## Executive Summary

Eidiya is a client-side only, single-user web application for tracking Eid money contributions with AED denomination breakdowns. Research confirms that modern vanilla JavaScript with ES2022+ is the optimal approach for this type of application — frameworks like React or Vue add unnecessary overhead (30-100KB+) for a simple CRUD app with no shared state complexity. The 2025 trend toward "zero-build" and "vanilla-first" development (exemplified by 37signals and DHH/ONCE products) validates this approach.

The recommended stack uses Vite 7.3.1 for development (instant HMR, optimized builds), Pico CSS 2.x for classless semantic styling with automatic dark mode, and GitHub Pages for truly free hosting with automatic HTTPS. Data persistence via localStorage is sufficient for the expected 10-30 family member use case, keeping all data on-device with no backend dependencies.

Key risks center on financial calculation accuracy and data integrity. JavaScript's floating-point arithmetic cannot precisely represent decimal currency values, requiring all amounts to be stored as integers (fils/cent equivalents). localStorage quota limits (~5MB) and Safari private browsing mode (which completely blocks writes) must be handled gracefully with export/import fallback workflows.

## Key Findings

### Recommended Stack

Research strongly supports a minimal, zero-runtime-dependency approach. Vite provides modern development conveniences (10-20ms HMR) while outputting optimized static files. Pico CSS offers comprehensive styling (7.7KB) without utility-class clutter. GitHub Pages is the only truly permanent free tier with no commercial-use restrictions, unlike Vercel.

**Core technologies:**
- **Vanilla JavaScript (ES2022+)**: Application logic — Zero build step overhead, direct browser execution, no framework complexity for simple CRUD
- **Vite 7.3.1**: Development server + build tool — Instant HMR, zero-config vanilla JS template, optimized static output
- **Pico CSS 2.x**: Styling — Classless semantic CSS, automatic dark mode, 130+ CSS variables for theming
- **GitHub Pages**: Hosting — Truly permanent free tier, automatic HTTPS, zero maintenance
- **localStorage API**: Data persistence — Simple key-value store, sufficient for single-user scenario

### Expected Features

Users expect a purpose-built tool that eliminates spreadsheet manual work. The core value proposition is automated denomination breakdown with validation and printable distribution lists.

**Must have (table stakes):**
- Add contributor with name and amount — Core functionality, can't track without this
- Denomination breakdown input (AED notes: 5, 10, 20, 50, 100, 200, 500, 1000) — Essential for app's purpose
- Real-time validation — Users expect immediate feedback if math is wrong
- Contributors list view — See all data in one place
- Total notes summary — Output needed for bank visit
- localStorage persistence — Data shouldn't disappear on refresh
- Responsive mobile design — Will be used on phones during family gatherings

**Should have (competitive):**
- Per-person printable distribution list — Eliminates confusion when handing out exchanged notes
- Received/distributed tracking — Know who has gotten their money vs who hasn't
- Edit/delete entries — Mistakes happen, data needs correction
- Export data (JSON/CSV) — Backup before clearing for next year

**Defer (v2+):**
- Quick-add templates — Can add contributors manually for first Eid
- Amount in words display — Nice polish, not essential
- Undo functionality — Edit/delete covers most cases
- Multi-year history — Clear and restart is fine initially

### Architecture Approach

The architecture follows a layered component pattern with clear separation between data, state, and presentation layers. A central Store acts as single source of truth using an observable pattern with reducer-based state updates. Unidirectional data flow ensures predictability: User Action -> Event Handler -> Store Update -> Re-render -> Persistence.

**Major components:**
1. **Store** — Central state management, data integrity, notifies subscribers on changes
2. **Form View** — Add/edit contributor data, note breakdown inputs, client-side validation
3. **Summary View** — Display totals, bank notes needed, distribution status dashboard
4. **Distribution View** — Per-person printable lists, mark as distributed workflow
5. **Validation Engine** — Verify note breakdowns sum to contribution amount
6. **Calculation Engine** — Aggregate notes needed, remaining to distribute (pure functions)
7. **Persistence Layer** — localStorage read/write with error handling, data migration support

### Critical Pitfalls

Research identified seven critical pitfalls, with the top five requiring immediate attention:

1. **Floating-Point Money Calculation Errors** — JavaScript cannot precisely represent decimals like 0.1. Store all amounts as integers (fils), perform calculations in integers, convert to display format only at render time.

2. **Silent Data Loss from localStorage Quota Exceeded** — localStorage has ~5MB limit. Wrap all calls in try-catch, detect QuotaExceededError, and provide export fallback when storage is full.

3. **Safari Private Browsing Mode Data Loss** — Safari completely disables localStorage writes in private mode. Detect storage availability on app load and provide clear messaging with export/import workflow.

4. **JSON Parse Errors from Corrupted localStorage** — Data corruption can crash app on load. Wrap all reads with try-catch, return default values on parse failure.

5. **Denomination Breakdown Sum Validation Failure** — Users may enter breakdowns that don't sum to total. Implement real-time validation with inline error messages, prevent form submission until valid.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Core Infrastructure)
**Rationale:** Data model and storage layer are prerequisites for all other functionality. Must establish integer-based money handling and safe storage patterns before any UI work.
**Delivers:** Working data layer with localStorage persistence, Store with reducer pattern, Calculation Engine with pure functions
**Addresses:** localStorage persistence (table stakes)
**Avoids:** Floating-point errors (Pitfall 1), localStorage quota issues (Pitfall 2), Safari private mode breakage (Pitfall 3), JSON corruption crashes (Pitfall 4)

### Phase 2: Data Entry (Input Layer)
**Rationale:** Users must be able to add contributors before viewing or distributing. Form validation is critical for data integrity.
**Delivers:** Contributor form with denomination breakdown inputs, real-time validation, mobile-optimized currency inputs
**Uses:** Vite dev server, Pico CSS form styling, ES Modules for component organization
**Implements:** Form View, Validation Engine, NoteBreakdownInput component
**Avoids:** Denomination validation failures (Pitfall 5), mobile input UX friction (Pitfall 6)

### Phase 3: Display (Output Layer)
**Rationale:** Once data can be entered, users need to view totals and contributor list. This delivers core value for bank visit preparation.
**Delivers:** Summary dashboard with total contributed, bank notes needed, contributors table
**Addresses:** View all contributors list, Total notes needed summary (table stakes)
**Implements:** Summary View, Summary Cards, ContributorsTable component

### Phase 4: Distribution (Workflow Completion)
**Rationale:** Physical distribution is the final step. Printable lists and tracking complete the user workflow.
**Delivers:** Per-person printable distribution cards, received/distributed tracking, print-optimized CSS
**Addresses:** Per-person printable list, Received/distributed tracking (differentiators)
**Implements:** Distribution View, DistributionCard component, print styles

### Phase 5: Data Management & Polish
**Rationale:** Edit/delete and export are important but not required for initial use. Export also provides data recovery path.
**Delivers:** Edit/delete contributor entries, JSON export/import, data backup workflow
**Addresses:** Edit/delete entries, Export data (differentiators)
**Avoids:** Data loss on browser clear (Pitfall 7)

### Phase Ordering Rationale

- **Foundation first:** Data layer must exist before UI can function; integer money handling is a schema-level decision
- **Entry before display:** Must be able to add data before viewing it; validation prevents corrupt data from entering system
- **Display before distribution:** Need aggregated totals before printing individual lists
- **Management last:** Edit/delete and export are recovery features, not core workflow

### Research Flags

Phases likely needing deeper research during planning:
- **None identified** — All phases use well-documented patterns

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Vanilla JS store pattern well-documented, localStorage API standard
- **Phase 2 (Data Entry):** Form validation patterns established, Pico CSS provides styling
- **Phase 3 (Display):** Table rendering, card layouts are standard patterns
- **Phase 4 (Distribution):** Print CSS is well-documented, toggle/checkbox patterns standard
- **Phase 5 (Management):** CRUD operations, file export via Blob API are established patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Multiple authoritative sources confirm vanilla JS approach; Vite 7.3.1 stable per official docs; Pico CSS v2 current |
| Features | HIGH | Clear domain requirements, competitor analysis validates feature set, anti-features well-defined |
| Architecture | HIGH | Established patterns from SPA architecture guides, vanilla JS component patterns well-documented |
| Pitfalls | HIGH | Financial calculation issues well-documented, localStorage limitations extensively covered |

**Overall confidence:** HIGH

### Gaps to Address

- **Mobile input testing:** Research recommends testing currency input on physical iOS and Android devices — schedule device testing during Phase 2
- **Print layout validation:** Printable distribution lists need validation with actual printers — test during Phase 4
- **Safari private mode behavior:** While documented, actual error handling should be verified on real iOS Safari during Phase 1

## Sources

### Primary (HIGH confidence)
- [Vite Official Docs](https://vite.dev/guide/) — Version 7.3.1 confirmed stable
- [Pico CSS v2 Docs](https://picocss.com/docs/v2) — Current version features
- [Vanilla CSS is all you need](https://www.zolkos.com/2025/12/03/vanilla-css-is-all-you-need) — 37signals CSS architecture validation
- [JavaScript Rounding Errors in Financial Applications](https://www.robinwieruch.de/javascript-rounding-errors/) — Floating-point pitfalls
- [iOS Private Browsing + localStorage](https://spin.atomicobject.com/ios-private-browsing-localstorage/) — Safari storage limitations
- [Web Application Architecture: Guide 2025](https://implex.dev/blog/web-application-architecture-guide-2025) — SPA patterns

### Secondary (MEDIUM confidence)
- [Personal finance app development best practices 2025](https://diceus.com/guide-to-personal-finance-app-development/) — Feature guidance
- [Writing Modern JavaScript without a Bundler](https://playfulprogramming.com/posts/modern-js-bundleless) — No-build patterns
- [10 LocalStorage Mistakes to Avoid](https://javascript.plainenglish.io/10-localstorage-mistakes-to-avoid-ff49bc7d46a0) — Storage pitfalls

### Tertiary (LOW confidence)
- None — all key findings backed by multiple sources

---

*Research completed: 2026-03-11*
*Ready for roadmap: yes*
