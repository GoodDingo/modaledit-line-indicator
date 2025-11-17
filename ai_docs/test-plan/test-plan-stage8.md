# Test Plan - Stage 8: Manual Testing Documentation

**Time Estimate:** 1-2 hours
**Difficulty:** Easy
**Dependencies:** None (can be done in parallel with other stages)
**Can Skip?** ❌ NO - Required for visual verification

---

## Objective

Create comprehensive manual testing documentation for visual verification of decoration colors and appearance.

**WHY THIS MATTERS:** Automated tests CANNOT verify decoration colors (API limitation). Manual testing is the ONLY way to verify visual appearance.

---

## Prerequisites

- [ ] Understand testing limitations (Stage 1)
- [ ] Bug is fixed (Stage 4)
- [ ] Extension works correctly

---

## What We're Creating

**File:** `ai_docs/MANUAL-TESTING.md`

This will be a comprehensive checklist that humans can follow to verify visual appearance.

---

## Instructions

### Step 1: Create Manual Testing Document (90 min)

**Create file:** `ai_docs/MANUAL-TESTING.md`

**Content:**

```markdown
# Manual Testing Checklist for ModalEdit Line Indicator

**Purpose:** Verify visual appearance of line highlights, which cannot be automated due to VS Code API limitations.

**Last Updated:** YYYY-MM-DD

---

## Why Manual Testing?

The VS Code Extension API does not provide methods to query decoration colors or styles. Therefore, visual appearance MUST be verified manually by human observation.

**What automated tests cover:**
✅ Logic, events, state changes, error handling

**What manual tests cover:**
✅ Decoration colors, visual appearance, theme compatibility

---

## Prerequisites

Before starting manual tests:

- [ ] VS Code installed (version 1.106.0+)
- [ ] ModalEdit extension installed
- [ ] ModalEdit Line Indicator extension installed
- [ ] ModalEdit keybindings configured:
  - Escape → Normal mode
  - i/a/o → Insert mode

**How to verify ModalEdit keybindings:**
1. Open Command Palette (Cmd/Ctrl+Shift+P)
2. Type "Preferences: Open Keyboard Shortcuts"
3. Search for "modaledit"
4. Verify keybindings are set

---

## Test Environment Setup

1. **Open VS Code**
2. **Open any file** (or create test file with content)
3. **Open Output Channel:**
   - View → Output
   - Select "ModalEdit Line Indicator" from dropdown
4. **Open Debug Console:** View → Debug Console
5. **Verify activation:**
   - Look for "=== ACTIVATION COMPLETE ===" in output

---

## Test 1: Basic Mode Detection

### Test 1.1: Normal Mode (Green)

**Steps:**
1. Press `Escape` (enter normal mode)
2. **Verify ModalEdit status bar** shows "NORMAL" mode
3. **Verify line highlight:**
   - Background: Semi-transparent green
   - Border: Solid green (2px by default)
   - Entire current line is highlighted

**Expected:**
- ✅ Line has GREEN tint
- ✅ Green border visible on left
- ✅ Highlight follows cursor position

**If FAIL:**
- Check Output channel for errors
- Run command: "Query Current Mode" → Should show "NORMAL (green)"
- Check ModalEdit is in normal mode (status bar)

---

### Test 1.2: Insert Mode (Red)

**Steps:**
1. Press `i` (enter insert mode)
2. **Verify ModalEdit status bar** shows "INSERT" mode
3. **Verify line highlight:**
   - Background: Semi-transparent red
   - Border: Solid red (2px by default)
   - Entire current line is highlighted

**Expected:**
- ✅ Line has RED tint
- ✅ Red border visible on left
- ✅ Highlight follows cursor position

**If FAIL:**
- Check Output channel for errors
- Run command: "Query Current Mode" → Should show "INSERT (red)"
- Check ModalEdit is in insert mode (status bar)

---

## Test 2: Mode Switching

### Test 2.1: Insert → Normal

**Steps:**
1. Ensure in insert mode (red highlight)
2. Press `Escape`
3. Move cursor (press j or down arrow)
4. **Observe color change**

**Expected:**
- ✅ Color changes from RED to GREEN **immediately** after cursor movement
- ✅ Change is smooth, no flicker
- ✅ No delay or lag

---

### Test 2.2: Normal → Insert

**Steps:**
1. Ensure in normal mode (green highlight)
2. Press `i`
3. Type any character (triggers cursor movement)
4. **Observe color change**

**Expected:**
- ✅ Color changes from GREEN to RED **immediately** after typing
- ✅ Change is smooth, no flicker
- ✅ No delay or lag

---

### Test 2.3: Rapid Switching

**Steps:**
1. Rapidly press: Escape, i, Escape, i, Escape, i (6 switches)
2. Move cursor after each switch
3. **Observe color changes**

**Expected:**
- ✅ Colors track switches correctly
- ✅ No incorrect colors
- ✅ No flicker or flash of wrong color
- ✅ Smooth transitions

---

## Test 3: Cursor Movement

### Test 3.1: Vertical Movement

**Steps:**
1. Create file with 10 lines of text
2. Enter normal mode (green highlight)
3. Press `j` 5 times (move down 5 lines)
4. **Observe highlight following cursor**

**Expected:**
- ✅ Highlight moves with cursor
- ✅ Only current line is highlighted
- ✅ Previous lines are unhighlighted
- ✅ No lag or delay

---

### Test 3.2: Horizontal Movement

**Steps:**
1. Create line with 50+ characters
2. Enter normal mode
3. Press `l` repeatedly (move right)
4. **Observe highlight stays on current line**

**Expected:**
- ✅ Entire line stays highlighted
- ✅ Color doesn't change
- ✅ Highlight doesn't disappear

---

## Test 4: Wrapped Lines

**IMPORTANT:** This tests multi-line visual wrapping

### Test 4.1: Long Line Wrapping

**Steps:**
1. Make VS Code window narrow (so lines wrap)
2. Type a very long line (200+ characters, wraps to 3+ visual lines)
3. Place cursor on that line
4. Enter normal mode

**Expected:**
- ✅ **ALL wrapped portions** are highlighted (not just first visual line)
- ✅ All wrapped portions show same color
- ✅ Border appears on left of first visual line only

**This is CORRECT behavior and should be documented.**

---

## Test 5: Multiple Editors

### Test 5.1: Split Editors - Same Mode

**Steps:**
1. Open two files side by side
2. Put both in normal mode
3. Click between editors

**Expected:**
- ✅ Both show GREEN highlight
- ✅ Highlight appears in active editor
- ✅ Switching editors updates highlight correctly

---

### Test 5.2: Split Editors - Different Modes

**Steps:**
1. Open two files side by side
2. Left editor: Normal mode (green)
3. Right editor: Insert mode (red)
4. Click back and forth

**Expected:**
- ✅ Left editor shows GREEN when active
- ✅ Right editor shows RED when active
- ✅ Each editor remembers its mode
- ✅ Colors don't mix or interfere

**NOTE:** Both editors will actually be in the same ModalEdit mode (ModalEdit is global). This tests that highlight follows active editor correctly.

---

## Test 6: Configuration Changes

### Test 6.1: Change Normal Mode Color

**Steps:**
1. Open Settings (Cmd/Ctrl + ,)
2. Search: "modaledit-line-indicator.normalModeBackground"
3. Change to: `#0000ff20` (blue)
4. Enter normal mode
5. **Observe color**

**Expected:**
- ✅ Line is now BLUE (not green)
- ✅ Change applies immediately (no reload needed)
- ✅ Border color stays green (not changed)

**Cleanup:** Reset to default `#00770020`

---

### Test 6.2: Change Border Style

**Steps:**
1. Open Settings
2. Search: "modaledit-line-indicator.borderStyle"
3. Change to: `dashed`
4. **Observe border**

**Expected:**
- ✅ Border is now DASHED (not solid)
- ✅ Change applies immediately

**Try:** `dotted` → should show dotted border

**Cleanup:** Reset to `solid`

---

### Test 6.3: Change Border Width

**Steps:**
1. Open Settings
2. Search: "modaledit-line-indicator.borderWidth"
3. Change to: `5px`
4. **Observe border**

**Expected:**
- ✅ Border is thicker (5px instead of 2px)
- ✅ Change applies immediately

**Cleanup:** Reset to `2px`

---

### Test 6.4: Disable Extension

**Steps:**
1. Open Settings
2. Search: "modaledit-line-indicator.enabled"
3. Uncheck (set to false)
4. **Observe highlights**

**Expected:**
- ✅ All highlights disappear
- ✅ Extension disabled message may appear

**Re-enable:**
1. Check the box (set to true)
2. **Observe highlights**

**Expected:**
- ✅ Highlights reappear
- ✅ Correct color for current mode

---

## Test 7: Commands

### Test 7.1: Query Current Mode

**Steps:**
1. Enter normal mode
2. Open Command Palette (Cmd/Ctrl+Shift+P)
3. Run: "ModalEdit Line Indicator: Query Current Mode (Debug)"
4. **Read message**

**Expected:**
- ✅ Message shows: "Current Mode: NORMAL (green)"
- ✅ Shows ModalEdit version info

**Repeat in insert mode:**

**Expected:**
- ✅ Message shows: "Current Mode: INSERT (red)"

---

### Test 7.2: Show Log File

**Steps:**
1. Open Command Palette
2. Run: "ModalEdit Line Indicator: Show Log File"
3. Choose: "Open File"
4. **Review log contents**

**Expected:**
- ✅ Log file opens in editor
- ✅ Contains session logs
- ✅ Shows activation, mode changes, decorations applied

---

### Test 7.3: Toggle Enabled

**Steps:**
1. Open Command Palette
2. Run: "ModalEdit Line Indicator: Toggle Enabled"
3. **Observe highlights disappear**
4. Run command again
5. **Observe highlights reappear**

**Expected:**
- ✅ Toggle works correctly
- ✅ Information messages shown
- ✅ Highlights clear/reappear smoothly

---

## Test 8: Edge Cases

### Test 8.1: Empty File

**Steps:**
1. Create new file (Cmd/Ctrl + N)
2. Don't type anything (empty)
3. Enter normal mode

**Expected:**
- ✅ Highlight appears on line 1 (even though empty)
- ✅ Switching modes works

---

### Test 8.2: Very Long File

**Steps:**
1. Open file with 1000+ lines
2. Scroll to bottom
3. Enter normal mode
4. Move cursor up/down

**Expected:**
- ✅ No performance issues
- ✅ Highlight updates smoothly
- ✅ No lag or delay

---

### Test 8.3: No Active Editor

**Steps:**
1. Close all editors (Cmd/Ctrl + K, W)
2. Check Debug Console

**Expected:**
- ✅ No errors in console
- ✅ Extension doesn't crash

**Re-open editor:**

**Expected:**
- ✅ Highlight appears immediately
- ✅ Correct color for current mode

---

## Test 9: Theme Compatibility

### Test 9.1: Dark Theme

**Steps:**
1. Switch to dark theme (e.g., "Dark+")
2. Enter normal mode (green)
3. Enter insert mode (red)

**Expected:**
- ✅ Green highlight visible against dark background
- ✅ Red highlight visible against dark background
- ✅ Colors are distinguishable
- ✅ Not too bright or too dark

---

### Test 9.2: Light Theme

**Steps:**
1. Switch to light theme (e.g., "Light+")
2. Enter normal mode (green)
3. Enter insert mode (red)

**Expected:**
- ✅ Green highlight visible against light background
- ✅ Red highlight visible against light background
- ✅ Colors are distinguishable
- ✅ Not too bright or too dark

---

### Test 9.3: High Contrast Theme

**Steps:**
1. Switch to high contrast theme
2. Test both modes

**Expected:**
- ✅ Highlights still visible
- ✅ Don't clash with high contrast colors
- ✅ If hard to see, adjust opacity in settings

---

## Test 10: Performance

### Test 10.1: Rapid Cursor Movement

**Steps:**
1. Create file with 100+ lines
2. Hold down `j` (or down arrow) for 5 seconds
3. **Observe performance**

**Expected:**
- ✅ No lag or stutter
- ✅ Highlight follows smoothly
- ✅ CPU usage normal (check Activity Monitor/Task Manager)

---

### Test 10.2: Rapid Mode Switching

**Steps:**
1. Rapidly press Escape, i, Escape, i for 10 seconds
2. Move cursor after each switch
3. **Observe performance**

**Expected:**
- ✅ No lag or freeze
- ✅ Colors update smoothly
- ✅ No memory leaks (memory usage stable)

---

### Test 10.3: Many Open Files

**Steps:**
1. Open 10+ files
2. Switch between them
3. Enter different modes
4. **Observe performance**

**Expected:**
- ✅ No slowdown
- ✅ Each file highlights correctly
- ✅ Switching files is smooth

---

## Test 11: Regression Testing

**Run after any code changes:**

**Quick regression test** (10 minutes):
1. Test 1: Basic mode detection (both modes)
2. Test 2.1: Mode switching (insert → normal)
3. Test 2.2: Mode switching (normal → insert)
4. Test 4.1: Wrapped lines
5. Test 6.4: Disable/enable
6. Test 7.1: Query mode command

**If all pass:** Changes likely safe

**If any fail:** Investigate thoroughly

---

## Known Limitations

### Limitation 1: Mode Change Without Cursor Movement

**Behavior:**
- If you switch modes WITHOUT moving cursor, highlight might not update until next cursor movement

**Reason:**
- Extension uses cursor movement as proxy for mode changes (documented in architecture)

**Workaround:**
- Move cursor after switching modes
- This is by design, not a bug

---

### Limitation 2: Search Mode

**Behavior:**
- ModalEdit's search mode shows same color as normal mode (green)

**Reason:**
- ModalEdit sets `modaledit.normal = true` for search mode
- Extension cannot distinguish search from normal

**Workaround:**
- None currently
- Would require ModalEdit to expose separate search mode context

---

## Troubleshooting

### Problem: Colors don't change

**Check:**
1. Is ModalEdit installed? (Extensions panel)
2. Is ModalEdit active? (Check status bar)
3. Are you moving cursor after switching modes?
4. Run "Query Current Mode" - what does it show?
5. Check Output channel for errors

---

### Problem: Wrong colors

**Check:**
1. Check settings - are colors customized?
2. Reset to defaults
3. Reload VS Code
4. Check theme compatibility

---

### Problem: No highlight at all

**Check:**
1. Is extension enabled? (Settings)
2. Is extension activated? (Check Output channel)
3. Run "Toggle Enabled" twice
4. Reload VS Code window

---

## Test Results Template

**Use this to document test results:**

```
Date: ___________
VS Code Version: ___________
ModalEdit Version: ___________
Extension Version: ___________
OS: ___________
Theme: ___________

Test 1 - Basic Mode Detection: ✓ / ✗
Test 2 - Mode Switching: ✓ / ✗
Test 3 - Cursor Movement: ✓ / ✗
Test 4 - Wrapped Lines: ✓ / ✗
Test 5 - Multiple Editors: ✓ / ✗
Test 6 - Configuration Changes: ✓ / ✗
Test 7 - Commands: ✓ / ✗
Test 8 - Edge Cases: ✓ / ✗
Test 9 - Theme Compatibility: ✓ / ✗
Test 10 - Performance: ✓ / ✗

Issues Found:
1. ___________
2. ___________

Overall Result: PASS / FAIL

Notes:
___________________________________________
___________________________________________
```

---

## Success Criteria

Extension passes manual testing when:

- ✅ All tests pass
- ✅ Colors change correctly between modes
- ✅ No visual glitches or flickers
- ✅ Performance is smooth
- ✅ Works in both light and dark themes
- ✅ All commands work
- ✅ Configuration changes apply immediately
- ✅ No console errors

---

**Testing complete? Proceed to validation in Stage 9!**
```

---

## Validation Checklist

### Document Created
- [ ] `ai_docs/MANUAL-TESTING.md` created
- [ ] All test sections included
- [ ] Test steps are clear and detailed
- [ ] Expected results specified
- [ ] Troubleshooting section included

### Document Quality
- [ ] Tests are comprehensive
- [ ] Instructions are clear for junior developers
- [ ] Known limitations documented
- [ ] Troubleshooting guide helpful
- [ ] Test results template provided

### Coverage
- [ ] Basic mode detection
- [ ] Mode switching
- [ ] Cursor movement
- [ ] Wrapped lines
- [ ] Multiple editors
- [ ] Configuration changes
- [ ] Commands
- [ ] Edge cases
- [ ] Theme compatibility
- [ ] Performance

---

## Commit Message

```
docs: add comprehensive manual testing checklist

- Create detailed manual testing documentation
- Cover all visual verification scenarios
- Include 11 test categories with 30+ test cases
- Add troubleshooting guide
- Add test results template
- Document known limitations

Manual testing required because VS Code API cannot query decoration colors.
```

---

## Next Steps

✅ **Proceed to Stage 9:** Validation & Finalization

📁 **File:** `test-plan-stage9.md`

**What you've created:**
- Comprehensive manual testing documentation
- Test cases covering all visual scenarios
- Troubleshooting guide
- Test results template
