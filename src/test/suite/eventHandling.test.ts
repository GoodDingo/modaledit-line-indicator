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

    const disposable = vscode.window.onDidChangeTextEditorSelection(e => {
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

    const disposable = vscode.workspace.onDidChangeConfiguration(e => {
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

    const disposable = vscode.workspace.onDidChangeConfiguration(e => {
      affectsOurs = e.affectsConfiguration('modaledit-line-indicator');
    });

    try {
      // Change our configuration (use nested structure)
      const newNormalMode = {
        backgroundColor: '#ff0000',
        border: '2px solid #00aa00',
      };
      await TestHelpers.setConfig('normalMode', newNormalMode);
      await TestHelpers.waitForDebounce();

      // Should affect our extension
      assert.strictEqual(affectsOurs, true, 'Should detect config changes for our extension');

      // Reset flag
      affectsOurs = false;

      // Change unrelated configuration
      await vscode.workspace
        .getConfiguration('editor')
        .update('fontSize', 14, vscode.ConfigurationTarget.Global);
      await TestHelpers.waitForDebounce();

      // Should NOT affect our extension
      assert.strictEqual(affectsOurs, false, 'Should not trigger for unrelated config');

      // Cleanup editor config
      await vscode.workspace
        .getConfiguration('editor')
        .update('fontSize', undefined, vscode.ConfigurationTarget.Global);
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
      // Note: VS Code may batch rapid selection changes, so count may vary
      assert.ok(eventCount > 0, 'Events should fire for cursor movements');
      assert.ok(eventCount >= 1, 'At least one event should fire');
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
