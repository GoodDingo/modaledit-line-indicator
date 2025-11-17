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
        isWholeLine: true,
      });

      insertDeco = vscode.window.createTextEditorDecorationType({
        backgroundColor: '#77000020',
        border: '2px solid #aa0000',
        isWholeLine: true,
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
      const range = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 100));

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
      decorations.push(
        vscode.window.createTextEditorDecorationType({
          border: '2px solid #ff0000',
        })
      );

      // Dashed border
      decorations.push(
        vscode.window.createTextEditorDecorationType({
          border: '2px dashed #00ff00',
        })
      );

      // Dotted border
      decorations.push(
        vscode.window.createTextEditorDecorationType({
          border: '2px dotted #0000ff',
        })
      );

      // isWholeLine
      decorations.push(
        vscode.window.createTextEditorDecorationType({
          backgroundColor: '#ff0000',
          isWholeLine: true,
        })
      );

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
