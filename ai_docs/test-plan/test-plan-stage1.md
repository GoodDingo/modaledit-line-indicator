# Test Plan - Stage 1: Prerequisites & Understanding

**Time Estimate:** 1-2 hours
**Difficulty:** Easy
**Dependencies:** None
**Can Skip?** ❌ NO - This is foundational

---

## Objective

Establish foundational understanding of:
1. VS Code extension testing limitations (CRITICAL)
2. Current extension architecture
3. The bug we're fixing
4. Development environment setup

**WHY THIS MATTERS:** Without understanding testing limitations, you'll waste time trying to test things that are impossible to test with VS Code API.

---

## Prerequisites

Before starting this stage:
- [ ] VS Code installed (version 1.106.0+)
- [ ] Node.js installed (version 20+)
- [ ] Git repository cloned
- [ ] ModalEdit extension installed in VS Code
- [ ] Basic TypeScript knowledge
- [ ] Basic understanding of VS Code extensions

---

## Instructions

### Step 1: Read Critical Research Document (30-45 min)

**File to read:** `research/vscode-plugin-yo-with-tests.md`

**What to focus on:**
1. Section 4.2: "The Core Validation Challenge: The 'Un-queryable UI'"
2. Section 4.3: "Strategy 1: API-Level Validation (Mocking)"
3. Section 4.4: "Strategy 2: True UI-Level Visual Validation"
4. Table 1: Comparative Analysis of Testing Strategies

**Critical Quote to Remember:**

> "The VS Code extension API is 'write-only' for decorations. An extension can call `TextEditor.setDecorations()` to apply a style, but there is no corresponding `TextEditor.getDecorations()` method."

**What This Means:**

✅ **CAN test:** Extension activation, commands, events, configuration, state changes, API calls

❌ **CANNOT test:** Decoration colors, visual appearance, border styles, theme compatibility

---

### Step 2: Understand Current Architecture (20-30 min)

**File to read:** `CLAUDE.md`

**Key Architecture Points:**
1. Single-class design (`ModalEditLineIndicator`)
2. Mode detection via context query: `getContext('modaledit.normal')`
3. Event-driven updates with 10ms debounce
4. Two decoration types (normal/insert)

---

### Step 3: Understand the Bug (10 min)

**Current Behavior:**
- Line highlighting WORKS
- Color is ALWAYS red (insert mode)
- Color NEVER changes to green (normal mode)

**Root Cause (suspected):**
- `isInNormalMode()` always returns `false`

---

### Step 4: Review Test Infrastructure (15 min)

**Files to examine:**
- `.vscode-test.cjs` - Test configuration
- `package.json` - Test scripts
- `src/test/suite/extension.test.ts` - Existing 5 tests

**Note:** Uses Mocha TDD syntax (`suite`/`test`), not BDD (`describe`/`it`)

---

### Step 5: Set Up Development Environment (15-20 min)

```bash
make install    # Install dependencies
make compile    # Compile TypeScript
make test       # Run existing tests (should pass)
```

**Verify:**
1. Press F5 → Extension Development Host launches
2. Open file → Line is red
3. Switch to normal mode (Escape) → Line stays red (BUG)

---

## Gotchas

❌ **Don't try to test decoration colors** - API doesn't support it
❌ **Don't use BDD syntax** - This repo uses TDD
❌ **Don't forget async/await** - VS Code API is heavily async
❌ **Don't skip cleanup** - Always dispose resources

---

## Validation Checklist

- [ ] Read and understood research document Section 4
- [ ] Understand what CAN vs CANNOT be tested
- [ ] Read and understood CLAUDE.md architecture
- [ ] Dependencies installed and tests pass
- [ ] Reproduced the bug in Extension Development Host
- [ ] Confirmed ModalEdit is installed and working

---

## Next Steps

✅ **Proceed to Stage 2:** Add Logging Infrastructure
