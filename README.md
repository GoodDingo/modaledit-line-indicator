# ModalEdit Line Indicator

Dynamic line highlight color indicator for ModalEdit extension in VS Code.

## Features

- **Dynamic Colors**: Automatically changes line highlight color based on your current mode
- **Real-time Updates**: Instant visual feedback as you switch between normal and insert modes
- **Fully Customizable**: Configure colors, border style, and behavior via settings
- **Minimal Overhead**: Only highlights the current line by default
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
