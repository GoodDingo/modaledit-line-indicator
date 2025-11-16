import * as assert from 'assert';
import * as vscode from 'vscode';

suite('ModalEdit Line Indicator Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('user.modaledit-line-indicator'));
  });

  test('Extension should activate', async () => {
    const extension = vscode.extensions.getExtension('user.modaledit-line-indicator');
    assert.ok(extension);
    await extension!.activate();
    assert.strictEqual(extension!.isActive, true);
  });

  test('Commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('modaledit-line-indicator.toggleEnabled'));
    assert.ok(commands.includes('modaledit-line-indicator.updateHighlight'));
  });

  test('Configuration should have default values', async () => {
    // Ensure enabled is set to true for this test
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
    await config.update('enabled', true, vscode.ConfigurationTarget.Global);
    // Allow additional time for configuration to propagate
    await new Promise(resolve => setTimeout(resolve, 200));

    const updatedConfig = vscode.workspace.getConfiguration('modaledit-line-indicator');
    assert.strictEqual(updatedConfig.get('enabled'), true);
    assert.strictEqual(
      updatedConfig.get('normalModeBackground'),
      '#00770020',
      'normalModeBackground should match default'
    );
    assert.strictEqual(
      updatedConfig.get('insertModeBackground'),
      '#77000020',
      'insertModeBackground should match default'
    );
    assert.strictEqual(
      updatedConfig.get('borderStyle'),
      'solid',
      'borderStyle should match default'
    );
    assert.strictEqual(updatedConfig.get('borderWidth'), '2px', 'borderWidth should match default');
  });

  test('Toggle command should work', async () => {
    const initialConfig = vscode.workspace.getConfiguration('modaledit-line-indicator');
    const initialState = initialConfig.get<boolean>('enabled');

    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');

    // Give it time to update and refetch config
    await new Promise(resolve => setTimeout(resolve, 500));

    const updatedConfig = vscode.workspace.getConfiguration('modaledit-line-indicator');
    const newState = updatedConfig.get<boolean>('enabled');
    assert.strictEqual(newState, !initialState);

    // Toggle back to restore original state
    await vscode.commands.executeCommand('modaledit-line-indicator.toggleEnabled');
    await new Promise(resolve => setTimeout(resolve, 500));
  });
});
