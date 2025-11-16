import * as vscode from 'vscode';

interface ModeState {
  isNormalMode: boolean;
  lastUpdateTime: number;
}

interface DecorationType {
  normal: vscode.TextEditorDecorationType;
  insert: vscode.TextEditorDecorationType;
}

class ModalEditLineIndicator implements vscode.Disposable {
  private modeState: ModeState = {
    isNormalMode: false,
    lastUpdateTime: 0,
  };

  private decorations: DecorationType;
  private enabled: boolean;
  private disposables: vscode.Disposable[] = [];
  private updateDebounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 10; // Debounce rapid updates

  constructor() {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
    this.enabled = config.get<boolean>('enabled', true);
    this.decorations = this.createDecorations();
  }

  /**
   * Create TextEditorDecorationType instances for both normal and insert modes
   * These define the visual appearance of the line highlight
   */
  private createDecorations(): DecorationType {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

    const normalBgColor = config.get<string>('normalModeBackground', '#00770020');
    const normalBorderColor = config.get<string>('normalModeBorder', '#005500');
    const insertBgColor = config.get<string>('insertModeBackground', '#77000020');
    const insertBorderColor = config.get<string>('insertModeBorder', '#aa0000');
    const borderStyle = config.get<string>('borderStyle', 'solid');
    const borderWidth = config.get<string>('borderWidth', '2px');

    const normalMode = vscode.window.createTextEditorDecorationType({
      backgroundColor: normalBgColor,
      border: `${borderWidth} ${borderStyle} ${normalBorderColor}`,
      isWholeLine: true,
      overviewRulerColor: normalBgColor,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      light: {
        backgroundColor: normalBgColor,
        border: `${borderWidth} ${borderStyle} ${normalBorderColor}`,
      },
      dark: {
        backgroundColor: normalBgColor,
        border: `${borderWidth} ${borderStyle} ${normalBorderColor}`,
      },
    });

    const insertMode = vscode.window.createTextEditorDecorationType({
      backgroundColor: insertBgColor,
      border: `${borderWidth} ${borderStyle} ${insertBorderColor}`,
      isWholeLine: true,
      overviewRulerColor: insertBgColor,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      light: {
        backgroundColor: insertBgColor,
        border: `${borderWidth} ${borderStyle} ${insertBorderColor}`,
      },
      dark: {
        backgroundColor: insertBgColor,
        border: `${borderWidth} ${borderStyle} ${insertBorderColor}`,
      },
    });

    return { normal: normalMode, insert: insertMode };
  }

  /**
   * Determine if we're currently in ModalEdit normal mode
   * Uses the context key provided by ModalEdit extension
   */
  private async isInNormalMode(): Promise<boolean> {
    try {
      // Query the ModalEdit context key
      // Returns true if in normal mode, false or undefined otherwise
      return (await vscode.commands.executeCommand('getContext', 'modaledit.normal')) === true;
    } catch (error) {
      // If ModalEdit extension is not available, default to not normal mode
      console.log('ModalEdit extension not detected or context check failed');
      return false;
    }
  }

  /**
   * Update the line highlight based on current mode
   * Debounced to avoid excessive updates during rapid mode switches
   */
  private async updateHighlight(): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    // Debounce rapid successive calls
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
    }

    this.updateDebounceTimer = setTimeout(async () => {
      await this.applyDecorations(editor);
    }, this.DEBOUNCE_MS);
  }

  /**
   * Apply the appropriate decoration to the editor based on current mode
   */
  private async applyDecorations(editor: vscode.TextEditor): Promise<void> {
    try {
      const isNormalMode = await this.isInNormalMode();
      const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
      const highlightCurrentLineOnly = config.get<boolean>('highlightCurrentLineOnly', true);

      // Get the line(s) to decorate
      const ranges = this.getDecorateRanges(editor, highlightCurrentLineOnly);

      if (isNormalMode) {
        // Apply normal mode decoration
        editor.setDecorations(this.decorations.normal, ranges);
        editor.setDecorations(this.decorations.insert, []); // Clear insert mode
        this.modeState.isNormalMode = true;
      } else {
        // Apply insert mode decoration
        editor.setDecorations(this.decorations.insert, ranges);
        editor.setDecorations(this.decorations.normal, []); // Clear normal mode
        this.modeState.isNormalMode = false;
      }

      this.modeState.lastUpdateTime = Date.now();
    } catch (error) {
      console.error('Error updating line highlight:', error);
    }
  }

  /**
   * Calculate which line ranges should be decorated
   * Can be just the current line or all lines depending on configuration
   */
  private getDecorateRanges(editor: vscode.TextEditor, currentLineOnly: boolean): vscode.Range[] {
    if (currentLineOnly) {
      // Only highlight the current cursor line
      const cursorLine = editor.selection.active.line;
      return [new vscode.Range(cursorLine, 0, cursorLine, 0)];
    } else {
      // Highlight all lines (useful for visual feedback during scrolling)
      const ranges: vscode.Range[] = [];
      for (let i = 0; i < editor.document.lineCount; i++) {
        ranges.push(new vscode.Range(i, 0, i, 0));
      }
      return ranges;
    }
  }

  /**
   * Reload decorations when settings change
   * Recreates TextEditorDecorationTypes with new colors
   */
  private reloadDecorations(): void {
    // Dispose old decorations
    this.decorations.normal.dispose();
    this.decorations.insert.dispose();

    // Create new ones with updated settings
    this.decorations = this.createDecorations();

    // Update all visible editors
    vscode.window.visibleTextEditors.forEach(editor => {
      this.applyDecorations(editor);
    });
  }

  /**
   * Register all event listeners and commands
   */
  private registerListeners(): void {
    // Update on selection/cursor change
    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection(async _e => {
        await this.updateHighlight();
      })
    );

    // Update on active editor change
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(async e => {
        if (e) {
          await this.updateHighlight();
        }
      })
    );

    // Listen for ModalEdit mode changes via commands
    // Note: ModalEdit doesn't directly expose mode change events,
    // so we rely on selection changes as a proxy
    this.disposables.push(
      vscode.commands.registerCommand('modaledit-line-indicator.updateHighlight', () =>
        this.updateHighlight()
      )
    );

    // Toggle enabled/disabled
    this.disposables.push(
      vscode.commands.registerCommand('modaledit-line-indicator.toggleEnabled', async () => {
        const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
        const newValue = !this.enabled;

        // Persist to configuration
        await config.update('enabled', newValue, vscode.ConfigurationTarget.Global);

        // Update in-memory state
        this.enabled = newValue;

        if (this.enabled) {
          await this.updateHighlight();
          vscode.window.showInformationMessage('ModalEdit Line Indicator: Enabled');
        } else {
          // Clear all decorations
          vscode.window.visibleTextEditors.forEach(editor => {
            editor.setDecorations(this.decorations.normal, []);
            editor.setDecorations(this.decorations.insert, []);
          });
          vscode.window.showInformationMessage('ModalEdit Line Indicator: Disabled');
        }
      })
    );

    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration(e => {
        if (e.affectsConfiguration('modaledit-line-indicator.enabled')) {
          // Only enabled state changed - no need to recreate decorations
          const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
          this.enabled = config.get<boolean>('enabled', true);
          this.updateHighlight();
        } else if (e.affectsConfiguration('modaledit-line-indicator')) {
          // Visual properties changed - need to reload decorations
          this.reloadDecorations();
        }
      })
    );
  }

  /**
   * Initialize the extension
   */
  public async activate(): Promise<void> {
    console.log('ModalEdit Line Indicator: Activating...');

    this.registerListeners();

    // Initial update for all open editors
    for (const editor of vscode.window.visibleTextEditors) {
      await this.applyDecorations(editor);
    }

    console.log('ModalEdit Line Indicator: Activated');
  }

  /**
   * Dispose method required by vscode.Disposable interface
   * Clean up resources when extension is deactivated
   */
  public dispose(): void {
    console.log('ModalEdit Line Indicator: Deactivating...');

    // Clear pending debounce timer
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }

    // Clear all decorations
    vscode.window.visibleTextEditors.forEach(editor => {
      editor.setDecorations(this.decorations.normal, []);
      editor.setDecorations(this.decorations.insert, []);
    });

    // Dispose all listeners
    this.disposables.forEach(d => d.dispose());

    // Dispose decoration types
    this.decorations.normal.dispose();
    this.decorations.insert.dispose();

    console.log('ModalEdit Line Indicator: Deactivated');
  }
}

let indicator: ModalEditLineIndicator;

/**
 * Extension activation entry point
 * Called when VS Code loads the extension
 */
export function activate(context: vscode.ExtensionContext): void {
  indicator = new ModalEditLineIndicator();
  context.subscriptions.push(indicator);

  indicator.activate().catch(error => {
    console.error('Error activating ModalEdit Line Indicator:', error);
  });
}

/**
 * Extension deactivation entry point
 * Called when VS Code unloads the extension
 */
export function deactivate(): void {
  if (indicator) {
    indicator.dispose();
  }
}
