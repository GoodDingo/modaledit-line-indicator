import * as assert from 'assert';
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
