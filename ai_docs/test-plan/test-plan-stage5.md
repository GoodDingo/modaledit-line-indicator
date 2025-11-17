# Test Plan - Stage 5: Create Test Infrastructure

**Time Estimate:** 1-2 hours
**Difficulty:** Medium
**Dependencies:** Stage 4 (bug must be fixed)
**Can Skip?** ⚠️  Could skip, but NOT recommended - Makes Stages 6&7 much harder

---

## Objective

Create reusable test helpers and utilities that will make writing tests in Stages 6 and 7 much easier and more maintainable.

**WHY THIS MATTERS:** Without helpers, you'll repeat code in every test. Helpers make tests cleaner, more readable, and easier to maintain.

---

## Prerequisites

- [ ] Stage 4 completed (bug fixed)
- [ ] Extension works correctly
- [ ] Understand Mocha TDD syntax
- [ ] Understand VS Code testing basics

---

## What We're Building

1. **Test helper utilities** - Common test operations
2. **Test patterns** - Standard ways to write tests
3. **Mock/stub helpers** - For testing without full ModalEdit

---

## Instructions

### Step 1: Create Test Helpers Directory (5 min)

**Create directory:**
```bash
mkdir -p src/test/helpers
```

**Create file:**
```bash
touch src/test/helpers/testHelpers.ts
```

---

### Step 2: Create Core Test Helpers (45 min)

**File:** `src/test/helpers/testHelpers.ts`

**Add the following code:**

```typescript
import * as vscode from 'vscode';

/**
 * Test helper utilities for ModalEdit Line Indicator extension tests
 *
 * These helpers abstract common test operations to make tests
 * more readable and maintainable.
 */
export class TestHelpers {
  /**
   * Create a temporary test document with specified content
   *
   * @param content - Text content for the document
   * @returns Promise<TextDocument>
   *
   * Example:
   *   const doc = await TestHelpers.createTestDocument('line1\nline2\nline3');
   */
  static async createTestDocument(content: string): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument({
      content,
      language: 'plaintext'
    });
  }

  /**
   * Open a document in an editor
   *
   * @param doc - Document to open
   * @returns Promise<TextEditor>
   *
   * Example:
   *   const editor = await TestHelpers.openInEditor(doc);
   */
  static async openInEditor(doc: vscode.TextDocument): Promise<vscode.TextEditor> {
    return await vscode.window.showTextDocument(doc);
  }

  /**
   * Create a test document AND open it in editor (convenience method)
   *
   * @param content - Text content for the document
   * @returns Promise<TextEditor>
   *
   * Example:
   *   const editor = await TestHelpers.createTestEditor('test content');
   */
  static async createTestEditor(content: string): Promise<vscode.TextEditor> {
    const doc = await this.createTestDocument(content);
    return await this.openInEditor(doc);
  }

  /**
   * Close all open editors
   *
   * IMPORTANT: Call this in test cleanup to avoid test pollution
   *
   * Example:
   *   teardown(async () => {
   *     await TestHelpers.closeAllEditors();
   *   });
   */
  static async closeAllEditors(): Promise<void> {
    await vscode.commands.executeCommand('workbench.action.closeAllEditors');
  }

  /**
   * Wait for a specified duration
   *
   * Use for debounce delays, async operations, etc.
   *
   * @param ms - Milliseconds to wait
   *
   * Example:
   *   await TestHelpers.wait(50); // Wait for 10ms debounce + buffer
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Wait for debounce to settle
   *
   * Our extension has 10ms debounce, this waits 50ms to be safe
   *
   * Example:
   *   editor.selection = newSelection;
   *   await TestHelpers.waitForDebounce(); // Wait for update to process
   */
  static async waitForDebounce(): Promise<void> {
    return this.wait(50); // 10ms debounce + 40ms buffer
  }

  /**
   * Get the ModalEdit extension (if installed)
   *
   * @returns Extension object or undefined
   *
   * Example:
   *   const modalEdit = TestHelpers.getModalEditExtension();
   *   if (!modalEdit) {
   *     console.log('ModalEdit not installed, skipping test');
   *     return;
   *   }
   */
  static getModalEditExtension(): vscode.Extension<any> | undefined {
    return vscode.extensions.getExtension('johtela.vscode-modaledit');
  }

  /**
   * Check if ModalEdit is available and activated
   *
   * @returns Promise<boolean> - true if ModalEdit is ready
   *
   * Example:
   *   if (!await TestHelpers.ensureModalEditActive()) {
   *     console.log('Skipping test - ModalEdit not available');
   *     return;
   *   }
   */
  static async ensureModalEditActive(): Promise<boolean> {
    const modalEditExt = this.getModalEditExtension();

    if (!modalEditExt) {
      return false;
    }

    if (!modalEditExt.isActive) {
      try {
        await modalEditExt.activate();
      } catch (error) {
        console.error('Failed to activate ModalEdit:', error);
        return false;
      }
    }

    return modalEditExt.isActive;
  }

  /**
   * Query the ModalEdit context key
   *
   * @returns Promise<boolean | undefined> - Context value or undefined if not available
   *
   * Example:
   *   const isNormal = await TestHelpers.queryModalEditContext();
   *   console.log('Normal mode:', isNormal);
   */
  static async queryModalEditContext(): Promise<boolean | undefined> {
    try {
      const result = await vscode.commands.executeCommand(
        'getContext',
        'modaledit.normal'
      );
      return result as boolean | undefined;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Get extension configuration
   *
   * @returns WorkspaceConfiguration for our extension
   *
   * Example:
   *   const config = TestHelpers.getConfig();
   *   const bgColor = config.get('normalModeBackground');
   */
  static getConfig(): vscode.WorkspaceConfiguration {
    return vscode.workspace.getConfiguration('modaledit-line-indicator');
  }

  /**
   * Update a configuration value
   *
   * @param key - Configuration key (without prefix)
   * @param value - New value
   *
   * Example:
   *   await TestHelpers.setConfig('enabled', false);
   */
  static async setConfig(key: string, value: any): Promise<void> {
    const config = this.getConfig();
    await config.update(key, value, vscode.ConfigurationTarget.Global);
  }

  /**
   * Reset a configuration value to default
   *
   * @param key - Configuration key to reset
   *
   * Example:
   *   await TestHelpers.resetConfig('normalModeBackground');
   */
  static async resetConfig(key: string): Promise<void> {
    await this.setConfig(key, undefined);
  }

  /**
   * Reset all extension configurations to defaults
   *
   * IMPORTANT: Call this in test cleanup if you modified config
   *
   * Example:
   *   teardown(async () => {
   *     await TestHelpers.resetAllConfig();
   *   });
   */
  static async resetAllConfig(): Promise<void> {
    const keys = [
      'enabled',
      'normalModeBackground',
      'normalModeBorder',
      'insertModeBackground',
      'insertModeBorder',
      'borderStyle',
      'borderWidth'
    ];

    for (const key of keys) {
      await this.resetConfig(key);
    }
  }

  /**
   * Get the extension instance (if activated)
   *
   * @returns Extension object or undefined
   *
   * Example:
   *   const ext = TestHelpers.getExtension();
   *   assert.ok(ext, 'Extension should be installed');
   */
  static getExtension(): vscode.Extension<any> | undefined {
    return vscode.extensions.getExtension('user.modaledit-line-indicator');
  }

  /**
   * Ensure our extension is activated
   *
   * @returns Promise<boolean> - true if extension is active
   *
   * Example:
   *   assert.ok(await TestHelpers.ensureExtensionActive(), 'Extension should activate');
   */
  static async ensureExtensionActive(): Promise<boolean> {
    const ext = this.getExtension();

    if (!ext) {
      return false;
    }

    if (!ext.isActive) {
      try {
        await ext.activate();
      } catch (error) {
        console.error('Failed to activate extension:', error);
        return false;
      }
    }

    return ext.isActive;
  }

  /**
   * Move editor cursor to specified line
   *
   * @param editor - Editor to modify
   * @param line - Line number (0-indexed)
   *
   * Example:
   *   await TestHelpers.moveCursorToLine(editor, 2); // Move to line 3
   */
  static async moveCursorToLine(editor: vscode.TextEditor, line: number): Promise<void> {
    const position = new vscode.Position(line, 0);
    editor.selection = new vscode.Selection(position, position);

    // Wait for selection change event to process
    await this.waitForDebounce();
  }

  /**
   * Create a decoration type for testing
   *
   * @param backgroundColor - Background color
   * @returns TextEditorDecorationType (remember to dispose!)
   *
   * Example:
   *   const deco = TestHelpers.createTestDecoration('#ff0000');
   *   try {
   *     editor.setDecorations(deco, ranges);
   *   } finally {
   *     deco.dispose();
   *   }
   */
  static createTestDecoration(backgroundColor: string): vscode.TextEditorDecorationType {
    return vscode.window.createTextEditorDecorationType({
      backgroundColor,
      isWholeLine: true
    });
  }
}
```

---

### Step 3: Add Test Pattern Documentation (20 min)

**File:** `src/test/helpers/testPatterns.md`

```markdown
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
  if (!await TestHelpers.ensureModalEditActive()) {
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
```

---

### Step 4: Create Example Test (15 min)

**File:** `src/test/suite/example.test.ts`

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';
import { TestHelpers } from '../helpers/testHelpers';

/**
 * Example test suite showing how to use test helpers
 *
 * This demonstrates all common patterns.
 * Use as reference when writing actual tests.
 */
suite('Example Test Suite (Demo)', () => {
  teardown(async () => {
    await TestHelpers.closeAllEditors();
    await TestHelpers.resetAllConfig();
  });

  test('Helper: Create test document', async () => {
    const doc = await TestHelpers.createTestDocument('test content');

    assert.ok(doc);
    assert.strictEqual(doc.getText(), 'test content');
  });

  test('Helper: Create test editor', async () => {
    const editor = await TestHelpers.createTestEditor('line1\nline2\nline3');

    assert.ok(editor);
    assert.strictEqual(editor.document.lineCount, 3);
  });

  test('Helper: Move cursor', async () => {
    const editor = await TestHelpers.createTestEditor('line1\nline2');

    await TestHelpers.moveCursorToLine(editor, 1);

    assert.strictEqual(editor.selection.active.line, 1);
  });

  test('Helper: Configuration', async () => {
    await TestHelpers.setConfig('enabled', false);

    const config = TestHelpers.getConfig();
    assert.strictEqual(config.get('enabled'), false);

    // Reset happens in teardown
  });

  test('Helper: ModalEdit detection', async () => {
    const modalEdit = TestHelpers.getModalEditExtension();

    if (modalEdit) {
      console.log('ModalEdit version:', modalEdit.packageJSON.version);
    } else {
      console.log('ModalEdit not installed');
    }

    // Test passes either way - just informational
    assert.ok(true);
  });

  test('Helper: Extension detection', async () => {
    const ext = TestHelpers.getExtension();

    assert.ok(ext, 'Extension should be installed');
  });
});
```

---

### Step 5: Compile and Test Helpers (10 min)

**Compile:**
```bash
make compile
```

**Run example test:**
```bash
make test
```

**Expected:**
- All tests pass (including new example tests)
- No TypeScript errors
- Helpers work correctly

---

## Gotchas

### Gotcha 1: Always Dispose Decorations

```typescript
// WRONG - Memory leak
test('test', () => {
  const deco = vscode.window.createTextEditorDecorationType({...});
  // Never disposed!
});

// RIGHT - Proper cleanup
test('test', () => {
  const deco = vscode.window.createTextEditorDecorationType({...});
  try {
    // Use decoration
  } finally {
    deco.dispose(); // Always dispose
  }
});
```

### Gotcha 2: Always Close Editors

```typescript
// WRONG - Editors stay open
test('test', async () => {
  const editor = await TestHelpers.createTestEditor('test');
  // Editor stays open for next test!
});

// RIGHT - Cleanup in teardown
teardown(async () => {
  await TestHelpers.closeAllEditors();
});
```

### Gotcha 3: Wait for Debounce

```typescript
// WRONG - Doesn't wait for async operation
test('test', async () => {
  await TestHelpers.moveCursorToLine(editor, 1);
  // moveCursorToLine already includes wait, but if you do manual:
  editor.selection = newSelection;
  // Need to wait for debounce!
});

// RIGHT - Wait included in helper
test('test', async () => {
  await TestHelpers.moveCursorToLine(editor, 1); // Waits internally
});
```

### Gotcha 4: Reset Configuration

```typescript
// WRONG - Config changes persist to next test
test('test', async () => {
  await TestHelpers.setConfig('enabled', false);
  // Next test will see enabled=false!
});

// RIGHT - Reset in teardown
teardown(async () => {
  await TestHelpers.resetAllConfig();
});
```

---

## Validation Checklist

### Files Created
- [ ] `src/test/helpers/` directory exists
- [ ] `src/test/helpers/testHelpers.ts` created
- [ ] `src/test/helpers/testPatterns.md` created
- [ ] `src/test/suite/example.test.ts` created

### Compilation
- [ ] Code compiles without errors
- [ ] No TypeScript errors
- [ ] All helpers have proper types

### Testing
- [ ] Example tests run successfully
- [ ] `createTestDocument()` works
- [ ] `createTestEditor()` works
- [ ] `moveCursorToLine()` works
- [ ] `getConfig()` / `setConfig()` work
- [ ] `closeAllEditors()` works
- [ ] `waitForDebounce()` works

### Documentation
- [ ] All helpers have JSDoc comments
- [ ] Test patterns document is clear
- [ ] Examples are correct

---

## Next Steps

✅ **Proceed to Stage 6:** Core Behavioral Tests

📁 **File:** `test-plan-stage6.md`

**What to use:**
- All test helpers created in this stage
- Test patterns for consistency
- Example tests as reference

**Note:** Now writing tests will be much easier with these helpers!
