---
phase: 5
slug: data-management
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 5 — Validation Strategy

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
| 05-00-01 | 00 | 0 | PERS-04, PERS-05 | unit | `npm test -- DataManager.test.js` | No - Wave 0 | pending |
| 05-00-02 | 00 | 0 | UX-04 | unit | `npm test -- ThemeManager.test.js` | No - Wave 0 | pending |
| 05-01-01 | 01 | 1 | PERS-04 | unit | `npm test -- DataManager.test.js` | No - Wave 0 | pending |
| 05-02-01 | 02 | 2 | PERS-05 | unit | `npm test -- DataManager.test.js` | No - Wave 0 | pending |
| 05-03-01 | 03 | 3 | UX-04 | unit | `npm test -- ThemeToggle.test.js` | No - Wave 0 | pending |

*Status: pending - green - red - flaky*

---

## Wave 0 Requirements

- [ ] `src/components/DataManager.test.js` — tests for PERS-04 (export) and PERS-05 (import)
- [ ] `src/modules/theme/ThemeManager.test.js` — tests for UX-04 theme management
- [ ] `src/components/ThemeToggle.test.js` — tests for theme toggle component
- [ ] `src/modules/theme/ThemeManager.js` — theme management module

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| File download works in browser | PERS-04 | Requires browser file API | Click export, verify JSON file downloads with correct content |
| File upload works in browser | PERS-05 | Requires browser file picker | Click import, select file, verify data loads |
| Theme transitions smoothly | UX-04 | Visual verification | Toggle theme, verify no flash, colors change smoothly |
| Theme persists after reload | UX-04 | Requires page reload | Set theme, reload page, verify theme persists |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
