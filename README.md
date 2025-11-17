# ModalEdit Line Indicator

Dynamic line highlight indicator for ModalEdit extension in VS Code. Provides instant visual feedback for all 4 ModalEdit modes with theme-aware styling.

## Features

- **4-Mode Support**: Automatically changes line highlight for NORMAL, INSERT, VISUAL, and SEARCH modes
- **Theme-Aware Configuration**: Different colors for dark, light, and high contrast themes
- **Real-time Theme Switching**: Instantly adapts when you change VS Code themes
- **Per-Mode Customization**: Independent styling for each mode
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
code --install-extension modaledit-line-indicator-0.1.3.vsix
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
- `ModalEdit Line Indicator: Show Log File` - Open log file for troubleshooting
- `ModalEdit Line Indicator: Clear Log` - Clear the log file

## Configuration

### Basic Configuration

Edit your `settings.json` to customize colors and styles per mode:

```json
{
  "modaledit-line-indicator.enabled": true,

  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#00aa00",
    "borderStyle": "dotted",
    "borderWidth": "2px"
  },

  "modaledit-line-indicator.insertMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#aa0000",
    "borderStyle": "solid",
    "borderWidth": "2px"
  },

  "modaledit-line-indicator.visualMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#0000aa",
    "borderStyle": "dashed",
    "borderWidth": "2px"
  },

  "modaledit-line-indicator.searchMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#aaaa00",
    "borderStyle": "solid",
    "borderWidth": "2px"
  }
}
```

### Theme-Specific Configuration

You can specify different colors for dark, light, and high contrast themes (both dark and light variants):

```json
{
  "modaledit-line-indicator.normalMode": {
    // Common properties (apply to all themes unless overridden)
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dotted",
    "borderWidth": "2px",

    // Dark theme override (also used as fallback for high contrast dark)
    "[dark]": {
      "border": "#00ffff"  // Cyan in dark themes
    },

    // Light theme override (also used as fallback for high contrast light)
    "[light]": {
      "border": "#0000ff"  // Blue in light themes
    },

    // High contrast dark theme override
    "[highContrastDark]": {
      "border": "#ffffff",
      "borderWidth": "4px"  // Thicker border for better visibility
    },

    // High contrast light theme override
    "[highContrastLight]": {
      "border": "#000000",
      "borderWidth": "4px"  // Thicker border for better visibility
    }
  }
}
```

**How It Works:**
1. **Common properties** (background, border, borderStyle, borderWidth) apply to all themes
2. **Theme-specific overrides** (`[dark]`, `[light]`, `[highContrastDark]`, `[highContrastLight]`) selectively override properties
3. **Cascading fallback hierarchy** for high contrast themes:
   - High Contrast Dark: `[highContrastDark]` → `[dark]` → common → defaults
   - High Contrast Light: `[highContrastLight]` → `[light]` → common → defaults
4. Extension automatically detects your current theme and applies the appropriate styling
5. When you switch themes, the extension instantly updates the decorations

### Practical Examples

#### Example 1: Subtle Indicators

Minimal borders that don't distract:

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#00aa00",
    "borderStyle": "solid",
    "borderWidth": "1px"
  },
  "modaledit-line-indicator.insertMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#aa0000",
    "borderStyle": "solid",
    "borderWidth": "1px"
  },
  "modaledit-line-indicator.visualMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#0000aa",
    "borderStyle": "solid",
    "borderWidth": "1px"
  },
  "modaledit-line-indicator.searchMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#aaaa00",
    "borderStyle": "solid",
    "borderWidth": "1px"
  }
}
```

#### Example 2: High Visibility with Backgrounds

Bold indicators with colored backgrounds:

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(0, 255, 0, 0.1)",
    "border": "#00ff00",
    "borderStyle": "solid",
    "borderWidth": "3px"
  },
  "modaledit-line-indicator.insertMode": {
    "background": "rgba(255, 0, 0, 0.1)",
    "border": "#ff0000",
    "borderStyle": "solid",
    "borderWidth": "3px"
  },
  "modaledit-line-indicator.visualMode": {
    "background": "rgba(0, 0, 255, 0.1)",
    "border": "#0000ff",
    "borderStyle": "solid",
    "borderWidth": "3px"
  },
  "modaledit-line-indicator.searchMode": {
    "background": "rgba(255, 255, 0, 0.1)",
    "border": "#ffff00",
    "borderStyle": "solid",
    "borderWidth": "3px"
  }
}
```

#### Example 3: Theme-Adaptive (Recommended)

Different colors for dark and light themes:

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dotted",
    "borderWidth": "2px",
    "[dark]": {
      "border": "#00ffff",  // Bright cyan for dark
      "background": "rgba(0, 255, 255, 0.05)"
    },
    "[light]": {
      "border": "#0000aa",  // Darker blue for light
      "background": "rgba(0, 0, 255, 0.05)"
    }
  },
  "modaledit-line-indicator.insertMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "solid",
    "borderWidth": "2px",
    "[dark]": {
      "border": "#ff6666"  // Softer red for dark
    },
    "[light]": {
      "border": "#cc0000"  // Deeper red for light
    }
  },
  "modaledit-line-indicator.visualMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dashed",
    "borderWidth": "2px",
    "[dark]": {
      "border": "#ff00ff"  // Magenta for dark
    },
    "[light]": {
      "border": "#8800aa"  // Purple for light
    }
  },
  "modaledit-line-indicator.searchMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "solid",
    "borderWidth": "2px",
    "[dark]": {
      "border": "#ffff00"  // Yellow for dark
    },
    "[light]": {
      "border": "#aa8800"  // Gold for light
    }
  }
}
```

## Settings Reference

### Global Setting

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the indicator |

### Mode Configuration

Each mode (`normalMode`, `insertMode`, `visualMode`, `searchMode`) supports the following properties:

| Property | Type | Description |
|----------|------|-------------|
| `background` | string | Background color (CSS format, e.g., `rgba(255, 0, 0, 0.1)`) |
| `border` | string | Border color (CSS format, e.g., `#ff0000` or `rgb(255, 0, 0)`) |
| `borderStyle` | string | Border style: `solid`, `dashed`, `dotted`, `double`, `groove`, `ridge`, `inset`, `outset` |
| `borderWidth` | string | Border width (CSS format, e.g., `2px`, `0.1em`) |
| `[dark]` | object | Override properties for dark themes (also fallback for HC dark) |
| `[light]` | object | Override properties for light themes (also fallback for HC light) |
| `[highContrastDark]` | object | Override properties for high contrast dark themes |
| `[highContrastLight]` | object | Override properties for high contrast light themes |

**Theme Override Objects** can contain any combination of the above properties.

**Cascading Fallback**: Each property (background, border, borderStyle, borderWidth) is resolved independently through the fallback chain:
- **HC Dark**: `[highContrastDark]` → `[dark]` → common → defaults
- **HC Light**: `[highContrastLight]` → `[light]` → common → defaults
- **Regular Dark/Light**: `[dark/light]` → common → defaults

This allows selective overrides (e.g., only override `borderWidth` for high contrast, inherit other properties from the base theme).

## Migration from v0.1.1

If you're upgrading from version 0.1.1, the configuration format has changed from flat to nested:

### Old Format (v0.1.1)
```json
{
  "modaledit-line-indicator.normalModeBackground": "rgba(255, 255, 255, 0)",
  "modaledit-line-indicator.normalModeBorder": "#00aa00",
  "modaledit-line-indicator.normalModeBorderStyle": "dotted",
  "modaledit-line-indicator.normalModeBorderWidth": "2px"
}
```

### New Format (v0.1.3+)
```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#00aa00",
    "borderStyle": "dotted",
    "borderWidth": "2px"
  }
}
```

**Migration Steps:**
1. Open your `settings.json`
2. Group properties for each mode into a nested object
3. Rename properties (remove the mode prefix): `normalModeBorder` → `border`
4. Repeat for all four modes: `normalMode`, `insertMode`, `visualMode`, `searchMode`
5. (Optional) Add theme-specific overrides using `[dark]`, `[light]`, `[highContrastDark]`, `[highContrastLight]` keys

## Migration from v0.1.2

If you're upgrading from v0.1.2 and used `[highContrast]` configuration:

**BREAKING CHANGE**: The `[highContrast]` key has been removed in favor of separate `[highContrastDark]` and `[highContrastLight]` keys.

**Before (v0.1.2):**

```json
{
  "modaledit-line-indicator.normalMode": {
    "borderStyle": "dotted",
    "[highContrast]": {
      "border": "#ffffff",
      "borderWidth": "4px"
    }
  }
}
```

**After (v0.1.3):**

```json
{
  "modaledit-line-indicator.normalMode": {
    "borderStyle": "dotted",
    "[highContrastDark]": {
      "border": "#ffffff",
      "borderWidth": "4px"
    },
    "[highContrastLight]": {
      "border": "#000000",
      "borderWidth": "4px"
    }
  }
}
```

**Why?** VS Code distinguishes between high contrast dark and high contrast light themes. The old `[highContrast]` was applied to both, which could result in poor visibility (e.g., white borders on white background in HC light themes).

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow and contribution guidelines.

## Requirements

- VS Code 1.106.0 or higher
- ModalEdit extension installed and active

## Troubleshooting

### Colors not changing when switching modes?

1. Ensure ModalEdit extension is installed and activated
2. Check that `modaledit-line-indicator.enabled` is `true`
3. Try running command: `ModalEdit Line Indicator: Toggle Enabled/Disabled` twice
4. Check logs: Run `ModalEdit Line Indicator: Show Log File` command
5. Restart VS Code

### Theme-specific colors not applying?

1. Verify your theme kind (dark/light/high contrast dark/high contrast light) in VS Code
2. Check that you've defined the appropriate theme override (`[dark]`, `[light]`, `[highContrastDark]`, or `[highContrastLight]`)
3. Ensure theme override property names match exactly (case-sensitive)
4. Remember the cascading fallback: HC dark falls back to `[dark]`, HC light falls back to `[light]`
5. Try switching to a different theme and back

### Extension doesn't load?

1. Check the VS Code developer console (`Help > Toggle Developer Tools`) for error messages
2. Run `ModalEdit Line Indicator: Show Log File` to view extension logs
3. Verify your configuration syntax is valid JSON

## License

MIT

## Contributing

Contributions welcome! Please submit issues and pull requests on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.
