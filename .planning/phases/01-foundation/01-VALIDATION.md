---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 3.x |
| **Config file** | `vitest.config.ts` — Wave 0 installs |
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
| 1-01-01 | 01 | 1 | PERS-01, PERS-02 | unit | `npm test -- storage` | ❌ W0 | ⬜ pending |
| 1-01-02 | 01 | 1 | VAL-03 | unit | `npm test -- money` | ❌ W0 | ⬜ pending |
| 1-02-01 | 02 | 2 | UX-02 | unit | `npm test -- format` | ❌ W0 | ⬜ pending |
| 1-02-02 | 02 | 2 | PERS-03 | unit | `npm test -- errors` | ❌ W0 | ⬜ pending |
| 1-03-01 | 03 | 3 | UX-01 | visual | `npm run dev` + manual check | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — Vitest configuration with path aliases
- [ ] `src/lib/money.test.ts` — Money class unit tests (integer arithmetic)
- [ ] `src/lib/storage.test.ts` — SafeStorage wrapper tests
- [ ] `src/lib/format.test.ts` — AED currency formatting tests
- [ ] `package.json` — vitest dependency and test script

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Responsive layout on mobile | UX-01 | Requires visual rendering | Open app on mobile device or Chrome DevTools mobile viewport. Verify all elements fit screen, text is readable, no horizontal scroll. |
| localStorage quota error handling | PERS-03 | Requires quota simulation | Fill localStorage with dummy data until quota exceeded, then attempt save. Verify graceful error message displayed. |
| Private browsing mode fallback | PERS-03 | Requires Safari private window | Open app in Safari private window. Verify app works with in-memory fallback (no persistence). |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
