import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ExtensionLogger } from './logging';
import { ConfigurationManager } from './configuration';

type Mode = 'normal' | 'insert' | 'visual' | 'search';

interface DecorationTypes {
  normal: vscode.TextEditorDecorationType;
  insert: vscode.TextEditorDecorationType;
  visual: vscode.TextEditorDecorationType;
  search: vscode.TextEditorDecorationType;
}

class ModalEditLineIndicator implements vscode.Disposable {
  private currentModeCache: Mode = 'insert';
  private decorations: DecorationTypes;
  private enabled: boolean;
  private disposables: vscode.Disposable[] = [];
  private updateDebounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 10;
  private modePollTimer: NodeJS.Timeout | null = null;
  private readonly MODE_POLL_MS = 50; // Check mode every 50ms for instant detection
  private logger: ExtensionLogger;
  private lastLoggedStateKey: string = '';
  private configManager: ConfigurationManager;

  constructor() {
    this.logger = new ExtensionLogger('ModalEdit Line Indicator');
    this.logger.log('=== ModalEditLineIndicator Constructor ===');

    this.configManager = ConfigurationManager.getInstance(this.logger);

    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
    this.enabled = config.get<boolean>('enabled', true);
    this.decorations = this.createDecorations();
  }

  /**
   * Creates text editor decoration types for all 4 modes.
   * Each mode has its own background, border color, border style, and border width.
   *
   * @returns Object containing decoration types for normal, insert, visual, and search modes
   */
  private createDecorations(): DecorationTypes {
    this.logger.log('Creating decorations for 4 modes');

    // Helper function to create decoration for a specific mode
    const createModeDecoration = (mode: Mode): vscode.TextEditorDecorationType => {
      const config = this.configManager.getConfig(mode);

      this.logger.log(`  ${mode.toUpperCase()}: ${JSON.stringify(config)}`);

      // PASSTHROUGH: Spread config directly into VS Code API
      // HARDCODED: isWholeLine always true (this is a LINE highlighter)
      return vscode.window.createTextEditorDecorationType({
        ...(config as vscode.DecorationRenderOptions), // ALL properties from config
        isWholeLine: true, // ALWAYS true, NOT configurable
      });
    };

    return {
      normal: createModeDecoration('normal'),
      insert: createModeDecoration('insert'),
      visual: createModeDecoration('visual'),
      search: createModeDecoration('search'),
    };
  }

  /**
   * Detects the current ModalEdit mode using cursor style and selection state.
   *
   * ModalEdit by default uses different cursor styles for different modes, though users
   * can configure which styles to use. The key insight: we can detect VISUAL mode reliably
   * by checking if there's an active selection, regardless of cursor styles.
   *
   * Mode detection strategy:
   * 1. Check if editor has a selection (selection.anchor != selection.active)
   * 2. If yes, and cursor is NOT the INSERT cursor → likely VISUAL mode
   * 3. Otherwise, detect based on cursor style patterns
   *
   * This works because:
   * - INSERT mode: Always uses thin cursor (Line/LineThin variants)
   * - NORMAL mode: Uses block cursor variants, NO selection
   * - VISUAL mode: Uses ANY cursor style, WITH selection
   * - SEARCH mode: Uses distinctive cursor (typically Underline variants)
   *
   * @returns The current mode ('normal' | 'insert' | 'visual' | 'search')
   */
  private detectCurrentMode(): Mode {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return 'insert';
    }

    const cursorStyle = editor.options.cursorStyle as number | undefined;
    const hasSelection = !editor.selection.isEmpty;

    // Only log when state changes
    const stateKey = `${cursorStyle}-${hasSelection}`;
    if (stateKey !== this.lastLoggedStateKey) {
      this.logger.debug(`Cursor: ${cursorStyle}, Selection: ${hasSelection}`);
      this.lastLoggedStateKey = stateKey;
    }

    // Priority 1: If there's a selection and we're NOT in LINE cursor → VISUAL mode
    // This handles all cursor configurations where VISUAL mode has a selection
    if (hasSelection && cursorStyle !== vscode.TextEditorCursorStyle.Line) {
      return 'visual';
    }

    // Priority 2: Detect based on cursor style
    switch (cursorStyle) {
      case vscode.TextEditorCursorStyle.Block: // 2 - Typical NORMAL mode
      case vscode.TextEditorCursorStyle.BlockOutline: // 5 - Alternative NORMAL/VISUAL
        return hasSelection ? 'visual' : 'normal';

      case vscode.TextEditorCursorStyle.Underline: // 3 - Typical SEARCH mode
      case vscode.TextEditorCursorStyle.UnderlineThin: // 6 - Alternative SEARCH
        return 'search';

      case vscode.TextEditorCursorStyle.LineThin: // 4 - Could be VISUAL or INSERT
        return hasSelection ? 'visual' : 'insert';

      case vscode.TextEditorCursorStyle.Line: // 1 - Typical INSERT mode
      default:
        return 'insert';
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
      // Re-check active editor in case it changed during debounce
      const currentEditor = vscode.window.activeTextEditor;
      if (currentEditor) {
        await this.applyDecorations(currentEditor);
      }
    }, this.DEBOUNCE_MS);
  }

  /**
   * Applies decorations to an editor based on the current mode.
   * Only one decoration type is applied at a time (exclusive).
   *
   * @param editor - The text editor to apply decorations to
   */
  private applyDecorations(editor: vscode.TextEditor): void {
    try {
      const fileName = path.basename(editor.document.fileName);
      const cursorLine = editor.selection.active.line;

      const currentMode = this.detectCurrentMode();

      // Only log when mode actually changes
      const modeChanged = currentMode !== this.currentModeCache;
      if (modeChanged) {
        this.logger.log('🎨 MODE CHANGED', {
          from: this.currentModeCache.toUpperCase(),
          to: currentMode.toUpperCase(),
          line: cursorLine,
          file: fileName,
        });
        this.currentModeCache = currentMode;
      }

      // Get the line(s) to decorate
      const ranges = this.getDecorateRanges(editor);

      // Clear all decorations first
      editor.setDecorations(this.decorations.normal, []);
      editor.setDecorations(this.decorations.insert, []);
      editor.setDecorations(this.decorations.visual, []);
      editor.setDecorations(this.decorations.search, []);

      // Apply decoration for current mode only
      switch (currentMode) {
        case 'normal':
          editor.setDecorations(this.decorations.normal, ranges);
          break;
        case 'insert':
          editor.setDecorations(this.decorations.insert, ranges);
          break;
        case 'visual':
          editor.setDecorations(this.decorations.visual, ranges);
          break;
        case 'search':
          editor.setDecorations(this.decorations.search, ranges);
          break;
      }

      // Only log when mode changed
      if (modeChanged) {
        this.logger.debug(
          `Applied ${currentMode.toUpperCase()} mode decoration to ${ranges.length} range(s)`
        );
      }
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
      editor.setDecorations(this.decorations.visual, []);
      editor.setDecorations(this.decorations.search, []);
    });
  }

  /**
   * Reloads decorations when configuration changes.
   * Disposes old decoration types and creates new ones with updated settings.
   */
  private reloadDecorations(): void {
    this.logger.log('Reloading decorations (config changed)');

    // Dispose old decorations
    this.decorations.normal.dispose();
    this.decorations.insert.dispose();
    this.decorations.visual.dispose();
    this.decorations.search.dispose();

    // Create new decorations with updated config
    this.decorations = this.createDecorations();

    // Reapply to all visible editors only if extension is enabled
    if (this.enabled) {
      for (const editor of vscode.window.visibleTextEditors) {
        this.applyDecorations(editor);
      }
    }
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
          this.startModePolling();
          await this.updateHighlight();
          vscode.window.showInformationMessage('ModalEdit Line Indicator: Enabled');
        } else {
          // Clear all decorations and stop polling
          this.clearAllDecorations();
          this.stopModePolling();
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
            // When disabling, clear all decorations and stop polling immediately
            this.clearAllDecorations();
            this.stopModePolling();
          } else {
            // When enabling, start polling and apply decorations
            this.startModePolling();
            this.updateHighlight();
          }
        } else if (affectsUs) {
          // Visual properties changed - need to reload decorations
          this.logger.log('Configuration changed - reloading decorations');
          this.reloadDecorations();
        }
      })
    );

    // Listen for theme changes and reload decorations
    this.disposables.push(
      vscode.window.onDidChangeActiveColorTheme(theme => {
        this.logger.log(`Color theme changed to: ${theme.kind} - reloading decorations`);
        this.reloadDecorations();
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
      vscode.commands.registerCommand('modaledit-line-indicator.queryMode', () => {
        this.logger.log('=== MANUAL MODE QUERY TRIGGERED ===');

        const currentMode = this.detectCurrentMode();
        const modeColorMap = {
          normal: 'green dotted',
          insert: 'red solid',
          visual: 'blue dashed',
          search: 'yellow solid',
        };
        const modeDescription = modeColorMap[currentMode];

        const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');
        const modalEditInfo = modalEditExt
          ? `ModalEdit v${modalEditExt.packageJSON.version} (active: ${modalEditExt.isActive})`
          : 'ModalEdit NOT installed';

        const message = `Current Mode: ${currentMode.toUpperCase()} (${modeDescription})\n${modalEditInfo}`;

        this.logger.log('Manual query result', {
          mode: currentMode,
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
        } catch (error) {
          const err = error as Error;
          vscode.window.showErrorMessage(
            `Failed to clear log file: ${err.message}. Try manually deleting: ${this.logger.getLogFilePath()}`
          );
          this.logger.error('Clear log failed', error);
        }
      })
    );
  }

  /**
   * Start polling mode to detect mode changes via cursor style
   * This is needed because VS Code doesn't fire events when cursor style changes
   */
  private startModePolling(): void {
    // Don't start if already running
    if (this.modePollTimer) {
      this.logger.debug('Mode polling already running, skipping start');
      return;
    }

    this.logger.log('Starting mode polling (every 50ms)...');

    this.modePollTimer = setInterval(() => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return;
      }

      const currentMode = this.detectCurrentMode();

      // Only update if mode actually changed
      if (currentMode !== this.currentModeCache) {
        this.logger.debug('🔄 Mode changed (poll)', {
          from: this.currentModeCache.toUpperCase(),
          to: currentMode.toUpperCase(),
        });

        this.updateHighlight();
      }
    }, this.MODE_POLL_MS);

    this.logger.log('✅ Mode polling started');
  }

  /**
   * Stop mode polling
   */
  private stopModePolling(): void {
    if (this.modePollTimer) {
      clearInterval(this.modePollTimer);
      this.modePollTimer = null;
      this.logger.log('Mode polling stopped');
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
            vscode.window
              .showWarningMessage(
                'ModalEdit Line Indicator: Could not activate ModalEdit extension. ' +
                  'Mode detection may not work correctly.',
                'Show Logs'
              )
              .then(choice => {
                if (choice === 'Show Logs') {
                  this.logger.show();
                }
              });
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
      const initialMode = this.detectCurrentMode();
      this.logger.log('Initial mode result', {
        mode: initialMode,
      });

      this.registerListeners();

      // Apply initial decorations
      this.logger.log('Applying initial decorations', {
        visibleEditors: vscode.window.visibleTextEditors.length,
      });

      for (const editor of vscode.window.visibleTextEditors) {
        this.applyDecorations(editor);
      }

      // Start polling mode for instant mode change detection
      this.startModePolling();

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

    // Stop mode polling
    this.stopModePolling();

    // Clear pending debounce timer
    if (this.updateDebounceTimer) {
      clearTimeout(this.updateDebounceTimer);
      this.updateDebounceTimer = null;
    }

    // Clear all decorations
    vscode.window.visibleTextEditors.forEach(editor => {
      editor.setDecorations(this.decorations.normal, []);
      editor.setDecorations(this.decorations.insert, []);
      editor.setDecorations(this.decorations.visual, []);
      editor.setDecorations(this.decorations.search, []);
    });

    // Dispose all listeners
    this.disposables.forEach(d => d.dispose());

    // Dispose decoration types
    this.decorations.normal.dispose();
    this.decorations.insert.dispose();
    this.decorations.visual.dispose();
    this.decorations.search.dispose();

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

  indicator
    .activate()
    .then(() => {
      // Check if ModalEdit is installed
      const modalEditInstalled = !!vscode.extensions.getExtension('johtela.vscode-modaledit');
      const hasSeenWarning = context.globalState.get('hasSeenModalEditWarning', false);

      // Show warning if ModalEdit not installed and user hasn't dismissed
      if (!modalEditInstalled && !hasSeenWarning) {
        vscode.window
          .showWarningMessage(
            'ModalEdit Line Indicator requires the ModalEdit extension for full functionality. ' +
              'Without ModalEdit, only insert mode styling will be displayed.',
            'Install ModalEdit',
            'Learn More',
            'Dismiss'
          )
          .then(choice => {
            if (choice === 'Install ModalEdit') {
              // Open extension search for ModalEdit
              vscode.commands.executeCommand(
                'workbench.extensions.search',
                '@id:johtela.vscode-modaledit'
              );
            } else if (choice === 'Learn More') {
              // Open Prerequisites documentation
              vscode.env.openExternal(
                vscode.Uri.parse(
                  'https://github.com/GoodDingo/modaledit-line-indicator/blob/main/README.md#prerequisites'
                )
              );
            } else if (choice === 'Dismiss') {
              // Store dismissal in globalState
              context.globalState.update('hasSeenModalEditWarning', true);
            }
          });
      }

      // First-run welcome notification (only if ModalEdit IS installed)
      const isFirstRun = !context.globalState.get('hasRun', false);
      if (isFirstRun && modalEditInstalled) {
        vscode.window
          .showInformationMessage(
            'ModalEdit Line Indicator active! Switch modes (Esc/i/v) to see line highlighting.',
            'Show Guide',
            'Got It'
          )
          .then(choice => {
            if (choice === 'Show Guide') {
              vscode.env.openExternal(
                vscode.Uri.parse(
                  'https://github.com/GoodDingo/modaledit-line-indicator/blob/main/README.md#quick-start'
                )
              );
            }
          });
        context.globalState.update('hasRun', true);
      }
    })
    .catch(error => {
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
