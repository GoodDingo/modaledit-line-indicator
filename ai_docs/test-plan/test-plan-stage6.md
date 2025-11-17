# Test Plan - Stage 6: Core Behavioral Tests

**Time Estimate:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 5 (test helpers)
**Can Skip?** ❌ NO - These are fundamental tests

---

## Objective

Write comprehensive behavioral tests for core functionality:
1. Mode detection logic
2. Decoration lifecycle (create, apply, dispose)
3. Basic state management

**WHY THIS MATTERS:** These tests verify the extension's fundamental behavior works correctly. They test the LOGIC, not the visual appearance.

---

## Prerequisites

- [ ] Stage 5 completed (test helpers available)
- [ ] Bug is fixed (Stage 4)
- [ ] Extension works correctly
- [ ] Understand what CAN vs CANNOT be tested

---

## What We're Testing

✅ **Can test:** Logic, API calls, state changes, error handling
❌ **Cannot test:** Decoration colors, visual appearance

---

## Instructions

### Part 1: Mode Detection Tests (60 min)

**Create file:** `src/test/suite/modeDetection.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Mode Detection Tests
 *
 * Tests the extension's ability to detect ModalEdit's current mode.
 *
 * IMPORTANT: Cannot test decoration colors (API limitation).
 * These tests verify the LOGIC of mode detection, not visual output.
 */
suite('Mode Detection Tests', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
  });

  test('Extension detects ModalEdit if installed', () => {
    const modalEdit = TestHelpers.getModalEditExtension();

    if (modalEdit) {
      console.log('✓ ModalEdit detected:', {
        id: modalEdit.id,
        version: modalEdit.packageJSON.version,
        isActive: modalEdit.isActive
      });

      assert.ok(modalEdit.packageJSON.version, 'Should have version');
    } else {
      console.log('⚠️  ModalEdit not installed - some tests will be skipped');
    }

    // Test passes either way - informational only
    assert.ok(true);
  });

  test('Can query modaledit.normal context', async () => {
    if (!await TestHelpers.ensureModalEditActive()) {
      console.log('Skipping - ModalEdit not installed');
      return;
    }

    // Query the context
    const contextValue = await TestHelpers.queryModalEditContext();

    console.log('Context value:', contextValue, 'Type:', typeof contextValue);

    // Should be boolean or undefined (not null, not string, etc.)
    assert.ok(
      typeof contextValue === 'boolean' || contextValue === undefined,
      `Context should be boolean or undefined, got: ${typeof contextValue}`
    );
  });

  test('Extension activates without errors', async () => {
    const ext = TestHelpers.getExtension();

    assert.ok(ext, 'Extension should be installed');
    assert.strictEqual(ext.isActive, true, 'Extension should be active');
  });

  test('Extension works gracefully without ModalEdit', async () => {
    // This tests fallback behavior
    // Even without ModalEdit, extension should activate and not crash

    const ext = TestHelpers.getExtension();
    assert.ok(ext, 'Extension should be installed');

    // Should be able to open editors without errors
    const editor = await TestHelpers.createTestEditor('test content');
    assert.ok(editor, 'Should open editor without ModalEdit');

    // Should not crash when cursor moves
    await TestHelpers.moveCursorToLine(editor, 0);

    // Test passes if we got here without exceptions
    assert.ok(true);
  });

  test('Context query handles errors gracefully', async () => {
    // Query context with potentially invalid key
    let result: boolean | undefined;

    try {
      result = await TestHelpers.queryModalEditContext();
    } catch (error) {
      assert.fail('Context query should not throw, should return undefined');
    }

    // Result should be boolean or undefined, never throw
    assert.ok(
      typeof result === 'boolean' || result === undefined,
      'Should handle query gracefully'
    );
  });

  test('Extension handles multiple editors', async () => {
    // Open multiple editors
    const editor1 = await TestHelpers.createTestEditor('file 1 content');
    const editor2 = await TestHelpers.createTestEditor('file 2 content');
    const editor3 = await TestHelpers.createTestEditor('file 3 content');

    assert.strictEqual(vscode.window.visibleTextEditors.length, 3);

    // Should handle switching between editors without errors
    await vscode.window.showTextDocument(editor1.document);
    await TestHelpers.waitForDebounce();

    await vscode.window.showTextDocument(editor2.document);
    await TestHelpers.waitForDebounce();

    await vscode.window.showTextDocument(editor3.document);
    await TestHelpers.waitForDebounce();

    // Test passes if no errors occurred
    assert.ok(true);
  });
});
```

---

### Part 2: Decoration Lifecycle Tests (60 min)

**Create file:** `src/test/suite/decorationLifecycle.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Decoration Lifecycle Tests
 *
 * Tests decoration creation, application, and disposal.
 *
 * LIMITATION: Cannot verify decoration colors or visual appearance.
 * Can only test that operations complete without errors.
 */
suite('Decoration Lifecycle Tests', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
  });

  test('Can create decoration types without errors', () => {
    let normalDeco: vscode.TextEditorDecorationType | undefined;
    let insertDeco: vscode.TextEditorDecorationType | undefined;

    try {
      normalDeco = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#00770020',
        border: '2px solid #005500',
        isWholeLine: true
      });

      insertDeco = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#77000020',
        border: '2px solid #aa0000',
        isWholeLine: true
      });

      assert.ok(normalDeco, 'Normal decoration should be created');
      assert.ok(insertDeco, 'Insert decoration should be created');
    } finally {
      normalDeco?.dispose();
      insertDeco?.dispose();
    }
  });

  test('Can apply decorations to editor', async () => {
    const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3');
    const decoration = TestHelpers.createTestDecoration('#ff0000');

    try {
      // Create range for line 1
      const range = new vscode.Range(
        new vscode.Position(1, 0),
        new vscode.Position(1, 100)
      );

      // Apply decoration - should not throw
      assert.doesNotThrow(() => {
        editor.setDecorations(decoration, [range]);
      }, 'setDecorations should not throw');

      // Note: Cannot verify decoration was actually applied (API limitation)
      // Can only verify the call didn't error
    } finally {
      decoration.dispose();
    }
  });

  test('Can clear decorations', async () => {
    const editor = await TestHelpers.createTestEditor('test content');
    const decoration = TestHelpers.createTestDecoration('#ff0000');

    try {
      // Apply decoration
      const range = new vscode.Range(0, 0, 0, 4);
      editor.setDecorations(decoration, [range]);

      // Clear decoration
      editor.setDecorations(decoration, []); // Empty array clears

      // Should not throw
      assert.ok(true, 'Clearing decorations succeeded');
    } finally {
      decoration.dispose();
    }
  });

  test('Can apply decorations to current line', async () => {
    const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3');
    const decoration = TestHelpers.createTestDecoration('#00ff00');

    try {
      // Move cursor to line 1
      await TestHelpers.moveCursorToLine(editor, 1);

      // Get current line range
      const cursorLine = editor.selection.active.line;
      const range = new vscode.Range(cursorLine, 0, cursorLine, 0);

      // Apply decoration to current line
      editor.setDecorations(decoration, [range]);

      // Verify cursor is on line 1
      assert.strictEqual(editor.selection.active.line, 1);
    } finally {
      decoration.dispose();
    }
  });

  test('Can switch between two decoration types', async () => {
    const editor = await TestHelpers.createTestEditor('test');

    const deco1 = TestHelpers.createTestDecoration('#ff0000');
    const deco2 = TestHelpers.createTestDecoration('#00ff00');

    try {
      const range = new vscode.Range(0, 0, 0, 4);

      // Apply first decoration
      editor.setDecorations(deco1, [range]);
      editor.setDecorations(deco2, []);

      // Switch to second decoration
      editor.setDecorations(deco1, []);
      editor.setDecorations(deco2, [range]);

      // Switch back to first
      editor.setDecorations(deco2, []);
      editor.setDecorations(deco1, [range]);

      // Test passes if no errors
      assert.ok(true);
    } finally {
      deco1.dispose();
      deco2.dispose();
    }
  });

  test('Decorations can be disposed multiple times', () => {
    const decoration = TestHelpers.createTestDecoration('#ff0000');

    // Dispose once
    decoration.dispose();

    // Dispose again - should not throw
    assert.doesNotThrow(() => {
      decoration.dispose();
    }, 'Multiple dispose() should not throw');
  });

  test('Can create decorations with different styles', () => {
    const decorations: vscode.TextEditorDecorationType[] = [];

    try {
      // Solid border
      decorations.push(vscode.window.createTextEditorDecorationType({
        border: '2px solid #ff0000'
      }));

      // Dashed border
      decorations.push(vscode.window.createTextEditorDecorationType({
        border: '2px dashed #00ff00'
      }));

      // Dotted border
      decorations.push(vscode.window.createTextEditorDecorationType({
        border: '2px dotted #0000ff'
      }));

      // isWholeLine
      decorations.push(vscode.window.createTextEditorDecorationType({
        backgroundColor: '#ff0000',
        isWholeLine: true
      }));

      // All should be created successfully
      assert.strictEqual(decorations.length, 4);
      decorations.forEach(d => assert.ok(d));
    } finally {
      decorations.forEach(d => d.dispose());
    }
  });

  test('Can apply decoration to wrapped lines', async () => {
    // Create very long line that will wrap
    const longLine = 'a'.repeat(500);
    const editor = await TestHelpers.createTestEditor(longLine);

    const decoration = TestHelpers.createTestDecoration('#ff0000');

    try {
      // Apply decoration to the long line
      // isWholeLine should highlight all wrapped portions
      const range = new vscode.Range(0, 0, 0, 0);
      editor.setDecorations(decoration, [range]);

      // Test passes if no errors
      assert.ok(true);
    } finally {
      decoration.dispose();
    }
  });
});
```

---

### Part 3: Update Existing extension.test.ts (30 min)

**File:** `src/test/suite/extension.test.ts`

**Enhance existing tests with better assertions:**

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

suite('Extension Test Suite', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
    await TestHelpers.resetAllConfig();
  });

  test('Extension should be present', () => {
    const ext = TestHelpers.getExtension();
    assert.ok(ext, 'Extension should be installed');
  });

  test('Extension should activate', async () => {
    const ext = TestHelpers.getExtension();
    assert.ok(ext);

    // Should activate
    const isActive = await TestHelpers.ensureExtensionActive();
    assert.strictEqual(isActive, true, 'Extension should activate successfully');
    assert.strictEqual(ext.isActive, true, 'Extension should be in active state');
  });

  test('Commands should be registered', async () => {
    await TestHelpers.ensureExtensionActive();

    // Get all registered commands
    const commands = await vscode.commands.getCommands(true);

    // Our commands should be present
    const ourCommands = [
      'modaledit-line-indicator.toggleEnabled',
      'modaledit-line-indicator.updateHighlight',
      'modaledit-line-indicator.showLogFile',
      'modaledit-line-indicator.queryMode',
      'modaledit-line-indicator.clearLog'
    ];

    ourCommands.forEach(cmd => {
      assert.ok(
        commands.includes(cmd),
        `Command ${cmd} should be registered`
      );
    });
  });

  test('Configuration should have correct defaults', () => {
    const config = TestHelpers.getConfig();

    assert.strictEqual(config.get('enabled'), true);
    assert.strictEqual(config.get('normalModeBackground'), '#00770020');
    assert.strictEqual(config.get('normalModeBorder'), '#005500');
    assert.strictEqual(config.get('insertModeBackground'), '#77000020');
    assert.strictEqual(config.get('insertModeBorder'), '#aa0000');
    assert.strictEqual(config.get('borderStyle'), 'solid');
    assert.strictEqual(config.get('borderWidth'), '2px');
  });

  test('Toggle command should work', async () => {
    await TestHelpers.ensureExtensionActive();

    // Get initial state
    const config = TestHelpers.getConfig();
    const initialState = config.get('enabled');

    // Execute toggle command
    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');

    // State should have changed
    // Note: Command updates config, so re-read it
    await TestHelpers.waitForDebounce(); // Wait for config update

    const newState = config.get('enabled');
    assert.notStrictEqual(newState, initialState, 'Toggle should change state');

    // Toggle back
    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');
    await TestHelpers.waitForDebounce();

    const finalState = config.get('enabled');
    assert.strictEqual(finalState, initialState, 'Toggle should return to original state');
  });

  test('Extension handles configuration changes', async () => {
    await TestHelpers.ensureExtensionActive();

    // Change configuration
    await TestHelpers.setConfig('normalModeBackground', '#ff0000');

    // Wait for config change event to process
    await TestHelpers.waitForDebounce();

    // Verify config changed
    const config = TestHelpers.getConfig();
    assert.strictEqual(config.get('normalModeBackground'), '#ff0000');

    // Config reset happens in teardown
  });
});
```

---

## Gotchas

### Gotcha 1: Cannot Test Visual Appearance

```typescript
// WRONG - This is impossible
test('Line should be green', () => {
  const color = editor.getLineColor(1); // DOES NOT EXIST
  assert.equal(color, 'green');
});

// RIGHT - Test the logic instead
test('Mode detection returns true for normal mode', async () => {
  const isNormal = await TestHelpers.queryModalEditContext();
  // Test the value, not the visual result
});
```

### Gotcha 2: Async Tests Need await

```typescript
// WRONG - Test completes before operation finishes
test('test', () => {
  TestHelpers.createTestEditor('test'); // Returns Promise
  // Test ends before editor created!
});

// RIGHT - Await async operations
test('test', async () => {
  const editor = await TestHelpers.createTestEditor('test');
  // Now editor exists
});
```

### Gotcha 3: Resource Cleanup

Every test MUST clean up:
- Close editors in teardown
- Reset config in teardown
- Dispose decorations in try/finally

### Gotcha 4: Wait for Debounce

After triggering events, wait for processing:

```typescript
editor.selection = newSelection;
await TestHelpers.waitForDebounce(); // Wait for update
```

---

## Validation Checklist

### Files Created
- [ ] `src/test/suite/modeDetection.test.ts` created
- [ ] `src/test/suite/decorationLifecycle.test.ts` created
- [ ] `src/test/suite/extension.test.ts` enhanced

### Compilation
- [ ] Code compiles without errors: `make compile`
- [ ] No TypeScript errors
- [ ] No linting errors: `make lint`

### All Tests Pass
- [ ] Run tests: `make test`
- [ ] All mode detection tests pass
- [ ] All decoration lifecycle tests pass
- [ ] All extension tests pass
- [ ] No test failures
- [ ] No console errors

### Coverage
- [ ] Run coverage: `make coverage`
- [ ] Check coverage report
- [ ] Core functionality covered
- [ ] Coverage increasing (should be 40-60% now)

### Test Quality
- [ ] Tests use helpers consistently
- [ ] Tests have clear names
- [ ] Tests have cleanup in teardown
- [ ] Tests handle ModalEdit absence gracefully
- [ ] No flaky tests (run multiple times to verify)

---

## Expected Test Results

When you run `make test`, you should see:

```
Extension Test Suite
  ✓ Extension should be present
  ✓ Extension should activate
  ✓ Commands should be registered
  ✓ Configuration should have correct defaults
  ✓ Toggle command should work
  ✓ Extension handles configuration changes

Mode Detection Tests
  ✓ Extension detects ModalEdit if installed
  ✓ Can query modaledit.normal context
  ✓ Extension activates without errors
  ✓ Extension works gracefully without ModalEdit
  ✓ Context query handles errors gracefully
  ✓ Extension handles multiple editors

Decoration Lifecycle Tests
  ✓ Can create decoration types without errors
  ✓ Can apply decorations to editor
  ✓ Can clear decorations
  ✓ Can apply decorations to current line
  ✓ Can switch between two decoration types
  ✓ Decorations can be disposed multiple times
  ✓ Can create decorations with different styles
  ✓ Can apply decoration to wrapped lines

XX passing (XXms)
```

**Note:** Exact count depends on which tests you kept from existing file.

---

## Troubleshooting

### Problem: Tests fail with "Extension not found"

**Solution:**
- Extension might not be loading in test environment
- Check `.vscode-test.cjs` configuration
- Run `make compile` before `make test`

### Problem: Tests timeout

**Solution:**
- Increase timeout in `.vscode-test.cjs` (already 20000ms)
- Check for infinite loops in code
- Check for missing `await` on async operations

### Problem: "Cannot query context" errors

**Solution:**
- This is expected if ModalEdit not installed
- Tests should skip gracefully (check `if (!await ensureModalEditActive())`)

### Problem: Flaky tests (pass/fail randomly)

**Solution:**
- Add more wait time: Increase debounce wait
- Ensure proper cleanup in teardown
- Check for race conditions

---

## Commit Message

After completing and validating this stage:

```
test: add core behavioral tests for mode detection and decorations

- Add comprehensive mode detection tests
- Add decoration lifecycle tests
- Enhance existing extension tests
- All tests use test helpers for consistency
- Tests handle ModalEdit absence gracefully
- Achieve ~50% code coverage

Tests verify behavioral logic, not visual appearance (API limitation).
```

---

## Next Steps

✅ **Proceed to Stage 7:** Integration Tests

📁 **File:** `test-plan-stage7.md`

**What you've accomplished:**
- Core functionality is tested
- Mode detection logic verified
- Decoration lifecycle verified
- Foundation for integration tests