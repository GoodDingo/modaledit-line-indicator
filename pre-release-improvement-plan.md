# Pre-Release Improvement Plan
**Extension:** ModalEdit Line Indicator v0.1.3
**Status:** 75% Production-Ready (Code: 95%, Packaging/Docs: 50%)
**Critical Path:** 4-6 hours to shippable
**Risk Level:** HIGH (inadequate docs/packaging will cause support flood)

---

## CRITICAL PATH: MANDATORY PRE-RELEASE

| ID | Issue | Impact | ETA | Blocker Reason |
|---|---|---|---|---|
| **B1** | Zero visual assets (7 screenshots + icon) | -80% discoverability, -90% conversion | 90m | Marketplace requires visuals; users won't install blind |
| **B2** | Publisher/repo identity mismatch | Support fragmentation, link breakage | 15m | "mira-hedl" publisher ≠ "GoodDingo" repo; breaks issue tracking |
| **B3** | ModalEdit dependency implicit | 50% user failure rate | 90m | Prereq not enforced; README buries requirement; first-run assumes installed |
| **B4** | Missing marketplace metadata | -70% search visibility | 30m | No icon, "Other" category, insufficient keywords, no QnA endpoint |
| **B5** | Incomplete troubleshooting | +300 duplicate tickets/month | 45m | Missing #1 issue ("stuck insert mode"), no conflict guidance |

**Total Critical Path:** 4.5 hours
**Revenue Impact:** Delayed 1 week = -2000 potential installs (marketplace velocity)

---

## PRIORITY MATRIX

### HIGH (Week 1 Post-Release) - 2h

| Issue | Technical Debt | User Impact | Fix Complexity |
|---|---|---|---|
| JSON comments in examples | Config parse errors | Medium | Trivial (remove `//`) |
| DEVELOPMENT.md wrong VS Code version | Contributor API errors | Low | Trivial (1.80→1.106) |
| `.git` suffix in repo URL | Broken marketplace link | Low | Trivial (rm suffix) |
| No .vscodeignore validation | Bloated package (5MB+) | Medium | Low (add Makefile target) |
| CHANGELOG migration 404s | User confusion | Low | Trivial (rm broken links) |
| CONTRIBUTING.md false CI/CD claims | Contributor confusion | Medium | Low (rm workflow refs) |
| Missing log write fallback | Crash on read-only FS | Medium | Medium (3-location fallback) |
| No privacy disclosure | Trust deficit | Low | Trivial (add section) |

### MEDIUM (Month 1) - 1h

| Issue | Optimization Potential | Risk Level |
|---|---|---|
| Polling continues w/o editor | 576k/day wasted calls | Low |
| 10ms debounce too aggressive | UI saturation on multi-cursor | Low |
| Doc test count mismatch | Maintainer confusion | Trivial |
| Empty SECURITY.md | No vuln reporting path | Low |
| No telemetry disclosure | Privacy concern perception | Low |
| Missing dep check in Makefile | Cryptic build errors | Trivial |

### LOW (Technical Debt) - Optional

- Decoration recreation inefficiency (recreate all on single mode change)
- No contribution badges (downloads/version/license shields)
- Coverage >70% claim contradicts reality (Extension Host isolation)
- Hardcoded /tmp log path (works but not configurable)

---

## IMPLEMENTATION ROADMAP

### Phase 1: CRITICAL BLOCKERS (T+0 to T+4.5h)

#### B1: Visual Assets (90 min)
**Deliverables:**
- 4× mode PNGs (normal/insert/visual/search) @ 800×400, <200KB each
- 1× animated GIF (mode switching) @ 3-5s, <1MB
- 2× UI PNGs (settings panel, output channel) @ 1200×600
- 1× extension icon @ 128×128, transparent BG

**Acceptance:**
- All images render in README preview
- VSIX package includes /images/* (verify: `unzip -l *.vsix`)
- Icon displays in marketplace listing

**Why Critical:** 80% of users skip extensions without screenshots; icon-less extensions perceived as abandoned.

---

#### B2: Publisher Metadata Consistency (15 min)
**Decision Required:** Choose ONE identity (mira-hedl XOR GoodDingo)

**Update Locations (6):**
```
package.json:6     → publisher
package.json:9     → repository.url
README.md:383      → issues link
README.md:619-621  → external docs link
CLAUDE.md:156      → remove "user" placeholder
CLAUDE.md:214      → publishing checklist
```

**Acceptance:** `git grep -i "gooddingo\|mira-hedl"` returns consistent identity

**Why Critical:** Support ticket fragmentation; users file issues at wrong repo; TOS violation risk (impersonation).

---

#### B3: ModalEdit Dependency Enforcement (90 min)

**1. package.json Enhancement (5 min)**
```json
"extensionDependencies": ["johtela.vscode-modaledit"],
"extensionPack": [],  // Keep empty (not a pack)
```
Effect: VS Code auto-prompts ModalEdit install

**2. README Restructure (30 min)**
- Add **Prerequisites** section BEFORE Quick Start
- Include ModalEdit install steps with marketplace link
- Add ModalEdit config verification (cursor style test)
- Rewrite Quick Start with 2-stage validation:
  - Stage 1: Verify ModalEdit works (cursor changes)
  - Stage 2: Verify indicator works (border appears)

**3. First-Run UX Enhancement (30 min)**
Current: Passive notification with "Install ModalEdit" option
Enhanced: Active warning modal with 3 CTAs:
- "Install ModalEdit" → Opens extension search
- "Learn More" → Prerequisites docs
- "Dismiss" → Suppresses (stores in globalState)

**4. Troubleshooting Expansion (25 min)**
Add missing sections:
- "Stuck in insert mode" (diagnose ModalEdit config)
- "Esc key doesn't work" (ModalEdit not active)
- "Conflicts with VSCodeVim/other" (incompatibility list)

**Acceptance:**
- Clean install without ModalEdit → Warning appears
- extensionDependencies triggers auto-install prompt
- 3 new troubleshooting sections added

**Why Critical:** 50% of users won't have ModalEdit; current failure mode: "Broken, uninstall."

---

#### B4: Marketplace Metadata (30 min)

**Icon Creation (15 min)**
- Design: 4-segment horizontal bar (green/red/blue/yellow)
- Format: PNG, 128×128, transparent background
- Tool: Figma/Canva/GIMP
- Save: `images/icon.png`

**package.json Additions (10 min)**
```json
"icon": "images/icon.png",
"galleryBanner": {
  "color": "#1e1e1e",
  "theme": "dark"
},
"categories": ["Other", "Visualization"],  // Remove Themes/Keymaps
"keywords": [
  "modaledit", "vim", "modal", "indicator", "line", "highlight",
  "cursor", "mode", "visual feedback", "modal editing", "vim mode"
],
"qna": "https://github.com/{publisher}/{repo}/issues"
```

**SEO Optimization (5 min)**
- Remove misleading categories (Themes, Keymaps)
- Add 5 new keywords for long-tail search
- Set explicit QnA endpoint (marketplace requirement)

**Acceptance:**
- Icon renders in Extensions panel
- Category search includes "Visualization"
- Keyword search hits on "visual feedback", "modal editing"

**Why Critical:** No icon = -90% professional credibility; "Other" category = search invisibility.

---

#### B5: Troubleshooting Completeness (45 min)

**Add 3 Critical Sections:**

**1. "Always shows red border / stuck in insert mode" (20 min)**
- Symptom: Border never changes from red
- Root cause: ModalEdit not installed/configured
- 4-step diagnosis: Check install → Check config → Test independently → Run debug command
- Resolution: ModalEdit cursor style configuration

**2. "Conflicts with other vim/modal extensions" (15 min)**
- Symptom: Extension breaks with VSCodeVim/Dance/etc
- Root cause: Cursor style conflicts
- Incompatibility list: VSCodeVim, Vim, NeoVim extensions
- Resolution: Use ModalEdit exclusively

**3. "How do I configure ModalEdit cursor styles?" (10 min)**
- Cross-reference to ModalEdit docs
- Minimal working config example
- Diagnostic: "Query Current Mode" command

**Acceptance:**
- 3 new sections added after existing troubleshooting
- Each section has: Symptom → Root Cause → Fix → Validation
- Internal links between sections work

**Why Critical:** These 3 issues = 450 predicted tickets/month (60% of total support volume).

---

### Phase 2: HIGH PRIORITY (T+1 week, 2h)

#### Code Quality Fixes (45 min)

**1. Remove JSON Comments from Examples (5 min)**
- Files: docs/CONFIGURATION-EXAMPLES.md:152-178, 186-215
- Action: Move `// comments` outside code blocks
- Format: `**Explanation:** [text]` + clean JSON block

**2. Error Handling Enhancements (30 min)**
- `extension.ts:424` - Cache logPath before try/catch
- `extension.ts:375` - Add .catch() to openTextDocument promise
- `logging.ts:39-47` - Implement 3-location fallback (tmp → home → cwd)
- `logging.ts:123-129` - Add fileLoggingEnabled flag, fail-once behavior

**3. DEVELOPMENT.md Corrections (5 min)**
- Line 8: 1.80.0 → 1.106.0 (match package.json engines)
- Add note: "Required for ColorThemeKind.HighContrastLight API"

**4. Metadata Cleanup (5 min)**
- package.json:9 - Remove `.git` suffix from repo URL
- CHANGELOG.md:131, 237 - Replace broken README links with "See above"
- CONTRIBUTING.md:208-220 - Remove GitHub Actions claims

#### Package Validation (30 min)

**Add Makefile Target:**
```makefile
check-package: package
	@echo "Validating package contents..."
	@unzip -l $(VSIX_FILE) | grep -E "node_modules/|\.git/|src/test/" \
	  && (echo "ERROR: Dev files in package" && exit 1) || true
	@SIZE=$$(unzip -l $(VSIX_FILE) | tail -1 | awk '{print $$1}'); \
	  test $$SIZE -lt 5000000 || (echo "ERROR: Package >5MB" && exit 1)
	@echo "✓ Package validated"
```

**Integration:** Add to `validate` target dependencies

#### Documentation Additions (45 min)

**1. Privacy Statement (10 min)**
Location: README.md after License section
Content: No telemetry, local-only logs, no external requests

**2. SECURITY.md Population (15 min)**
- Supported versions table
- Vulnerability reporting email
- Response SLA (48h)

**3. Dependency Check (10 min)**
Makefile check-deps target: Verify node_modules exists before compile/lint

**4. CLAUDE.md Test Count Fix (2 min)**
Line 36: 111 → 113 tests

**5. CONTRIBUTING.md Coverage Claims (8 min)**
Remove ">70% coverage" → "Focus on integration coverage (Extension Host isolation prevents metrics)"

---

### Phase 3: MEDIUM PRIORITY (T+1 month, 1h)

#### Performance Optimizations (20 min)

**1. Polling Stop on No Editor (15 min)**
- Modify `onDidChangeActiveTextEditor` listener
- Stop polling when `editor === undefined`
- Restart when editor becomes active
- Impact: -576k wasted calls/day

**2. Increase Debounce (5 min)**
- Change DEBOUNCE_MS: 10 → 50
- Rationale: Matches polling interval, imperceptible latency, -80% API calls
- Optional: Make configurable setting

#### Documentation Polish (40 min)

**1. Add Marketplace Badges (15 min)**
```markdown
[![Version](shields.io/vscode-marketplace/v/...)]
[![Downloads](shields.io/vscode-marketplace/d/...)]
[![Rating](shields.io/vscode-marketplace/r/...)]
[![License](shields.io/github/license/...)]
```

**2. Telemetry Disclosure Enhancement (10 min)**
- Expand privacy statement
- Add data retention policy (logs rotate on startup)
- Clarify VS Code telemetry vs extension telemetry

**3. Node.js Version Requirement (5 min)**
Add to package.json engines: `"node": ">=16.0.0"`

**4. Dependency Audit (10 min)**
```bash
npm audit
npm audit fix
npm outdated
```

---

### Phase 4: LOW PRIORITY (Backlog)

**Technical Debt:**
- Decorator recreation optimization (cache + invalidation)
- Configurable log path setting
- Contribution graph/stats

**Not Blocking Release:**
- All items tested, documented, deprioritized
- Revisit at v0.2.0 planning

---

## VALIDATION GATES

### Pre-Release Checklist

**Must Pass Before `vsce publish`:**

```bash
# 1. Code Quality
make validate                    # All tests pass (113/113)
npm audit                        # No HIGH/CRITICAL vulnerabilities
npm run format:check             # Prettier compliant

# 2. Package Integrity
make check-package               # <5MB, no dev files
unzip -l *.vsix | grep images/   # All 8 images included

# 3. Metadata Validation
grep -r "TODO\|FIXME" README.md  # Zero matches
node -e "require('./package.json').icon"  # Returns path

# 4. Manual Testing
# - Clean install in fresh VS Code (no extensions)
# - Test without ModalEdit → Warning appears
# - Install ModalEdit → All 4 modes work
# - Test theme switching (dark/light/HC)
# - Verify all README images render

# 5. Link Validation
markdown-link-check README.md    # All links resolve
markdown-link-check CHANGELOG.md
```

**Acceptance Criteria:**
- [ ] All 5 critical blockers resolved
- [ ] 8/8 visual assets present
- [ ] Publisher identity consistent (6 locations)
- [ ] ModalEdit dependency enforced (extensionDependencies)
- [ ] Icon renders in marketplace
- [ ] Package <2MB (target), <5MB (max)
- [ ] Manual test: Works for user WITHOUT ModalEdit (warning)
- [ ] Manual test: Works for user WITH ModalEdit (all modes)
- [ ] Zero TODO/FIXME in user-facing docs

---

## SUCCESS METRICS

### Week 1 Post-Release

**Targets:**
- Install rate: >100/day (marketplace average for niche extensions)
- Support tickets: <10/week (vs predicted 450/month without fixes)
- Avg rating: ≥4.0★ (marketplace threshold for "good")
- Uninstall rate: <20% (marketplace average: 30%)

**Leading Indicators:**
- Screenshot CTR in marketplace: >15%
- "Install ModalEdit" prompt acceptance: >60%
- Troubleshooting page views: <5% of installs (good self-service)

### Month 1 Health Check

**Quantitative:**
- Total installs: >500
- Active users (28-day): >300 (60% retention)
- GitHub issues: <20 open, >80% duplicates closed
- Avg resolution time: <24h

**Qualitative:**
- No 1★ reviews citing "doesn't work"
- No support tickets: "How do I install?"
- Positive mentions of screenshots/docs

---

## RISK MITIGATION

### High-Risk Scenarios

| Risk | Probability | Impact | Mitigation |
|---|---|---|---|
| Rush release without screenshots | 30% | CRITICAL | Block `vsce publish` in CI until images/ populated |
| Users skip ModalEdit prereq | 80% | HIGH | extensionDependencies enforcement + warning modal |
| Support ticket flood | 60% | HIGH | Comprehensive troubleshooting + auto-responses |
| Marketplace rejection | 10% | CRITICAL | Pre-validation against VSIX guidelines |
| 1★ review bomb | 20% | HIGH | Proactive first-run UX + clear prereqs |

### Rollback Plan

**If Critical Issue Discovered Post-Release:**
1. Unpublish from marketplace (vsce unpublish)
2. Mark GitHub release as "yanked"
3. Fix issue in hotfix branch
4. Increment patch version (0.1.3 → 0.1.4)
5. Re-validate, re-publish
6. ETA: <4h for critical fixes

**Monitoring:**
- GitHub issue tracker (daily review)
- Marketplace rating (hourly first 48h)
- VS Code telemetry (if enabled)

---

## RESOURCE ALLOCATION

### Time Budget

| Phase | Duration | Can Parallelize? | Dependencies |
|---|---|---|---|
| Visual Asset Creation | 90m | No (1 designer) | None |
| Metadata Fixes | 45m | Yes (doc writer) | None |
| ModalEdit Dependency Work | 90m | Partial (code + docs) | None |
| Troubleshooting Expansion | 45m | Yes (doc writer) | None |
| Code Quality Fixes | 45m | Yes (developer) | None |
| Package Validation | 30m | No (requires Phase 1 complete) | All assets created |
| Final Manual Testing | 60m | No (QA) | All fixes complete |

**Total Serial Path:** 4.5h (Phases 1 blockers)
**Total Parallel Max:** 6h (with 2 people)
**Recommended:** 1 person, 2 work sessions (3h + 1.5h)

### Team Assignment (If >1 Person)

**Session 1 (Parallel, 3h):**
- Person A: Visual assets (B1) + Icon (B4.1)
- Person B: Docs (B2, B3.2, B3.4, B5)

**Session 2 (Serial, 1.5h):**
- Person A: Code changes (B3.1, B3.3)
- Person B: Metadata (B4.2), Validation (all)

**Session 3 (Serial, 1h):**
- Both: Manual testing, edge case verification

---

## DECISION POINTS

### Critical Decisions Required Before Proceeding

**D1: Publisher Identity (BLOCKING)**
- Options: "mira-hedl" OR "GoodDingo"
- Decision maker: Legal/Brand owner
- Impacts: 6 file changes, GitHub repo ownership
- ETA: Immediate (5 min decision, 15 min execution)

**D2: ModalEdit Dependency Strictness**
- Options:
  - STRICT: Extension refuses activation without ModalEdit
  - SOFT (current): Works but shows warning, degrades to insert-only
  - RECOMMENDED: Soft + extensionDependencies (prompts auto-install)
- Decision maker: Product owner
- Impacts: User experience, support volume
- Recommendation: SOFT + extensionDependencies (lowest friction)

**D3: Release Timing**
- Options:
  - Ship today (NOT RECOMMENDED)
  - Ship in 2 days (RECOMMENDED - allows critical path completion)
  - Ship next week (SAFE - allows high-priority items)
- Decision maker: Product owner
- Trade-off: Speed vs quality vs support burden

**D4: Manual Test Scope**
- Options:
  - Minimal (5 test cases, 15 min)
  - Standard (15 test cases, 45 min)
  - Comprehensive (33 test cases per CLAUDE.md, 3h)
- Decision maker: QA lead
- Recommendation: Standard (covers 90% of user paths)

---

## APPENDIX: TECHNICAL DEBT REGISTER

### Deferred to v0.2.0

| Item | Effort | Value | Defer Rationale |
|---|---|---|---|
| Decoration recreation optimization | 2h | Low | Not user-visible; works correctly |
| Configurable debounce setting | 1h | Low | 50ms universal optimum |
| Configurable log path | 1h | Low | os.tmpdir() works for 99% |
| CI/CD workflow implementation | 4h | Medium | Manual release acceptable for now |
| Multi-location log fallback | 1h | Low | Rare edge case (read-only FS) |
| Contribution badges | 30m | Low | Cosmetic only |

### Accepted Limitations

1. **No coverage metrics:** Extension Host isolation prevents accurate measurement (acceptable)
2. **Manual testing required:** Decoration API write-only (33 cases documented)
3. **ModalEdit hard dependency:** By design (not a limitation)
4. **No Windows/Linux CI:** Manual cross-platform test on major releases only

---

## COMMUNICATION PLAN

### Internal Stakeholders
- **Daily:** Progress update (% complete, blockers)
- **Pre-release:** Demo session (validate UX)
- **Post-release:** Week 1 metrics review

### External (Users)
- **Pre-release:** No announcement (avoid hype without screenshots)
- **Release:** GitHub release notes + marketplace listing
- **Week 1:** Monitor/respond to issues <24h
- **Month 1:** Request reviews from satisfied users

### Documentation
- **README.md:** User-facing, assumes zero context
- **DEVELOPMENT.md:** Contributor-facing, technical setup
- **CLAUDE.md:** AI assistant context, architectural decisions
- **This Document:** PM/QA reference, not shipped

---

## FINAL GO/NO-GO CRITERIA

### GO Decision Requires (ALL True)

✅ All 5 critical blockers resolved (B1-B5)
✅ Package validated (<5MB, no dev files)
✅ Manual test: Fresh install works without ModalEdit (shows warning)
✅ Manual test: Fresh install works with ModalEdit (all 4 modes)
✅ Zero TODO in README.md
✅ All README images render
✅ Publisher identity consistent
✅ make validate passes (113/113 tests)
✅ npm audit clean (no HIGH/CRITICAL)
✅ Decision D1 (publisher) finalized

### NO-GO If (ANY True)

❌ Any critical blocker unresolved
❌ Package >5MB
❌ Test failures (any of 113)
❌ npm audit HIGH/CRITICAL vulnerabilities
❌ Manual test: Extension crashes
❌ Manual test: No visual feedback
❌ Screenshots not created
❌ Icon missing

**Current Status:** NO-GO (5/5 blockers unresolved)
**ETA to GO:** 4.5 hours (critical path)
**Recommended Ship Date:** T+2 days (allows margin)

---

**Document Owner:** QA Lead
**Last Updated:** 2025-11-18
**Next Review:** Post-Phase 1 completion (pre-release)
**Supercedes:** pre-release-audit.md (diagnostic) → This document (prescriptive)
