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
      language: 'plaintext',
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
      const result = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
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
      'borderWidth',
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
      isWholeLine: true,
    });
  }
}
