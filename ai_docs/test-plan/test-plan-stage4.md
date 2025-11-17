# Test Plan - Stage 4: Fix the Bug

**Time Estimate:** 1-3 hours (varies by root cause)
**Difficulty:** Medium to Hard
**Dependencies:** Stage 3 (diagnosis complete)
**Can Skip?** ❌ NO - This is the core fix

---

## Objective

Implement the appropriate fix based on the root cause identified in Stage 3.

**WHY THIS MATTERS:** Different root causes require different fixes. Choose the right fix strategy based on your Stage 3 findings.

---

## Prerequisites

- [ ] Stage 3 completed with documented root cause
- [ ] Know exact context query value
- [ ] Know what the fix should address
- [ ] Have log evidence of the problem

---

## Fix Strategies

**Choose ONE based on Stage 3 findings:**

- **Fix A:** Wrong Context Key Name
- **Fix B:** Add Retry/Wait Mechanism
- **Fix C:** Wait for ModalEdit Initialization
- **Fix D:** Alternative Detection Method

---

## Fix A: Wrong Context Key Name

**Use if:** Stage 3 showed context is `undefined` and you found a different key name in ModalEdit source.

### Implementation (30 min)

**File:** `src/extension.ts`

**Update isInNormalMode():**

```typescript
private async isInNormalMode(): Promise<boolean> {
  this.logger.debug('isInNormalMode() called');

  try {
    // Use the CORRECT context key name found in Stage 3
    // Change 'modaledit.normal' to whatever you found
    const contextValue = await vscode.commands.executeCommand(
      'getContext',
      'CORRECT_KEY_NAME_HERE'  // ← Change this!
    );

    this.logger.debug('Context query result', {
      value: contextValue,
      type: typeof contextValue,
      isUndefined: contextValue === undefined,
      isNull: contextValue === null,
      isTrue: contextValue === true,
      isFalse: contextValue === false
    });

    const result = contextValue === true;

    this.logger.debug('isInNormalMode() returning', { result });

    return result;
  } catch (error) {
    this.logger.error('isInNormalMode() threw exception', error);
    return false;
  }
}
```

**Validation:**
1. Compile: `make compile`
2. Launch Extension Development Host (F5)
3. Enter normal mode → Move cursor → Check logs
4. Context value should now be `true` when in normal mode
5. Line should be GREEN

---

## Fix B: Add Retry/Wait Mechanism

**Use if:** Stage 3 showed context is sometimes `undefined`, suggesting timing issue.

### Implementation (45 min)

**File:** `src/extension.ts`

**Replace isInNormalMode() with retry logic:**

```typescript
private async isInNormalMode(): Promise<boolean> {
  this.logger.debug('isInNormalMode() called');

  const maxRetries = 3;
  const retryDelayMs = 100;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const contextValue = await vscode.commands.executeCommand(
        'getContext',
        'modaledit.normal'
      );

      this.logger.debug(`Context query attempt ${attempt}/${maxRetries}`, {
        value: contextValue,
        type: typeof contextValue,
        isUndefined: contextValue === undefined
      });

      // If we got a defined value (true or false), use it
      if (contextValue !== undefined) {
        const result = contextValue === true;
        this.logger.debug('Context query succeeded', {
          attempt,
          result
        });
        return result;
      }

      // Value is undefined, retry if we have attempts left
      if (attempt < maxRetries) {
        this.logger.debug(`Context undefined, waiting ${retryDelayMs}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    } catch (error) {
      this.logger.error(`Context query attempt ${attempt} failed`, error);

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelayMs));
      }
    }
  }

  // All retries exhausted, context still undefined
  this.logger.log('❌ Context query failed after all retries, defaulting to false');
  return false;
}
```

**Validation:**
1. Compile and test
2. Check logs for retry attempts
3. Verify context eventually returns value
4. Colors should change correctly

---

## Fix C: Wait for ModalEdit Initialization

**Use if:** Stage 3 showed ModalEdit exists but context not immediately available on startup.

### Implementation (30 min)

**File:** `src/extension.ts`

**Update activate() method:**

```typescript
public async activate(): Promise<void> {
  this.logger.log('=== ACTIVATION START ===');

  // Check for ModalEdit extension
  const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');

  if (modalEditExt) {
    this.logger.log('ModalEdit extension FOUND', {
      id: modalEditExt.id,
      version: modalEditExt.packageJSON.version,
      isActive: modalEditExt.isActive
    });

    // Ensure ModalEdit is activated
    if (!modalEditExt.isActive) {
      this.logger.log('Activating ModalEdit...');
      try {
        await modalEditExt.activate();
        this.logger.log('ModalEdit activated successfully');
      } catch (error) {
        this.logger.error('Failed to activate ModalEdit', error);
      }
    }

    // ADDED: Wait for ModalEdit to set its context
    this.logger.log('Waiting for ModalEdit to initialize context...');
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify context is now available
    const testContext = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
    this.logger.log('Context after wait', {
      value: testContext,
      type: typeof testContext
    });
  } else {
    this.logger.log('⚠️  ModalEdit extension NOT FOUND - will default to insert mode');
  }

  // ... rest of activation code unchanged ...
}
```

**Validation:**
1. Compile and test
2. Check logs show wait message
3. Check context is defined after wait
4. Initial mode detection should work

---

## Fix D: Alternative Detection Method

**Use if:** Stage 3 showed context key doesn't exist at all in ModalEdit.

### Implementation (60-90 min)

**This is more complex - requires tracking ModalEdit commands.**

**Option D1: Listen to ModalEdit Commands**

```typescript
private async setupCommandTracking(): Promise<void> {
  this.logger.log('Setting up ModalEdit command tracking');

  // Track when ModalEdit switches modes
  // Note: This assumes ModalEdit uses these command IDs

  const enterNormalDisposable = vscode.commands.registerCommand(
    'modaledit.enterNormal',
    () => {
      this.logger.log('Detected enterNormal command');
      this.modeState.isNormalMode = true;
      this.updateHighlight();
    }
  );

  const enterInsertDisposable = vscode.commands.registerCommand(
    'modaledit.enterInsert',
    () => {
      this.logger.log('Detected enterInsert command');
      this.modeState.isNormalMode = false;
      this.updateHighlight();
    }
  );

  this.disposables.push(enterNormalDisposable, enterInsertDisposable);
}
```

**Call from activate():**
```typescript
// In activate(), after checking for ModalEdit
if (modalEditExt) {
  await this.setupCommandTracking();
}
```

**Update isInNormalMode() to use cached state:**
```typescript
private async isInNormalMode(): Promise<boolean> {
  // Use cached state from command tracking
  return this.modeState.isNormalMode;
}
```

**CAUTION:** This requires knowing ModalEdit's internal command names. Check ModalEdit's package.json for actual command IDs.

---

## Combined Fix: Multiple Strategies

**Use if:** You want maximum robustness.

### Implementation (90 min)

**Combine retry + wait + fallback:**

```typescript
private async isInNormalMode(): Promise<boolean> {
  this.logger.debug('isInNormalMode() called');

  // Strategy 1: Try context key with retries
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const contextValue = await vscode.commands.executeCommand(
        'getContext',
        'modaledit.normal'
      );

      if (contextValue !== undefined) {
        this.logger.debug('Context query succeeded', {
          value: contextValue,
          attempt
        });
        return contextValue === true;
      }

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      this.logger.debug(`Attempt ${attempt} failed`, error);
    }
  }

  // Strategy 2: Fall back to cached state
  this.logger.debug('Using cached mode state', {
    cached: this.modeState.isNormalMode
  });

  return this.modeState.isNormalMode;
}
```

---

## Testing Your Fix

**For ANY fix strategy, follow these tests:**

### Test 1: Initial Load (10 min)

1. Close all VS Code windows
2. Open VS Code fresh
3. Open Extension Development Host (F5)
4. Open any file
5. **Check:** What mode are you in? (ModalEdit status bar)
6. **Check:** What color is the line?
7. **Expected:** Should match mode (green=normal, red=insert)

### Test 2: Mode Switching (15 min)

**Test sequence:**

1. **Start in insert mode** (press `i`)
2. Line should be RED
3. **Switch to normal mode** (press Escape)
4. **Move cursor** (press j or down arrow)
5. Line should change to GREEN
6. **Switch back to insert mode** (press `i`)
7. **Type text** (triggers cursor move)
8. Line should change back to RED

**Repeat 10 times** to ensure consistency.

### Test 3: Rapid Switching (10 min)

1. Rapidly switch modes: Escape, i, Escape, i, Escape, i
2. Move cursor after each switch
3. Colors should track correctly
4. Check logs for all mode changes

### Test 4: Multiple Files (10 min)

1. Open 3 files side by side
2. Set each to different mode
3. Click between files
4. Each should retain correct color

### Test 5: Wrapped Lines (5 min)

1. Type a very long line (wraps to multiple visual lines)
2. All wrapped portions should be highlighted
3. Color should be correct for current mode

---

## Validation Checklist

### Fix Implemented
- [ ] Chosen appropriate fix strategy based on Stage 3
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] No linting errors
- [ ] Logging still works

### Testing Complete
- [ ] Test 1 passed (initial load correct)
- [ ] Test 2 passed (mode switching works)
- [ ] Test 3 passed (rapid switching works)
- [ ] Test 4 passed (multiple files work)
- [ ] Test 5 passed (wrapped lines work)

### Bug Fixed
- [ ] Line changes from RED to GREEN when entering normal mode
- [ ] Line changes from GREEN to RED when entering insert mode
- [ ] Colors track mode changes consistently
- [ ] No errors in logs
- [ ] No console errors

### Documentation
- [ ] Logged which fix strategy was used
- [ ] Documented why this fix was chosen
- [ ] Updated comments in code if needed

---

## Gotchas

### Gotcha 1: Still Need to Move Cursor

Even with the fix, cursor movement is required to trigger updates. This is by design (event-driven architecture).

### Gotcha 2: Debounce Delay

The 10ms debounce means there's a tiny delay. This is normal and imperceptible.

### Gotcha 3: Fix One Problem, Create Another

After fixing, test thoroughly. Ensure:
- No infinite loops
- No excessive logging
- No performance degradation

### Gotcha 4: ModalEdit Updates

If ModalEdit updates and changes its context key API, this fix might break. Document which version you tested with.

---

## If Fix Doesn't Work

**If colors still don't change:**

1. **Check logs:** What does context query return now?
2. **Verify ModalEdit is in the mode you think:** Check ModalEdit's status bar
3. **Try alternative fix strategy:** Maybe combine multiple approaches
4. **Check event listeners:** Are they firing?
5. **Ask for help:** Provide logs and Stage 3 documentation

---

## Performance Considerations

### Retry Logic

If using Fix B (retry mechanism):
- 3 retries × 100ms = 300ms max delay
- Only happens when context is undefined
- Acceptable for edge cases

### Initialization Wait

If using Fix C (wait for init):
- 200ms delay on activation
- One-time cost
- Acceptable for reliability

### Command Tracking

If using Fix D (command tracking):
- No performance impact
- Event-driven
- Most efficient if it works

---

## Commit Message

After completing and validating this stage:

```
fix: resolve mode detection always returning false

Root cause: [describe what you found in Stage 3]

Solution: [describe which fix strategy you used]

- [list specific changes made]
- Verified with tests for mode switching, rapid switching, multiple files
- Colors now correctly change between green (normal) and red (insert)

Fixes #[issue number if applicable]
```

---

## Next Steps

✅ **Proceed to Stage 5:** Create Test Infrastructure

📁 **File:** `test-plan-stage5.md`

**What to bring:**
- Working mode detection (bug fixed!)
- Understanding of what the fix does
- Logs showing fix works correctly

**Note:** Now that the bug is fixed, we can write tests for CORRECT behavior!
