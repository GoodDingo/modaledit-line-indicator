# Test Patterns for ModalEdit Line Indicator

## Standard Test Structure

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

suite('Feature Name Tests', () => {
  // Runs before all tests in this suite
  suiteSetup(async () => {
    // One-time setup for the entire suite
    await TestHelpers.ensureExtensionActive();
  });

  // Runs before each test
  setup(async () => {
    // Per-test setup
  });

  // Runs after each test
  teardown(async () => {
    // IMPORTANT: Clean up resources
    await TestHelpers.closeAllEditors();
    await TestHelpers.resetAllConfig();
  });

  test('descriptive test name', async () => {
    // Arrange
    const editor = await TestHelpers.createTestEditor('test content');

    // Act
    await TestHelpers.moveCursorToLine(editor, 1);

    // Assert
    assert.ok(editor.selection.active.line === 1);
  });
});
```

## Pattern: Testing with ModalEdit

```typescript
test('works with ModalEdit installed', async () => {
  // Check if ModalEdit is available
  if (!(await TestHelpers.ensureModalEditActive())) {
    console.log('Skipping - ModalEdit not installed');
    return; // Gracefully skip test
  }

  // Test code that requires ModalEdit
  const context = await TestHelpers.queryModalEditContext();
  assert.notStrictEqual(context, undefined);
});
```

## Pattern: Testing Decorations

```typescript
test('can create and apply decorations', () => {
  const decoration = TestHelpers.createTestDecoration('#ff0000');

  try {
    assert.ok(decoration, 'Decoration should be created');

    // Use decoration
    // Note: Cannot verify colors, only that it doesn't crash
  } finally {
    decoration.dispose(); // Always dispose
  }
});
```

## Pattern: Testing Configuration

```typescript
test('reads configuration correctly', async () => {
  // Arrange: Set config
  await TestHelpers.setConfig('enabled', false);

  // Act: Read config
  const config = TestHelpers.getConfig();
  const enabled = config.get('enabled');

  // Assert
  assert.strictEqual(enabled, false);

  // Cleanup happens in teardown()
});
```

## Pattern: Testing Events

```typescript
test('event fires on cursor movement', async () => {
  let eventFired = false;

  const disposable = vscode.window.onDidChangeTextEditorSelection(() => {
    eventFired = true;
  });

  try {
    const editor = await TestHelpers.createTestEditor('line1\nline2');
    await TestHelpers.moveCursorToLine(editor, 1);

    assert.strictEqual(eventFired, true);
  } finally {
    disposable.dispose();
  }
});
```
