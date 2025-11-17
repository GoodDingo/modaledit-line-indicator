# Test Plan - Stage 3: Diagnose the Bug

**Time Estimate:** 1-2 hours
**Difficulty:** Medium
**Dependencies:** Stage 2 (logging must be working)
**Can Skip?** ❌ NO - Must know root cause before fixing

---

## Objective

Use the logging infrastructure from Stage 2 to identify the EXACT root cause of why mode detection always returns false.

**WHY THIS MATTERS:** We need to know the precise problem before we can implement the correct fix. Different root causes require different solutions.

---

## Prerequisites

- [ ] Stage 2 completed (logging infrastructure working)
- [ ] Extension compiles without errors
- [ ] Extension Development Host launches
- [ ] Output channel shows logs
- [ ] ModalEdit extension installed

---

## Investigation Process

### Step 1: Launch with Logging (5 min)

1. **Compile:** `make compile`
2. **Launch Extension Development Host:** Press F5
3. **Open Output Channel:** View → Output → "ModalEdit Line Indicator"
4. **Also open Debug Console:** View → Debug Console

**Expected:** You should see activation logs immediately.

---

### Step 2: Analyze Activation Logs (15 min)

**Look for these critical log entries:**

#### Entry 1: ModalEdit Detection
```
[INFO] ModalEdit extension FOUND | {"id":"...","version":"...","isActive":true/false}
```

**Questions to answer:**
- Is ModalEdit found? YES / NO
- If found, what version?
- Is it active on startup?

**If NOT found:**
- ❌ STOP - Install ModalEdit extension first
- This is required for the extension to work

#### Entry 2: Initial Mode Detection
```
[DEBUG] Context query result | {"value":???,"type":"???","isUndefined":???,...}
```

**THIS IS THE CRITICAL LINE!**

**Possible values and their meanings:**

**Scenario A:** `"value":undefined,"type":"undefined","isUndefined":true`
- Context key doesn't exist or isn't set
- ModalEdit might not be setting the context
- Context key name might be wrong

**Scenario B:** `"value":false,"type":"boolean","isUndefined":false,"isFalse":true`
- Context exists and returns false
- ModalEdit thinks it's in insert mode
- This is expected if ModalEdit starts in insert mode

**Scenario C:** `"value":true,"type":"boolean","isUndefined":false,"isTrue":true`
- Context exists and returns true
- If you see this, mode detection is WORKING!
- The bug might be elsewhere

**Scenario D:** `"value":null` or other unexpected type
- Unexpected behavior
- Might indicate VS Code API issue

**Write down what you see:** ___________________________________________

---

### Step 3: Test Mode Switching (20 min)

**Now test dynamic mode switching:**

1. **Ensure you're in insert mode:**
   - Press `i` in ModalEdit
   - Type some text

2. **Check logs for mode detection:**
   ```
   [DEBUG] Context query result | {"value":false,...}
   [INFO] 🎨 Applying decoration | {"mode":"INSERT","color":"RED",...}
   ```

3. **Switch to normal mode:**
   - Press `Escape`
   - **Immediately** move cursor (j/k or arrows)

4. **Check logs again:**
   - Look for `EVENT: onDidChangeTextEditorSelection`
   - Look for new `Context query result`
   - Did the value change from false to true?

**Write down observations:**

Moving cursor in insert mode:
- Context value: ___________
- Color applied: ___________

Moving cursor in normal mode:
- Context value: ___________
- Color applied: ___________

---

### Step 4: Use Debug Commands (15 min)

**Test the manual query command:**

1. **Enter normal mode** (Escape)
2. **Run command:** Cmd/Ctrl+Shift+P → "Query Current Mode"
3. **Check message shown**
4. **Check logs for result**

**Repeat in insert mode:**

1. **Enter insert mode** (press `i`)
2. **Run command again**
3. **Did the result change?**

**Test log file command:**

1. **Run:** "Show Log File"
2. **Choose:** "Open File"
3. **Review entire log** from session start
4. **Look for patterns**

---

### Step 5: Investigate ModalEdit Context Key (30 min)

**If context value is always undefined, investigate ModalEdit:**

**File to check:** `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src/`

**What to search for:**

1. **Search for "setContext":**
   ```bash
   cd /Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit
   grep -r "setContext" src/
   ```

2. **Look for context key names:**
   - Is it `modaledit.normal`?
   - Or something else like `modalEdit.normal` (capital E)?
   - Or `modaledit.mode`?

3. **Check when context is set:**
   - Is it set in `enterNormal()` / `enterInsert()`?
   - Is it set on every mode change?

**Document findings:**
- Context key name: ___________
- Where it's set: ___________
- When it's set: ___________

---

### Step 6: Test Alternative Context Keys (If Needed) (15 min)

**If you find a different context key name, test it:**

**Temporarily modify `isInNormalMode()`:**

```typescript
private async isInNormalMode(): Promise<boolean> {
  this.logger.debug('isInNormalMode() called');

  // Test multiple possible context keys
  const possibleKeys = [
    'modaledit.normal',
    'modalEdit.normal',     // Capital E?
    'modaledit.mode',        // Different name?
    'modaledit.normalMode'   // Different format?
  ];

  for (const key of possibleKeys) {
    try {
      const value = await vscode.commands.executeCommand('getContext', key);
      this.logger.debug(`Testing context key: ${key}`, {
        value,
        type: typeof value
      });

      if (value !== undefined) {
        this.logger.log(`✓ Found working context key: ${key}`);
        return value === true;
      }
    } catch (error) {
      this.logger.debug(`Context key ${key} failed`, error);
    }
  }

  this.logger.log('❌ No working context key found');
  return false;
}
```

**Test again:**
1. Compile and reload
2. Check logs for which key works
3. Document the working key name

---

## Root Cause Determination

Based on your investigation, identify the root cause:

### Root Cause A: Context Key Doesn't Exist

**Evidence:**
- Value is always `undefined`
- ModalEdit doesn't set the context
- Or context key name is wrong

**Fix Strategy (Stage 4):**
- Find correct context key name
- Or implement alternative detection method
- Or add retry/wait mechanism

---

### Root Cause B: Context Returns False But Should Be True

**Evidence:**
- Value is `false` when in normal mode
- ModalEdit is setting context but incorrectly
- Or context updates are delayed

**Fix Strategy (Stage 4):**
- Add retry mechanism with delay
- Poll context multiple times
- Wait for ModalEdit to finish initialization

---

### Root Cause C: Context Works But Timing Issue

**Evidence:**
- Context sometimes correct, sometimes wrong
- Depends on when mode changed
- Event timing issues

**Fix Strategy (Stage 4):**
- Improve debouncing
- Add explicit mode change detection
- Listen to additional events

---

### Root Cause D: No Issue Found

**Evidence:**
- Context returns correct values
- Colors change properly
- Bug cannot be reproduced

**Fix Strategy:**
- Bug might be fixed already
- Or bug is intermittent
- Document that testing shows it works

---

## Documentation Template

**Fill this out before proceeding to Stage 4:**

```
## Bug Diagnosis Results

**Date:** ___________
**ModalEdit Version:** ___________
**VS Code Version:** ___________

### Findings

**Context Key Query Result:**
- Key name tested: modaledit.normal
- Value returned: ___________
- Type: ___________

**In Insert Mode:**
- Context value: ___________
- Decoration color: ___________
- Expected: false / RED ✓ or ✗

**In Normal Mode:**
- Context value: ___________
- Decoration color: ___________
- Expected: true / GREEN ✓ or ✗

**Root Cause Identified:**
[ ] A - Context key doesn't exist
[ ] B - Context returns wrong value
[ ] C - Timing/event issue
[ ] D - Cannot reproduce bug
[ ] Other: ___________

**Evidence:**
___________________________________________
___________________________________________

**Recommended Fix:**
___________________________________________
___________________________________________

**Log File Path:** ___________

**Attach log excerpt showing the issue:**
```
[paste relevant logs here]
```
```

---

## Gotchas

### Gotcha 1: ModalEdit Starts in Insert Mode

By default, ModalEdit might start in insert mode. This is CORRECT behavior. The bug is that it STAYS in insert mode even after pressing Escape.

### Gotcha 2: Need to Move Cursor

Our event listener triggers on cursor movement. If you switch modes but DON'T move cursor, the color won't update. This is a known limitation (documented in research).

**Test:** Switch mode + move cursor together

### Gotcha 3: Debounce Delay

There's a 10ms debounce. Very rapid mode switches might not all be logged. This is normal.

### Gotcha 4: Multiple VS Code Windows

Ensure you're testing in the Extension Development Host (the new window), not the main VS Code window.

### Gotcha 5: ModalEdit Not Configured

ModalEdit needs keybindings configured. Ensure:
- Escape is bound to normal mode
- i/a/o are bound to insert mode

---

## Validation Checklist

### Investigation Complete
- [ ] Reviewed activation logs
- [ ] Identified ModalEdit detection status
- [ ] Identified context query value
- [ ] Tested mode switching in both modes
- [ ] Used debug commands successfully
- [ ] Reviewed log file

### Root Cause Identified
- [ ] Filled out documentation template
- [ ] Identified specific root cause (A, B, C, or D)
- [ ] Have evidence from logs
- [ ] Know what fix is needed
- [ ] Attached relevant log excerpts

### Ready for Stage 4
- [ ] Know exactly what to fix
- [ ] Understand why current code fails
- [ ] Have logs showing the problem
- [ ] Documented findings for future reference

---

## Common Findings

### Most Likely: Context Key Name Wrong

**Expected finding:**
```
[DEBUG] Context query result | {"value":undefined,"type":"undefined",...}
```

**Reason:** ModalEdit might use different context key name or not set it at all.

**Next step:** Search ModalEdit source for correct key name.

---

### Second Most Likely: Context Works, Event Doesn't Fire

**Expected finding:**
- Context returns correct values when queried manually
- But automatic updates don't work

**Reason:** Event listener issue or debouncing problem.

**Next step:** Improve event handling.

---

## Troubleshooting

### Problem: Can't see logs

**Solution:**
- Check Output panel (not Debug Console)
- Select "ModalEdit Line Indicator" from dropdown
- If empty, check Extension Development Host is running

### Problem: ModalEdit not found

**Solution:**
- Install ModalEdit extension
- Reload VS Code
- Try again

### Problem: Context always undefined

**Solution:**
- This is likely the bug!
- Search ModalEdit source for context key name
- Continue to Step 5

### Problem: No logs when moving cursor

**Solution:**
- Check event listener is registered
- Check Extension Development Host has focus
- Try typing text (triggers more events)

---

## Success Criteria

You can proceed to Stage 4 when you can answer:

1. **What value does the context query return?** ___________
2. **Does the value change when switching modes?** YES / NO
3. **What is the root cause?** ___________
4. **What fix do we need?** ___________

If you can't answer all four, continue investigating.

---

## Next Steps

✅ **Proceed to Stage 4:** Fix the Bug

📁 **File:** `test-plan-stage4.md`

**What to bring:**
- Completed documentation template
- Log file with evidence
- Clear understanding of root cause
- Specific fix strategy identified
