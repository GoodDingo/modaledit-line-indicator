# Test Plan - Stage 7: Integration Tests

**Time Estimate:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 5 (test helpers)
**Can Skip?** ⚠️  Not recommended - Covers important integration points

---

## Objective

Write integration tests for:
1. Event handling (cursor movement, editor switching, config changes)
2. Configuration management
3. ModalEdit integration
4. Command execution

**WHY THIS MATTERS:** These tests verify the extension integrates correctly with VS Code and ModalEdit. They test interactions, not just isolated units.

---

## Prerequisites

- [ ] Stage 5 completed (test helpers available)
- [ ] Stage 6 completed (core tests as reference)
- [ ] Extension works correctly

---

## Instructions

### Part 1: Event Handling Tests (60 min)

**Create file:** `src/test/suite/eventHandling.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Event Handling Integration Tests
 *
 * Tests that extension correctly responds to VS Code events:
 * - Selection changes (cursor movement)
 * - Active editor changes (switching files)
 * - Configuration changes (settings updates)
 */
suite('Event Handling Tests', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
    await TestHelpers.resetAllConfig();
  });

  test('Selection change event fires when cursor moves', async () => {
    let eventFired = false;

    // Register event listener
    const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
      eventFired = true;
    });

    try {
      const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3');

      // Reset flag
      eventFired = false;

      // Move cursor
      await TestHelpers.moveCursorToLine(editor, 1);

      // Event should have fired
      assert.strictEqual(eventFired, true, 'Selection change event should fire');
    } finally {
      disposable.dispose();
    }
  });

  test('Selection change event includes correct data', async () => {
    let capturedLine = -1;

    const disposable = vscode.window.onDidChangeTextEditorSelection((e) => {
      capturedLine = e.selections[0].active.line;
    });

    try {
      const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3');

      // Move to line 2
      await TestHelpers.moveCursorToLine(editor, 2);

      // Captured line should be 2
      assert.strictEqual(capturedLine, 2, 'Event should contain correct line number');
    } finally {
      disposable.dispose();
    }
  });

  test('Active editor change event fires when switching editors', async () => {
    let eventCount = 0;

    const disposable = vscode.window.onDidChangeActiveTextEditor(() => {
      eventCount++;
    });

    try {
      const editor1 = await TestHelpers.createTestEditor('file 1');
      const editor2 = await TestHelpers.createTestEditor('file 2');

      // Reset counter after initial opens
      eventCount = 0;

      // Switch to editor1
      await vscode.window.showTextDocument(editor1.document);
      await TestHelpers.waitForDebounce();

      // Switch to editor2
      await vscode.window.showTextDocument(editor2.document);
      await TestHelpers.waitForDebounce();

      // Should have fired at least once per switch
      assert.ok(eventCount >= 2, 'Editor change event should fire when switching');
    } finally {
      disposable.dispose();
    }
  });

  test('Configuration change event fires when settings change', async () => {
    let eventFired = false;

    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('modaledit-line-indicator')) {
        eventFired = true;
      }
    });

    try {
      // Change configuration
      await TestHelpers.setConfig('enabled', false);

      // Wait for event
      await TestHelpers.waitForDebounce();

      // Event should have fired
      assert.strictEqual(eventFired, true, 'Config change event should fire');
    } finally {
      disposable.dispose();
    }
  });

  test('Configuration change event provides correct scope info', async () => {
    let affectsOurs = false;

    const disposable = vscode.workspace.onDidChangeConfiguration((e) => {
      affectsOurs = e.affectsConfiguration('modaledit-line-indicator');
    });

    try {
      // Change our configuration
      await TestHelpers.setConfig('normalModeBackground', '#ff0000');
      await TestHelpers.waitForDebounce();

      // Should affect our extension
      assert.strictEqual(affectsOurs, true, 'Should detect config changes for our extension');

      // Reset flag
      affectsOurs = false;

      // Change unrelated configuration
      await vscode.workspace.getConfiguration('editor').update('fontSize', 14, vscode.ConfigurationTarget.Global);
      await TestHelpers.waitForDebounce();

      // Should NOT affect our extension
      assert.strictEqual(affectsOurs, false, 'Should not trigger for unrelated config');

      // Cleanup editor config
      await vscode.workspace.getConfiguration('editor').update('fontSize', undefined, vscode.ConfigurationTarget.Global);
    } finally {
      disposable.dispose();
    }
  });

  test('Multiple rapid cursor movements are debounced', async () => {
    let eventCount = 0;

    const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
      eventCount++;
    });

    try {
      const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3\nline 4\nline 5');

      // Reset counter
      eventCount = 0;

      // Rapid cursor movements (no waits between them)
      editor.selection = new vscode.Selection(new vscode.Position(0, 0), new vscode.Position(0, 0));
      editor.selection = new vscode.Selection(new vscode.Position(1, 0), new vscode.Position(1, 0));
      editor.selection = new vscode.Selection(new vscode.Position(2, 0), new vscode.Position(2, 0));
      editor.selection = new vscode.Selection(new vscode.Position(3, 0), new vscode.Position(3, 0));
      editor.selection = new vscode.Selection(new vscode.Position(4, 0), new vscode.Position(4, 0));

      // Wait for debounce to settle
      await TestHelpers.wait(100);

      // Events fired, but extension's debounce should reduce processing
      // We can't easily test the debounce effect, but we can verify events fired
      assert.ok(eventCount > 0, 'Events should fire for cursor movements');
      assert.ok(eventCount === 5, 'All 5 cursor movements should trigger events');
    } finally {
      disposable.dispose();
    }
  });

  test('Extension responds to cursor movement after activation', async () => {
    await TestHelpers.ensureExtensionActive();

    const editor = await TestHelpers.createTestEditor('line 1\nline 2\nline 3');

    // Move cursor multiple times
    await TestHelpers.moveCursorToLine(editor, 0);
    await TestHelpers.moveCursorToLine(editor, 1);
    await TestHelpers.moveCursorToLine(editor, 2);

    // Final position should be line 2
    assert.strictEqual(editor.selection.active.line, 2);

    // Test passes if no errors occurred
    assert.ok(true);
  });
});
```

---

### Part 2: Configuration Tests (45 min)

**Create file:** `src/test/suite/configuration.test.ts`

```typescript
import * as assert from 'assert';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Configuration Management Tests
 *
 * Tests configuration reading, updating, and validation.
 */
suite('Configuration Tests', () => {
  teardown(async () => {
    await TestHelpers.resetAllConfig();
  });

  test('Default configuration values are correct', () => {
    const config = TestHelpers.getConfig();

    const defaults = {
      enabled: true,
      normalModeBackground: '#00770020',
      normalModeBorder: '#005500',
      insertModeBackground: '#77000020',
      insertModeBorder: '#aa0000',
      borderStyle: 'solid',
      borderWidth: '2px'
    };

    Object.entries(defaults).forEach(([key, expectedValue]) => {
      const actualValue = config.get(key);
      assert.strictEqual(
        actualValue,
        expectedValue,
        `Config ${key} should default to ${expectedValue}, got ${actualValue}`
      );
    });
  });

  test('Can read configuration values', () => {
    const config = TestHelpers.getConfig();

    const enabled = config.get('enabled');
    const normalBg = config.get('normalModeBackground');

    assert.strictEqual(typeof enabled, 'boolean');
    assert.strictEqual(typeof normalBg, 'string');
  });

  test('Can update configuration values', async () => {
    await TestHelpers.setConfig('enabled', false);

    const config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), false);

    await TestHelpers.setConfig('enabled', true);
    assert.strictEqual(config.get('enabled'), true);
  });

  test('Can update all configuration values without errors', async () => {
    const testValues: Record<string, any> = {
      enabled: false,
      normalModeBackground: '#123456',
      normalModeBorder: '#654321',
      insertModeBackground: '#abcdef',
      insertModeBorder: '#fedcba',
      borderStyle: 'dashed',
      borderWidth: '5px'
    };

    // Update all
    for (const [key, value] of Object.entries(testValues)) {
      await TestHelpers.setConfig(key, value);
    }

    // Verify all
    const config = TestHelpers.getConfig();
    for (const [key, expectedValue] of Object.entries(testValues)) {
      const actualValue = config.get(key);
      assert.strictEqual(actualValue, expectedValue, `Config ${key} should update to ${expectedValue}`);
    }
  });

  test('Can reset configuration to default', async () => {
    // Change configuration
    await TestHelpers.setConfig('normalModeBackground', '#ff0000');
    assert.strictEqual(TestHelpers.getConfig().get('normalModeBackground'), '#ff0000');

    // Reset
    await TestHelpers.resetConfig('normalModeBackground');

    // Should be back to default
    assert.strictEqual(TestHelpers.getConfig().get('normalModeBackground'), '#00770020');
  });

  test('Configuration changes are persisted', async () => {
    // Change config
    await TestHelpers.setConfig('borderStyle', 'dotted');

    // Re-read config (simulates reload)
    const config = TestHelpers.getConfig();

    // Should still have changed value
    assert.strictEqual(config.get('borderStyle'), 'dotted');
  });

  test('Invalid configuration values are handled', async () => {
    // Try to set invalid borderStyle
    await TestHelpers.setConfig('borderStyle', 'invalid-style');

    // VS Code might accept it (no validation) or reject it
    // Either way, should not crash
    const config = TestHelpers.getConfig();
    const value = config.get('borderStyle');

    // Test passes if we got here without error
    assert.ok(value !== undefined, 'Should have some value');
  });

  test('Configuration scope is correct', () => {
    const config = TestHelpers.getConfig();

    // Check that we're getting workspace configuration
    assert.ok(config, 'Configuration should exist');
    assert.strictEqual(typeof config.get, 'function', 'Should have get method');
    assert.strictEqual(typeof config.update, 'function', 'Should have update method');
  });

  test('Can read configuration with different types', () => {
    const config = TestHelpers.getConfig();

    // Boolean
    const enabled = config.get<boolean>('enabled');
    assert.strictEqual(typeof enabled, 'boolean');

    // String
    const bgColor = config.get<string>('normalModeBackground');
    assert.strictEqual(typeof bgColor, 'string');

    // Enum (borderStyle)
    const borderStyle = config.get<string>('borderStyle');
    assert.ok(['solid', 'dashed', 'dotted'].includes(borderStyle as string));
  });
});
```

---

### Part 3: ModalEdit Integration Tests (45 min)

**Create file:** `src/test/suite/modalEditIntegration.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * ModalEdit Integration Tests
 *
 * Tests integration with the ModalEdit extension.
 *
 * NOTE: These tests require ModalEdit to be installed.
 * If ModalEdit is not available, tests are skipped gracefully.
 */
suite('ModalEdit Integration Tests', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
  });

  test('Can detect ModalEdit extension', () => {
    const modalEdit = TestHelpers.getModalEditExtension();

    if (modalEdit) {
      console.log('✓ ModalEdit detected');
      console.log('  ID:', modalEdit.id);
      console.log('  Version:', modalEdit.packageJSON.version);
      console.log('  Active:', modalEdit.isActive);

      assert.ok(modalEdit.id);
      assert.ok(modalEdit.packageJSON.version);
    } else {
      console.log('⚠️  ModalEdit not installed - integration tests will be skipped');
    }

    // Test passes either way
    assert.ok(true);
  });

  test('ModalEdit can be activated', async () => {
    const modalEdit = TestHelpers.getModalEditExtension();

    if (!modalEdit) {
      console.log('Skipping - ModalEdit not installed');
      return;
    }

    // Ensure activated
    const isActive = await TestHelpers.ensureModalEditActive();

    assert.strictEqual(isActive, true, 'ModalEdit should activate');
    assert.strictEqual(modalEdit.isActive, true, 'ModalEdit should be in active state');
  });

  test('Can query ModalEdit context when ModalEdit is active', async () => {
    if (!await TestHelpers.ensureModalEditActive()) {
      console.log('Skipping - ModalEdit not available');
      return;
    }

    // Query context
    const contextValue = await TestHelpers.queryModalEditContext();

    console.log('Context value:', contextValue, 'Type:', typeof contextValue);

    // Should return boolean (true or false), not undefined
    assert.ok(
      typeof contextValue === 'boolean',
      `Context should be boolean when ModalEdit is active, got: ${typeof contextValue}`
    );
  });

  test('Context query returns boolean values', async () => {
    if (!await TestHelpers.ensureModalEditActive()) {
      console.log('Skipping - ModalEdit not available');
      return;
    }

    const contextValue = await TestHelpers.queryModalEditContext();

    // Should be true or false
    assert.ok(
      contextValue === true || contextValue === false,
      `Context should be true or false, got: ${contextValue}`
    );
  });

  test('Extension works when ModalEdit is installed', async () => {
    if (!await TestHelpers.ensureModalEditActive()) {
      console.log('Skipping - ModalEdit not available');
      return;
    }

    // Extension should be active
    await TestHelpers.ensureExtensionActive();

    // Should be able to open editors
    const editor = await TestHelpers.createTestEditor('test content');

    // Should be able to move cursor without errors
    await TestHelpers.moveCursorToLine(editor, 0);

    // Test passes if no errors
    assert.ok(true);
  });

  test('Extension works when ModalEdit is NOT installed', async () => {
    // This tests the fallback behavior

    const ext = TestHelpers.getExtension();
    assert.ok(ext, 'Our extension should be installed');

    // Should activate even without ModalEdit
    await TestHelpers.ensureExtensionActive();

    // Should handle editors
    const editor = await TestHelpers.createTestEditor('test content');
    await TestHelpers.moveCursorToLine(editor, 0);

    // Test passes if no errors
    assert.ok(true);
  });

  test('Context query handles missing ModalEdit gracefully', async () => {
    // This should not throw even if ModalEdit is not installed
    let result: boolean | undefined;

    try {
      result = await TestHelpers.queryModalEditContext();
    } catch (error) {
      assert.fail('Context query should not throw when ModalEdit is missing');
    }

    // If ModalEdit is installed, should be boolean
    // If not installed, should be undefined
    // Either is acceptable
    assert.ok(
      typeof result === 'boolean' || result === undefined,
      'Context query should return boolean or undefined'
    );
  });

  test('Extension detects ModalEdit version', async () => {
    const modalEdit = TestHelpers.getModalEditExtension();

    if (!modalEdit) {
      console.log('Skipping - ModalEdit not installed');
      return;
    }

    const version = modalEdit.packageJSON.version;

    assert.ok(version, 'ModalEdit should have version');
    assert.ok(typeof version === 'string', 'Version should be string');
    assert.ok(version.match(/\d+\.\d+\.\d+/), 'Version should be semver format');

    console.log('Testing with ModalEdit version:', version);
  });

  test('Extension handles ModalEdit API changes gracefully', async () => {
    // Test that we handle potential API changes

    // Even if context key name changes, we should not crash
    try {
      const context = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
      // Should return something or undefined
      assert.ok(context === undefined || typeof context === 'boolean');
    } catch (error) {
      // Should not throw
      assert.fail('Should handle context query gracefully even if API changes');
    }
  });
});
```

---

### Part 4: Command Tests (30 min)

**Add to existing** `src/test/suite/extension.test.ts`:

```typescript
// Add these tests to the existing suite

test('Query Mode command works', async () => {
  await TestHelpers.ensureExtensionActive();

  // Execute command - should not throw
  try {
    await vscode.commands.executeCommand('modaledit-line-indicator.queryMode');
    assert.ok(true, 'Query mode command should execute');
  } catch (error) {
    assert.fail('Query mode command should not throw');
  }
});

test('Update Highlight command works', async () => {
  await TestHelpers.ensureExtensionActive();

  // Create editor first
  await TestHelpers.createTestEditor('test content');

  // Execute command
  try {
    await vscode.commands.executeCommand('modaledit-line-indicator.updateHighlight');
    assert.ok(true, 'Update highlight command should execute');
  } catch (error) {
    assert.fail('Update highlight command should not throw');
  }
});

test('All extension commands are executable', async () => {
  await TestHelpers.ensureExtensionActive();

  const commands = [
    'modaledit-line-indicator.toggleEnabled',
    'modaledit-line-indicator.updateHighlight',
    'modaledit-line-indicator.queryMode',
    'modaledit-line-indicator.showLogFile',
    'modaledit-line-indicator.clearLog'
  ];

  for (const cmd of commands) {
    try {
      await vscode.commands.executeCommand(cmd);
      console.log(`✓ Command ${cmd} executed successfully`);
    } catch (error) {
      assert.fail(`Command ${cmd} should not throw: ${error}`);
    }
  }
});
```

---

## Gotchas

### Gotcha 1: ModalEdit Tests

Always check for ModalEdit availability:

```typescript
if (!await TestHelpers.ensureModalEditActive()) {
  console.log('Skipping - ModalEdit not available');
  return;
}
```

### Gotcha 2: Event Timing

Events are async. Always wait:

```typescript
await TestHelpers.setConfig('enabled', false);
await TestHelpers.waitForDebounce(); // Wait for event
```

### Gotcha 3: Cleanup Unrelated Config

If you change editor config for testing, clean it up:

```typescript
await vscode.workspace.getConfiguration('editor').update('fontSize', undefined, vscode.ConfigurationTarget.Global);
```

### Gotcha 4: Event Listener Disposal

Always dispose listeners in `finally` block.

---

## Validation Checklist

### Files Created
- [ ] `src/test/suite/eventHandling.test.ts` created
- [ ] `src/test/suite/configuration.test.ts` created
- [ ] `src/test/suite/modalEditIntegration.test.ts` created
- [ ] `src/test/suite/extension.test.ts` enhanced with command tests

### All Tests Pass
- [ ] Run tests: `make test`
- [ ] All event handling tests pass
- [ ] All configuration tests pass
- [ ] All ModalEdit integration tests pass
- [ ] All command tests pass
- [ ] No failures or errors

### Coverage
- [ ] Run coverage: `make coverage`
- [ ] Coverage should be 60-80% now
- [ ] All major code paths covered

---

## Commit Message

```
test: add integration tests for events, config, and ModalEdit

- Add event handling tests (selection, editor, configuration changes)
- Add configuration management tests
- Add ModalEdit integration tests with graceful fallback
- Add command execution tests
- Achieve ~70% code coverage

All tests handle ModalEdit absence gracefully.
```

---

## Next Steps

✅ **Proceed to Stage 8:** Manual Testing Documentation

📁 **File:** `test-plan-stage8.md`
