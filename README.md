# ModalEdit Line Indicator

Dynamic line highlight indicator for ModalEdit extension in VS Code. Provides instant visual feedback for all 4 ModalEdit modes.

## Features

- **4-Mode Support**: Automatically changes line highlight for NORMAL, INSERT, VISUAL, and SEARCH modes
- **Per-Mode Customization**: Independent border color, style, and width for each mode
- **Real-time Updates**: Instant visual feedback as you switch between modes
- **Minimal Overhead**: Only highlights the current line
- **Zero Configuration**: Works out-of-the-box with sensible defaults

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
code --install-extension modaledit-line-indicator-0.0.1.vsix
```

## Usage

The extension works automatically once installed and ModalEdit is active.

**Default Appearance (Border-Only):**
- **Normal Mode**: Green dotted border (`#00aa00`)
- **Insert Mode**: Red solid border (`#aa0000`)
- **Visual Mode**: Blue dashed border (`#0000aa`)
- **Search Mode**: Yellow solid border (`#aaaa00`)

All modes have transparent backgrounds by default for a clean, minimalist look.

### Commands

- `ModalEdit Line Indicator: Toggle Enabled/Disabled` - Turn indicator on/off
- `ModalEdit Line Indicator: Query Current Mode (Debug)` - Show current detected mode

### Configuration

Edit your `settings.json` to customize colors and styles per mode:

```json
{
  "modaledit-line-indicator.enabled": true,

  "modaledit-line-indicator.normalModeBackground": "rgba(255, 255, 255, 0)",
  "modaledit-line-indicator.normalModeBorder": "#00aa00",
  "modaledit-line-indicator.normalModeBorderStyle": "dotted",
  "modaledit-line-indicator.normalModeBorderWidth": "2px",

  "modaledit-line-indicator.insertModeBackground": "rgba(255, 255, 255, 0)",
  "modaledit-line-indicator.insertModeBorder": "#aa0000",
  "modaledit-line-indicator.insertModeBorderStyle": "solid",
  "modaledit-line-indicator.insertModeBorderWidth": "2px",

  "modaledit-line-indicator.visualModeBackground": "rgba(255, 255, 255, 0)",
  "modaledit-line-indicator.visualModeBorder": "#0000aa",
  "modaledit-line-indicator.visualModeBorderStyle": "dashed",
  "modaledit-line-indicator.visualModeBorderWidth": "2px",

  "modaledit-line-indicator.searchModeBackground": "rgba(255, 255, 255, 0)",
  "modaledit-line-indicator.searchModeBorder": "#aaaa00",
  "modaledit-line-indicator.searchModeBorderStyle": "solid",
  "modaledit-line-indicator.searchModeBorderWidth": "2px"
}
```

## Settings

### Global Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the indicator |

### Normal Mode

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `normalModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (CSS format) |
| `normalModeBorder` | string | `#00aa00` | Border color (CSS format) |
| `normalModeBorderStyle` | enum | `dotted` | Border style (solid/dashed/dotted/double/groove/ridge/inset/outset) |
| `normalModeBorderWidth` | string | `2px` | Border width (CSS format) |

### Insert Mode

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `insertModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (CSS format) |
| `insertModeBorder` | string | `#aa0000` | Border color (CSS format) |
| `insertModeBorderStyle` | enum | `solid` | Border style (solid/dashed/dotted/double/groove/ridge/inset/outset) |
| `insertModeBorderWidth` | string | `2px` | Border width (CSS format) |

### Visual Mode

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `visualModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (CSS format) |
| `visualModeBorder` | string | `#0000aa` | Border color (CSS format) |
| `visualModeBorderStyle` | enum | `dashed` | Border style (solid/dashed/dotted/double/groove/ridge/inset/outset) |
| `visualModeBorderWidth` | string | `2px` | Border width (CSS format) |

### Search Mode

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `searchModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (CSS format) |
| `searchModeBorder` | string | `#aaaa00` | Border color (CSS format) |
| `searchModeBorderStyle` | enum | `solid` | Border style (solid/dashed/dotted/double/groove/ridge/inset/outset) |
| `searchModeBorderWidth` | string | `2px` | Border width (CSS format) |

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
