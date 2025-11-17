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
  static getModalEditExtension(): vscode.Extension<unknown> | undefined {
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
    } catch (_error) {
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
  static async setConfig(key: string, value: unknown): Promise<void> {
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
    const keys = ['enabled', 'normalMode', 'insertMode', 'visualMode', 'searchMode'];

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
  static getExtension(): vscode.Extension<unknown> | undefined {
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

  /**
   * Get current VS Code theme kind
   *
   * @returns Current theme kind (Dark, Light, HighContrast, or HighContrastLight)
   *
   * Example:
   *   const themeKind = TestHelpers.getCurrentThemeKind();
   *   if (themeKind === vscode.ColorThemeKind.Dark) {
   *     // Test dark theme behavior
   *   }
   */
  static getCurrentThemeKind(): vscode.ColorThemeKind {
    return vscode.window.activeColorTheme.kind;
  }

  /**
   * Check if current theme is dark
   *
   * @returns true if dark theme, false otherwise
   *
   * Example:
   *   if (TestHelpers.isDarkTheme()) {
   *     // Test dark-specific behavior
   *   }
   */
  static isDarkTheme(): boolean {
    return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark;
  }

  /**
   * Check if current theme is light
   *
   * @returns true if light theme, false otherwise
   *
   * Example:
   *   if (TestHelpers.isLightTheme()) {
   *     // Test light-specific behavior
   *   }
   */
  static isLightTheme(): boolean {
    return vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Light;
  }

  /**
   * Check if current theme is high contrast
   *
   * @returns true if high contrast theme, false otherwise
   *
   * Example:
   *   if (TestHelpers.isHighContrastTheme()) {
   *     // Test high contrast-specific behavior
   *   }
   */
  static isHighContrastTheme(): boolean {
    const kind = vscode.window.activeColorTheme.kind;
    return (
      kind === vscode.ColorThemeKind.HighContrast ||
      kind === vscode.ColorThemeKind.HighContrastLight
    );
  }

  /**
   * Set theme-specific override for a mode
   *
   * @param mode - Mode name (normalMode, insertMode, visualMode, searchMode)
   * @param theme - Theme kind ('dark', 'light', or 'highContrast')
   * @param properties - Properties to override for this theme
   *
   * Example:
   *   await TestHelpers.setThemeOverride('normalMode', 'dark', {
   *     border: '#00ffff',
   *     borderWidth: '3px'
   *   });
   */
  static async setThemeOverride(
    mode: string,
    theme: 'dark' | 'light' | 'highContrast',
    properties: Record<string, string>
  ): Promise<void> {
    const config = this.getConfig();
    const currentMode = (config.get(mode) as Record<string, unknown>) || {};

    const updatedMode = {
      ...currentMode,
      [`[${theme}]`]: properties,
    };

    await this.setConfig(mode, updatedMode);
  }

  /**
   * Get theme-specific override for a mode
   *
   * @param mode - Mode name (normalMode, insertMode, visualMode, searchMode)
   * @param theme - Theme kind ('dark', 'light', or 'highContrast')
   * @returns Theme-specific properties or undefined
   *
   * Example:
   *   const darkOverride = TestHelpers.getThemeOverride('normalMode', 'dark');
   *   assert.strictEqual(darkOverride.border, '#00ffff');
   */
  static getThemeOverride(
    mode: string,
    theme: 'dark' | 'light' | 'highContrast'
  ): Record<string, string> | undefined {
    const config = this.getConfig();
    const modeConfig = config.get(mode) as Record<string, unknown>;

    if (!modeConfig) {
      return undefined;
    }

    return modeConfig[`[${theme}]`] as Record<string, string> | undefined;
  }

  /**
   * Set complete nested mode configuration (common + theme overrides)
   *
   * @param mode - Mode name
   * @param commonProps - Common properties for all themes
   * @param themeOverrides - Optional theme-specific overrides
   *
   * Example:
   *   await TestHelpers.setNestedModeConfig(
   *     'normalMode',
   *     { background: 'rgba(255, 255, 255, 0)', borderStyle: 'solid', borderWidth: '2px' },
   *     {
   *       dark: { border: '#00ffff' },
   *       light: { border: '#0000ff' }
   *     }
   *   );
   */
  static async setNestedModeConfig(
    mode: string,
    commonProps: Record<string, string>,
    themeOverrides?: {
      dark?: Record<string, string>;
      light?: Record<string, string>;
      highContrast?: Record<string, string>;
    }
  ): Promise<void> {
    const config: Record<string, unknown> = { ...commonProps };

    if (themeOverrides) {
      if (themeOverrides.dark) {
        config['[dark]'] = themeOverrides.dark;
      }
      if (themeOverrides.light) {
        config['[light]'] = themeOverrides.light;
      }
      if (themeOverrides.highContrast) {
        config['[highContrast]'] = themeOverrides.highContrast;
      }
    }

    await this.setConfig(mode, config);
  }

  /**
   * Get nested mode configuration
   *
   * @param mode - Mode name
   * @returns Complete mode configuration object
   *
   * Example:
   *   const normalMode = TestHelpers.getNestedModeConfig('normalMode');
   *   assert.strictEqual(normalMode.border, '#00aa00');
   *   assert.ok(normalMode['[dark]']);
   */
  static getNestedModeConfig(mode: string): Record<string, unknown> {
    const config = this.getConfig();
    return (config.get(mode) as Record<string, unknown>) || {};
  }
}
