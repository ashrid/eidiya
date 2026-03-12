# Phase 3: Display & Edit - Context

**Gathered:** 2026-03-12
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can view aggregated summary data (total contributions, bank notes needed) and manage existing contributors. This includes editing contributor details inline and deleting contributors with confirmation. Does NOT include distribution tracking or marking received — that's Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Summary Dashboard Layout
- **Position:** Sticky sidebar on desktop, top card on mobile (responsive layout)
- **Format:** Simple table showing Denomination | Count | Subtotal
- **Updates:** Live updates with subtle animation/flash when values change
- **Additional info:** Show contributor count and total notes count alongside grand total

### Edit Interaction Pattern
- **Pattern:** Inline editing — click any field in contributor card to edit directly
- **Visual focus:** Dim/gray out other contributors when one is being edited
- **Save behavior:** Auto-save on field blur, no explicit Cancel button
- **Validation:** Same as add form — blur validation with inline errors

### Delete Confirmation Style
- **Confirmation:** Claude to decide best approach (modal vs inline vs other)
- **Recovery:** No recovery — deleted contributors are gone forever
- **Details shown:** Full details in confirmation — "Delete Ahmed with 500 AED (5×100)?"
- **Access:** Delete action in dropdown/menu (not always visible)

### Visual Feedback for Actions
- **Style:** Inline status in card (e.g., "Saved" / "Deleted") — different from Phase 2's no-feedback approach
- **Duration:** 2 seconds brief acknowledgment
- **Errors:** Claude to decide appropriate treatment
- **Animation:** Claude to decide appropriate motion for appearing/disappearing

### Claude's Discretion
- Exact table styling and responsive breakpoint for sidebar
- Toast vs inline error treatment for validation failures
- Animation specifics for live update flash
- Exact "..." menu icon and positioning
- Soft transitions vs instant changes for card states

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `AppContainer._renderContributorCard()` — renders contributor cards, needs edit/delete buttons added
- `AppContainer._renderContributorsList()` — renders list, needs integration with summary
- `Store.addContributor()` — pattern for `updateContributor()` and `deleteContributor()` actions
- `ContributorForm` — validation pattern can be reused for editing
- `validateContributorForm()` — can be adapted for edit validation
- `formatAED()` — for displaying monetary values in summary

### Established Patterns
- **Class-based components** with constructor, public methods, private `_render` helpers
- **Pico CSS** for base styling, custom CSS in `main.css` for app-specific needs
- **Store pattern**: Actions update state → subscribers re-render → auto-persist to localStorage
- **Blur validation**: Errors show on field blur, clear on input after error
- **Component composition**: `AppContainer` owns form and list, coordinates between them

### Integration Points
- Summary component needs to subscribe to Store for live updates
- Edit mode needs to integrate with existing contributor card rendering
- Delete action needs Store method and re-render trigger
- `Store` needs new actions: `updateContributor(id, data)` and `deleteContributor(id)`
- Responsive summary needs CSS grid/flexbox with breakpoint handling

</code_context>

<specifics>
## Specific Ideas

- "Fast editing is important — organizer often needs to fix typos or adjust amounts after initial entry"
- "Full details in delete confirmation help prevent accidental deletes of similar-named contributors"
- "Live summary updates help organizer see immediate impact of edits on bank totals"

</specifics>

<deferred>
## Deferred Ideas

- Marking contributors as "received" — Phase 4 (Distribution)
- Per-person printable distribution list — Phase 4 (DIST-03)
- Undo for deletes — noted but not implemented (no recovery decision)
- Bulk edit operations — future enhancement, not in scope

</deferred>

---

*Phase: 03-display-edit*
*Context gathered: 2026-03-12*
