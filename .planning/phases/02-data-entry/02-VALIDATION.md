---
phase: 2
slug: data-entry
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x |
| **Config file** | vitest.config.js |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~5 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 2-01-01 | 01 | 0 | VAL-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 2-01-02 | 01 | 0 | VAL-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 2-02-01 | 02 | 1 | CONT-01 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 2-02-02 | 02 | 1 | CONT-02 | unit | `npm test` | ❌ W0 | ⬜ pending |
| 2-03-01 | 03 | 2 | CONT-05 | integration | `npm test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/` directory created
- [ ] `tests/validation.test.js` — denomination validation tests (VAL-01, VAL-02)
- [ ] `tests/ContributorForm.test.js` — form component tests (CONT-01, CONT-02)
- [ ] `tests/AppContainer.test.js` — integration tests (CONT-05)
- [ ] Vitest already configured (existing)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual feedback clarity | UI-01 | Visual design judgment | 1. Open form 2. Enter mismatched values 3. Verify error message is clear and helpful |
| Scrollable list UX | UI-02 | Browser rendering | 1. Add 20+ contributors 2. Verify smooth scrolling 3. Check list doesn't break layout |

*All other phase behaviors have automated verification.*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
