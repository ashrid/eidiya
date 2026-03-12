---
phase: 4
slug: distribution
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.0.18 |
| **Config file** | vite.config.js (implicit) |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DIST-01 | unit | `npm test -- schema.test.js` | Yes | pending |
| 04-01-02 | 01 | 1 | DIST-01 | unit | `npm test -- selectors.test.js` | Yes (extend) | pending |
| 04-02-01 | 02 | 2 | DIST-01 | unit | `npm test -- ContributorCard.test.js` | Yes (extend) | pending |
| 04-02-02 | 02 | 2 | DIST-02 | unit | `npm test -- DistributionPanel.test.js` | No - Wave 0 | pending |
| 04-03-01 | 03 | 3 | DIST-03 | unit | `npm test -- DistributionPrintView.test.js` | No - Wave 0 | pending |

*Status: pending - green - red - flaky*

---

## Wave 0 Requirements

- [ ] `src/components/DistributionPanel.test.js` — tests for DIST-02 panel rendering
- [ ] `src/components/DistributionPrintView.test.js` — tests for DIST-03 print view
- [ ] `src/modules/state/selectors.test.js` — extend for distribution selectors
- [ ] `src/components/ContributorCard.test.js` — extend for received toggle

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Print CSS hides UI chrome | DIST-03 | Visual verification needed | Open print preview, verify no buttons/nav visible |
| Print layout readability | DIST-03 | Paper output quality | Print to PDF, check formatting and readability |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
