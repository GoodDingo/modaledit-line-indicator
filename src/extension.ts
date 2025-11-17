import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Logger that writes to both VS Code output channel and file
 * Dual output ensures we can review logs even after VS Code closes
 */
class ExtensionLogger {
  private outputChannel: vscode.OutputChannel;
  private logFilePath: string;

  constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);

    // Log to temp directory - accessible across sessions
    this.logFilePath = path.join(os.tmpdir(), 'modaledit-line-indicator.log');

    // Clear old log on startup
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (_err) {
      // Ignore if can't write - not critical
    }

    this.log('=== NEW SESSION STARTED ===');
    this.log(`Log file: ${this.logFilePath}`);
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  log(message: string, data?: unknown): void {
    const formatted = this.formatMessage('INFO', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, data?: unknown): void {
    const formatted = this.formatMessage('DEBUG', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, error?: unknown): void {
    const errorStr = error instanceof Error ? error.stack || error.message : String(error || '');
    const formatted = this.formatMessage('ERROR', message, { error: errorStr });
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (_err) {
      // Don't crash if file write fails
    }
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
}

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
  private readonly DEBOUNCE_MS = 10;
  private cursorStylePollTimer: NodeJS.Timeout | null = null;
  private readonly CURSOR_POLL_MS = 50; // Check cursor style every 50ms (faster!)
  private lastKnownCursorStyle: number | undefined = undefined; // Debounce rapid updates
  private logger: ExtensionLogger;

  constructor() {
    this.logger = new ExtensionLogger('ModalEdit Line Indicator');
    this.logger.log('=== ModalEditLineIndicator Constructor ===');
    this.logger.show(); // Auto-show output channel

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
   * Detects mode by checking the cursor style that ModalEdit sets
   */
  private async isInNormalMode(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return false;
    }

    // ModalEdit sets different cursor styles for different modes:
    // - Normal mode: Block cursor (vscode.TextEditorCursorStyle.Block = 2)
    // - Insert mode: Line cursor (vscode.TextEditorCursorStyle.Line = 1)
    const cursorStyle = editor.options.cursorStyle as number | undefined;

    // Block cursor (2) = Normal mode, anything else = Insert mode
    return cursorStyle === vscode.TextEditorCursorStyle.Block;
  }

  private getCursorStyleName(style: number | undefined): string {
    if (style === undefined) {
      return 'undefined';
    }
    const names = ['Line', 'Block', 'Underline', 'LineThin', 'BlockOutline', 'UnderlineThin'];
    return names[style - 1] || `Unknown(${style})`;
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
      const fileName = path.basename(editor.document.fileName);
      const cursorLine = editor.selection.active.line;

      const isNormalMode = await this.isInNormalMode();

      // Only log when mode actually changes
      const modeChanged = isNormalMode !== this.modeState.isNormalMode;
      if (modeChanged) {
        this.logger.log('🎨 MODE CHANGED', {
          from: this.modeState.isNormalMode ? 'NORMAL' : 'INSERT',
          to: isNormalMode ? 'NORMAL' : 'INSERT',
          color: isNormalMode ? 'GREEN' : 'RED',
          line: cursorLine,
          file: fileName,
        });
      }

      // Get the line(s) to decorate
      const ranges = this.getDecorateRanges(editor);

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
      this.logger.error('Error updating line highlight', error);
    }
  }

  /**
   * Calculate which line ranges should be decorated
   * Always highlights only the current cursor line
   */
  private getDecorateRanges(editor: vscode.TextEditor): vscode.Range[] {
    // Only highlight the current cursor line
    const cursorLine = editor.selection.active.line;
    return [new vscode.Range(cursorLine, 0, cursorLine, 0)];
  }

  /**
   * Clear all decorations from all visible editors
   */
  private clearAllDecorations(): void {
    vscode.window.visibleTextEditors.forEach(editor => {
      editor.setDecorations(this.decorations.normal, []);
      editor.setDecorations(this.decorations.insert, []);
    });
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
      vscode.window.onDidChangeTextEditorSelection(async () => {
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

    // Manual update command
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
        const affectsUs = e.affectsConfiguration('modaledit-line-indicator');
        this.logger.debug('⚙️  EVENT: onDidChangeConfiguration', {
          affectsUs,
        });

        if (e.affectsConfiguration('modaledit-line-indicator.enabled')) {
          // Enabled state changed
          const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
          const newEnabled = config.get<boolean>('enabled', true);

          this.logger.log(`Extension ${newEnabled ? 'enabled' : 'disabled'}`);
          this.enabled = newEnabled;

          if (!newEnabled) {
            // When disabling, clear all decorations immediately
            this.clearAllDecorations();
          } else {
            // When enabling, apply decorations
            this.updateHighlight();
          }
        } else if (affectsUs) {
          // Visual properties changed - need to reload decorations
          this.logger.log('Configuration changed - reloading decorations');
          this.reloadDecorations();
        }
      })
    );

    // Command: Show log file location
    this.disposables.push(
      vscode.commands.registerCommand('modaledit-line-indicator.showLogFile', () => {
        const logPath = this.logger.getLogFilePath();

        vscode.window
          .showInformationMessage(
            `Log file: ${logPath}`,
            'Open File',
            'Copy Path',
            'Reveal in Finder/Explorer'
          )
          .then(choice => {
            if (choice === 'Open File') {
              vscode.workspace.openTextDocument(logPath).then(doc => {
                vscode.window.showTextDocument(doc);
              });
            } else if (choice === 'Copy Path') {
              vscode.env.clipboard.writeText(logPath);
              vscode.window.showInformationMessage('Path copied to clipboard');
            } else if (choice === 'Reveal in Finder/Explorer') {
              vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(logPath));
            }
          });
      })
    );

    // Command: Manual mode query
    this.disposables.push(
      vscode.commands.registerCommand('modaledit-line-indicator.queryMode', async () => {
        this.logger.log('=== MANUAL MODE QUERY TRIGGERED ===');

        const isNormal = await this.isInNormalMode();
        const mode = isNormal ? 'NORMAL (green)' : 'INSERT (red)';

        const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');
        const modalEditInfo = modalEditExt
          ? `ModalEdit v${modalEditExt.packageJSON.version} (active: ${modalEditExt.isActive})`
          : 'ModalEdit NOT installed';

        const message = `Current Mode: ${mode}\n${modalEditInfo}`;

        this.logger.log('Manual query result', {
          isNormalMode: isNormal,
          modalEditPresent: !!modalEditExt,
          modalEditActive: modalEditExt?.isActive,
        });

        vscode.window.showInformationMessage(message);
      })
    );

    // Command: Clear log file
    this.disposables.push(
      vscode.commands.registerCommand('modaledit-line-indicator.clearLog', () => {
        try {
          const logPath = this.logger.getLogFilePath();
          fs.writeFileSync(logPath, '');
          this.logger.log('=== LOG CLEARED BY USER ===');
          vscode.window.showInformationMessage('Log file cleared');
        } catch (_error) {
          vscode.window.showErrorMessage('Failed to clear log file');
        }
      })
    );
  }

  /**
   * Start polling cursor style to detect mode changes
   * This is needed because VS Code doesn't fire events when cursor style changes
   */
  private startCursorStylePolling(): void {
    this.logger.log('Starting cursor style polling (every 50ms)...');

    this.cursorStylePollTimer = setInterval(async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentStyle = editor.options.cursorStyle as number | undefined;

      // Only update if cursor style actually changed
      if (currentStyle !== this.lastKnownCursorStyle) {
        this.logger.debug('🔄 Cursor style changed (poll)', {
          from: this.getCursorStyleName(this.lastKnownCursorStyle),
          to: this.getCursorStyleName(currentStyle),
        });

        this.lastKnownCursorStyle = currentStyle;
        await this.updateHighlight();
      }
    }, this.CURSOR_POLL_MS);

    this.logger.log('✅ Cursor style polling started');
  }

  /**
   * Stop cursor style polling
   */
  private stopCursorStylePolling(): void {
    if (this.cursorStylePollTimer) {
      clearInterval(this.cursorStylePollTimer);
      this.cursorStylePollTimer = null;
      this.logger.log('Cursor style polling stopped');
    }
  }

  /**
   * Initialize the extension
   */
  public async activate(): Promise<void> {
    try {
      this.logger.log('=== ACTIVATION START ===');

      // Check for ModalEdit extension
      const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');

      if (modalEditExt) {
        this.logger.log('ModalEdit extension FOUND', {
          id: modalEditExt.id,
          version: modalEditExt.packageJSON.version,
          isActive: modalEditExt.isActive,
        });

        if (!modalEditExt.isActive) {
          this.logger.log('Activating ModalEdit...');
          try {
            await modalEditExt.activate();
            this.logger.log('ModalEdit activated successfully');
          } catch (error) {
            this.logger.error('Failed to activate ModalEdit', error);
          }
        }

        // Wait for ModalEdit to set its context
        this.logger.log('Waiting for ModalEdit to initialize context...');
        await new Promise(resolve => setTimeout(resolve, 200));
        this.logger.log('Wait complete, proceeding with mode detection...');
      } else {
        this.logger.log('⚠️  ModalEdit extension NOT FOUND - will default to insert mode');
      }

      // Test initial mode detection
      this.logger.log('Testing initial mode detection...');
      const initialMode = await this.isInNormalMode();
      this.logger.log('Initial mode result', {
        isNormalMode: initialMode,
        expectedColor: initialMode ? 'GREEN (normal)' : 'RED (insert)',
      });

      this.registerListeners();

      // Apply initial decorations
      this.logger.log('Applying initial decorations', {
        visibleEditors: vscode.window.visibleTextEditors.length,
      });

      for (const editor of vscode.window.visibleTextEditors) {
        await this.applyDecorations(editor);
      }

      // Start polling cursor style for instant mode change detection
      this.startCursorStylePolling();

      this.logger.log('=== ACTIVATION COMPLETE ===');
    } catch (error) {
      this.logger.error('FATAL: Activation failed', error);
      throw error; // Re-throw so VS Code knows activation failed
    }
  }

  /**
   * Dispose method required by vscode.Disposable interface
   * Clean up resources when extension is deactivated
   */
  public dispose(): void {
    this.logger.log('=== DEACTIVATION START ===');

    // Stop cursor style polling
    this.stopCursorStylePolling();

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

    this.logger.log('=== DEACTIVATION COMPLETE ===');
    this.logger.dispose();
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
