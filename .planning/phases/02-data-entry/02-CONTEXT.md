# Phase 2: Data Entry - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can add contributors with their preferred denomination breakdown. This phase delivers the contributor entry form, validation logic, and the contributors list display. It does NOT include editing/deleting contributors (Phase 3) or distribution tracking (Phase 4).

</domain>

<decisions>
## Implementation Decisions

### Form Layout & Placement
- Inline form at top of contributors list
- Form visible immediately even when empty (no "Add First Contributor" button to reveal)
- Form wrapped in a Pico CSS card container for visual separation
- Form is collapsible toggle — can be shown/hidden when contributors exist

### Denomination Input Method
- Number inputs for entering note counts (type directly)
- Two-column grid layout for 8 denominations
- Denominations ordered smallest (5 AED) to largest (1000 AED) — natural counting progression
- Total auto-calculates in real-time from breakdown values
- User enters total contribution amount directly (separate field, not derived)

### Validation Feedback Style
- Inline errors with visual field highlighting (red borders)
- Validation runs on blur (when leaving field), not while typing
- Errors only — no success checkmarks or indicators
- Detailed error messages showing actual vs expected values: "Breakdown sum is 950 AED, but total is 1000 AED (difference: 50 AED)"

### Post-Submission Flow
- Form clears immediately on successful submit
- No scroll position change — stay in place
- No toast notification — new contributor appearing in list is sufficient feedback
- Form remains visible and ready for next entry (since collapsible, it stays open)

### Claude's Discretion
- Exact field label text and placeholder wording
- Specific spacing within the form card
- Error message exact styling (which Pico CSS validation classes to use)
- "Add Contributor" button placement and styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppContainer` component: Already has `_renderContributorsList()` and `_renderContributorCard()` placeholders
- `Store` module: Observable state with `addContributor()` action needed
- `formatAED()` from `@modules/money/formatters.js`: For displaying monetary values
- State schema: `Contributor` and `DenominationBreakdown` types already defined

### Established Patterns
- **Pico CSS styling**: Forms use semantic HTML with automatic styling
- **Component pattern**: Classes with constructor, public methods, private `_render` helpers
- **State management**: Store dispatches actions, components subscribe to state changes
- **Validation**: Schema validation functions exist in `src/modules/state/schema.js`

### Integration Points
- New form component will integrate with existing `AppContainer`
- Form submissions dispatch to `Store.addContributor()`
- Contributors list rendering already exists but needs enhancement for breakdown display
- Empty state already mentions "form below" — must deliver on this expectation

</code_context>

<specifics>
## Specific Ideas

- "The form should be fast for adding multiple contributors — Eid preparation often involves adding 10+ family members in one session"
- "Small denominations first (5, 10, 20...) feels natural for counting"

</specifics>

<deferred>
## Deferred Ideas

- Quick-fill templates (e.g., "Many small notes", "Mixed") — v2 requirement TEMP-01
- Edit/delete contributors — Phase 3 scope
- Keyboard shortcuts for power users — v2 enhancement
- Import from CSV — out of scope (JSON export/import is Phase 5)

</deferred>

---

*Phase: 02-data-entry*
*Context gathered: 2026-03-12*
