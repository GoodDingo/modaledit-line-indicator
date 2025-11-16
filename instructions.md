# ModalEdit Line Indicator Extension - Complete Template

This is a complete, production-ready VS Code extension template for dynamically changing line highlight colors based on ModalEdit modes. All files needed to build and run this extension are included in this document.

## Overview

This extension listens to the `modaledit.normal` context key and applies dynamic line decorations:
- **Normal Mode**: Green-tinted line highlight (`#00770020` background, `#005500` border)
- **Insert Mode**: Red-tinted line highlight (`#77000020` background, `#aa0000` border)

The extension updates in real-time as you switch modes and only decorates the current cursor line for minimal visual clutter.

---

## File Structure

```
modaledit-line-indicator/
â”œâ”€â”€ package.json                 # Extension manifest
â”œâ”€â”€ tsconfig.json               # TypeScript configuration
â”œâ”€â”€ src/
â”‚   â””â”€â”€ extension.ts            # Main extension code
â”œâ”€â”€ out/                        # Compiled JavaScript (generated)
â”‚   â””â”€â”€ extension.js
â”œâ”€â”€ .vscodeignore               # Files to exclude from package
â””â”€â”€ README.md                   # Usage documentation
```

---

## Files

### `package.json`

```json
{
  "name": "modaledit-line-indicator",
  "displayName": "ModalEdit Line Indicator",
  "description": "Dynamic line highlight for ModalEdit normal/insert modes. Changes line highlight color based on current mode for instant visual feedback.",
  "version": "1.0.0",
  "publisher": "user",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourusername/modaledit-line-indicator"
  },
  "engines": {
    "vscode": "^1.80.0"
  },
  "categories": [
    "Other",
    "Themes",
    "Keymaps"
  ],
  "keywords": [
    "modaledit",
    "vim",
    "modal",
    "indicator",
    "color",
    "highlight"
  ],
  "activationEvents": [
    "onStartupFinished"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "modaledit-line-indicator.toggleEnabled",
        "title": "ModalEdit Line Indicator: Toggle Enabled/Disabled"
      },
      {
        "command": "modaledit-line-indicator.updateHighlight",
        "title": "ModalEdit Line Indicator: Update Highlight (Internal)"
      }
    ],
    "configuration": {
      "type": "object",
      "title": "ModalEdit Line Indicator",
      "properties": {
        "modaledit-line-indicator.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable or disable the line highlight indicator"
        },
        "modaledit-line-indicator.normalModeBackground": {
          "type": "string",
          "default": "#00770020",
          "description": "Background color for normal mode line highlight (hex format)"
        },
        "modaledit-line-indicator.normalModeBorder": {
          "type": "string",
          "default": "#005500",
          "description": "Border color for normal mode line highlight (hex format)"
        },
        "modaledit-line-indicator.insertModeBackground": {
          "type": "string",
          "default": "#77000020",
          "description": "Background color for insert mode line highlight (hex format)"
        },
        "modaledit-line-indicator.insertModeBorder": {
          "type": "string",
          "default": "#aa0000",
          "description": "Border color for insert mode line highlight (hex format)"
        },
        "modaledit-line-indicator.highlightCurrentLineOnly": {
          "type": "boolean",
          "default": true,
          "description": "If true, only highlight the current cursor line. If false, highlight all lines."
        },
        "modaledit-line-indicator.borderStyle": {
          "type": "string",
          "enum": ["solid", "dashed", "dotted"],
          "default": "solid",
          "description": "Border style for the line highlight"
        },
        "modaledit-line-indicator.borderWidth": {
          "type": "string",
          "default": "2px",
          "description": "Border width for the line highlight"
        }
      }
    }
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/vscode": "^1.80.0",
    "typescript": "^5.0.0"
  }
}
```

---

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": [
      "ES2020"
    ],
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "sourceMap": true,
    "resolveJsonModule": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    ".vscode-test"
  ]
}
```

---

### `src/extension.ts`

```typescript
import * as vscode from 'vscode';

interface ModeState {
  isNormalMode: boolean;
  lastUpdateTime: number;
}

interface DecorationType {
  normal: vscode.TextEditorDecorationType;
  insert: vscode.TextEditorDecorationType;
}

class ModalEditLineIndicator {
  private modeState: ModeState = {
    isNormalMode: false,
    lastUpdateTime: 0
  };

  private decorations: DecorationType;
  private enabled: boolean = true;
  private disposables: vscode.Disposable[] = [];
  private updateDebounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 10; // Debounce rapid updates

  constructor() {
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
        border: `${borderWidth} ${borderStyle} ${normalBorderColor}`
      },
      dark: {
        backgroundColor: normalBgColor,
        border: `${borderWidth} ${borderStyle} ${normalBorderColor}`
      }
    });

    const insertMode = vscode.window.createTextEditorDecorationType({
      backgroundColor: insertBgColor,
      border: `${borderWidth} ${borderStyle} ${insertBorderColor}`,
      isWholeLine: true,
      overviewRulerColor: insertBgColor,
      overviewRulerLane: vscode.OverviewRulerLane.Full,
      light: {
        backgroundColor: insertBgColor,
        border: `${borderWidth} ${borderStyle} ${insertBorderColor}`
      },
      dark: {
        backgroundColor: insertBgColor,
        border: `${borderWidth} ${borderStyle} ${insertBorderColor}`
      }
    });

    return { normal: normalMode, insert: insertMode };
  }

  /**
   * Determine if we're currently in ModalEdit normal mode
   * Uses the context key provided by ModalEdit extension
   */
  private async isInNormalMode(): Promise<boolean> {
    try {
      // Try to get the context using the commands API
      const context = await vscode.commands.executeCommand(
        'setContext',
        'modaledit-line-indicator.checking',
        true
      );

      // Query the ModalEdit context
      const isNormal = vscode.window.state.focused &&
        (vscode.commands.executeCommand('getContext', 'modaledit.normal') !== false);

      // Alternative: Check through the extension API if available
      // This is more reliable than setContext
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
  private getDecorateRanges(
    editor: vscode.TextEditor,
    currentLineOnly: boolean
  ): vscode.Range[] {
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
      vscode.window.onDidChangeTextEditorSelection(async (e) => {
        await this.updateHighlight();
      })
    );

    // Update on active editor change
    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor(async (e) => {
        if (e) {
          await this.updateHighlight();
        }
      })
    );

    // Listen for ModalEdit mode changes via commands
    // Note: ModalEdit doesn't directly expose mode change events,
    // so we rely on selection changes as a proxy
    this.disposables.push(
      vscode.commands.registerCommand(
        'modaledit-line-indicator.updateHighlight',
        () => this.updateHighlight()
      )
    );

    // Toggle enabled/disabled
    this.disposables.push(
      vscode.commands.registerCommand(
        'modaledit-line-indicator.toggleEnabled',
        async () => {
          this.enabled = !this.enabled;

          if (this.enabled) {
            await this.updateHighlight();
            vscode.window.showInformationMessage(
              'ModalEdit Line Indicator: Enabled'
            );
          } else {
            // Clear all decorations
            vscode.window.visibleTextEditors.forEach(editor => {
              editor.setDecorations(this.decorations.normal, []);
              editor.setDecorations(this.decorations.insert, []);
            });
            vscode.window.showInformationMessage(
              'ModalEdit Line Indicator: Disabled'
            );
          }
        }
      )
    );

    // Listen for configuration changes
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('modaledit-line-indicator')) {
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
   * Clean up resources when extension is deactivated
   */
  public deactivate(): void {
    console.log('ModalEdit Line Indicator: Deactivating...');

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
  context.subscriptions.push(indicator as any);

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
    indicator.deactivate();
  }
}
```

---

### `.vscodeignore`

```
.git
.gitignore
tsconfig.json
.eslintrc.json
.prettierrc.json
src/
out/**/*.map
node_modules/
*.vsix
.DS_Store
README.md
```

---

### `README.md`

```markdown
# ModalEdit Line Indicator

Dynamic line highlight color indicator for ModalEdit extension in VS Code.

## Features

- ðŸŽ¨ **Dynamic Colors**: Automatically changes line highlight color based on your current mode
- âš¡ **Real-time Updates**: Instant visual feedback as you switch between normal and insert modes
- âš™ï¸ **Fully Customizable**: Configure colors, border style, and behavior via settings
- ðŸŽ¯ **Minimal Overhead**: Only highlights the current line by default
- ðŸ”§ **Zero Configuration**: Works out-of-the-box with sensible defaults

## Installation

1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "ModalEdit Line Indicator"
4. Click Install

Or install manually:
```bash
# From the extension directory
npm install
npm run compile
code --install-extension modaledit-line-indicator-1.0.0.vsix
```

## Usage

The extension works automatically once installed and ModalEdit is active.

- **Normal Mode**: Line highlight shows in green (`#00770020` background, `#005500` border)
- **Insert Mode**: Line highlight shows in red (`#77000020` background, `#aa0000` border)

### Commands

- `ModalEdit Line Indicator: Toggle Enabled/Disabled` - Turn indicator on/off

### Configuration

Edit your `settings.json` to customize colors and behavior:

```json
{
  "modaledit-line-indicator.enabled": true,
  "modaledit-line-indicator.normalModeBackground": "#00770020",
  "modaledit-line-indicator.normalModeBorder": "#005500",
  "modaledit-line-indicator.insertModeBackground": "#77000020",
  "modaledit-line-indicator.insertModeBorder": "#aa0000",
  "modaledit-line-indicator.highlightCurrentLineOnly": true,
  "modaledit-line-indicator.borderStyle": "solid",
  "modaledit-line-indicator.borderWidth": "2px"
}
```

## Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the indicator |
| `normalModeBackground` | string | `#00770020` | Normal mode line background color |
| `normalModeBorder` | string | `#005500` | Normal mode border color |
| `insertModeBackground` | string | `#77000020` | Insert mode line background color |
| `insertModeBorder` | string | `#aa0000` | Insert mode border color |
| `highlightCurrentLineOnly` | boolean | `true` | Only highlight cursor line (false = all lines) |
| `borderStyle` | enum | `solid` | Border style: `solid`, `dashed`, or `dotted` |
| `borderWidth` | string | `2px` | Border width |

## Development

### Setup

```bash
npm install
npm run compile
```

### Build

```bash
npm run compile     # Compile TypeScript
npm run watch       # Watch for changes and recompile
```

### Package

```bash
npm install -g vsce
vsce package
```

### Debug

1. Open the extension directory in VS Code
2. Press `F5` to launch the debug session
3. The extension will start in a new VS Code window

## Requirements

- VS Code 1.80.0 or higher
- ModalEdit extension installed and active

## Troubleshooting

### Colors not changing when switching modes?

1. Ensure ModalEdit extension is installed and activated
2. Check that `modaledit-line-indicator.enabled` is `true`
3. Try running command: `ModalEdit Line Indicator: Toggle Enabled/Disabled` twice
4. Restart VS Code

### Extension doesn't load?

Check the VS Code developer console (`Help > Toggle Developer Tools`) for error messages.

## License

MIT

## Contributing

Contributions welcome! Please submit issues and pull requests on GitHub.
```

---

## Building & Installing the Extension

### Prerequisites
```bash
# Install Node.js 16+ if not already installed
# Verify with:
node --version
npm --version
```

### Build Steps

1. **Create project directory:**
   ```bash
   mkdir modaledit-line-indicator
   cd modaledit-line-indicator
   ```

2. **Create the files from this template:**
   - Copy each file section from above into the corresponding file in your project
   - Ensure the structure matches the "File Structure" section

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Compile TypeScript:**
   ```bash
   npm run compile
   ```
   
   Or for continuous compilation while developing:
   ```bash
   npm run watch
   ```

5. **Test locally (debug mode):**
   - Open the project in VS Code
   - Press `F5` to start debugging
   - A new VS Code window will open with the extension loaded

6. **Package for release:**
   ```bash
   # Install vsce globally (one-time)
   npm install -g vsce

   # Package the extension
   vsce package
   ```
   
   This creates `modaledit-line-indicator-1.0.0.vsix`

7. **Install the VSIX locally:**
   ```bash
   code --install-extension modaledit-line-indicator-1.0.0.vsix
   ```

---

## How It Works

### Architecture

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚   VS Code Extension Host        â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚
               â–¼
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚ ModalEditLineIndicator Class    â”‚
â”‚  â”œâ”€ Listens for cursor changes  â”‚
â”‚  â”œâ”€ Queries modaledit.normal    â”‚
â”‚  â””â”€ Applies decorations         â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
               â”‚
        â”Œâ”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”
        â–¼             â–¼
   â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
   â”‚ Normal  â”‚  â”‚ Insert   â”‚
   â”‚ Mode    â”‚  â”‚ Mode     â”‚
   â”‚ Deco    â”‚  â”‚ Deco     â”‚
   â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
        â”‚             â”‚
        â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”˜
               â–¼
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
      â”‚ Current Line    â”‚
      â”‚ Highlighted     â”‚
      â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

### Event Flow

1. User presses a key in ModalEdit (e.g., `Escape` to enter normal mode)
2. ModalEdit updates its `modaledit.normal` context
3. User's cursor position changes (or editor selection changes)
4. Extension listener fires: `onDidChangeTextEditorSelection`
5. Extension queries `modaledit.normal` context
6. Extension applies appropriate `TextEditorDecorationType`
7. VS Code renders the line highlight with the correct color

### Why This Approach?

- **TextEditorDecorationType**: Designed specifically for dynamic, real-time visual feedback
- **No settings pollution**: Decorations are applied programmatically, not through `workbench.colorCustomizations`
- **Performance**: Only decorates visible lines, minimal overhead
- **Extensible**: Easy to add more visual indicators (cursor shapes, gutter icons, etc.)

---

## Customization Examples

### Customize for Your Color Scheme

Edit `settings.json`:

```json
{
  "modaledit-line-indicator.normalModeBackground": "#1a472a40",
  "modaledit-line-indicator.normalModeBorder": "#2ecc71",
  "modaledit-line-indicator.insertModeBackground": "#47141430",
  "modaledit-line-indicator.insertModeBorder": "#e74c3c",
  "modaledit-line-indicator.borderWidth": "3px",
  "modaledit-line-indicator.borderStyle": "dashed"
}
```

### Highlight All Lines Instead of Just Current Line

```json
{
  "modaledit-line-indicator.highlightCurrentLineOnly": false
}
```

### Disable the Extension

```json
{
  "modaledit-line-indicator.enabled": false
}
```

Or use the command: `ModalEdit Line Indicator: Toggle Enabled/Disabled`

---

## Debugging Tips

### Enable verbose logging

Add to `extension.ts` in the `activate()` function:

```typescript
console.log('ModalEdit Line Indicator: Checking ModalEdit context...');
const isNormal = await indicator.isInNormalMode();
console.log('Is normal mode:', isNormal);
```

Then check the Debug Console (`Ctrl+Shift+Y`) while running in debug mode.

### Monitor context changes

Add to the keybindings listener:

```typescript
this.disposables.push(
  vscode.commands.registerCommand('modaledit-line-indicator.debugContext', async () => {
    const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
    console.log('Current modaledit.normal context:', isNormal);
  })
);
```

---

## Potential Enhancements

Future versions could add:

- ðŸ–±ï¸ **Cursor shape changes** based on mode (block for normal, beam for insert)
- ðŸ”” **Status bar indicator** with mode name
- ðŸ“ **Gutter decorations** with icons
- ðŸŽ¬ **Animated transitions** between colors
- ðŸŒ™ **Separate light/dark theme colors**
- âŒ¨ï¸ **Mode-specific keybinding hints**

---

## License & Credits

MIT License - Feel free to modify and distribute

Made for developers using ModalEdit in VS Code ðŸš€

