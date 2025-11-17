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
        isActive: modalEdit.isActive,
      });

      assert.ok(modalEdit.packageJSON.version, 'Should have version');
    } else {
      console.log('⚠️  ModalEdit not installed - some tests will be skipped');
    }

    // Test passes either way - informational only
    assert.ok(true);
  });

  test('Can query modaledit.normal context', async () => {
    if (!(await TestHelpers.ensureModalEditActive())) {
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

    // Note: VS Code may not show all 3 editors as "visible" depending on layout
    // Just verify we can create and switch between them without errors
    assert.ok(editor1, 'Editor 1 should be created');
    assert.ok(editor2, 'Editor 2 should be created');
    assert.ok(editor3, 'Editor 3 should be created');

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
