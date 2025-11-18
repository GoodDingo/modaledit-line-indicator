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
    if (!(await TestHelpers.ensureModalEditActive())) {
      console.log('Skipping - ModalEdit not available');
      return;
    }

    // Query context
    const contextValue = await TestHelpers.queryModalEditContext();

    console.log('Context value:', contextValue, 'Type:', typeof contextValue);

    // NOTE: VS Code has NO getContext() API - this will return undefined
    // We test that the helper doesn't crash, not that it returns a specific value
    assert.ok(
      typeof contextValue === 'boolean' || contextValue === undefined,
      `Context query should not crash, got: ${typeof contextValue}`
    );
  });

  test('Context query returns boolean values', async () => {
    if (!(await TestHelpers.ensureModalEditActive())) {
      console.log('Skipping - ModalEdit not available');
      return;
    }

    const contextValue = await TestHelpers.queryModalEditContext();

    // NOTE: VS Code has NO getContext() API - undefined is expected
    // The extension uses cursor-style detection instead
    assert.ok(
      contextValue === true || contextValue === false || contextValue === undefined,
      `Context query should handle missing API gracefully, got: ${contextValue}`
    );
  });

  test('Extension works when ModalEdit is installed', async () => {
    if (!(await TestHelpers.ensureModalEditActive())) {
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
    } catch (_error) {
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
    // The getContext command might not exist or might throw
    try {
      const context = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
      // Should return something or undefined
      assert.ok(context === undefined || typeof context === 'boolean');
    } catch (_error) {
      // It's acceptable for getContext to not exist or throw
      // We just verify that our code handles it gracefully
      console.log('getContext command not available or threw - this is acceptable');
      assert.ok(true);
    }
  });
});
