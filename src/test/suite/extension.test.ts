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
      'modaledit-line-indicator.clearLog',
    ];

    ourCommands.forEach(cmd => {
      assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
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
    let config = TestHelpers.getConfig();
    const initialState = config.get('enabled');

    // Execute toggle command
    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');

    // State should have changed
    // Note: Command updates config, so re-read it
    await TestHelpers.waitForDebounce(); // Wait for config update

    // Re-get config object to see updated value
    config = TestHelpers.getConfig();
    const newState = config.get('enabled');
    assert.notStrictEqual(newState, initialState, 'Toggle should change state');

    // Toggle back
    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');
    await TestHelpers.waitForDebounce();

    // Re-get config again
    config = TestHelpers.getConfig();
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

  test('Query Mode command works', async () => {
    await TestHelpers.ensureExtensionActive();

    // Execute command - should not throw
    try {
      await vscode.commands.executeCommand('modaledit-line-indicator.queryMode');
      assert.ok(true, 'Query mode command should execute');
    } catch (_error) {
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
    } catch (_error) {
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
      'modaledit-line-indicator.clearLog',
    ];

    for (const cmd of commands) {
      try {
        await vscode.commands.executeCommand(cmd);
        console.log(`✓ Command ${cmd} executed successfully`);
      } catch (_error) {
        assert.fail(`Command ${cmd} should not throw: ${_error}`);
      }
    }
  });
});
