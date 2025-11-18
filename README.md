# ModalEdit Line Indicator

Dynamic line highlight indicator for ModalEdit extension in VS Code. Provides instant visual feedback for all 4 ModalEdit modes with theme-aware styling.

## Quick Start

1. **Install:** VS Code Marketplace → "ModalEdit Line Indicator"
2. **Verify:** Open a file → Press `Esc` → See green dotted border on current line
3. **Test modes:**
   - `Esc` = Normal mode (green dotted border)
   - `i` = Insert mode (red solid border)
   - `v` = Visual mode (blue dashed border)
   - `/` = Search mode (yellow solid border)
4. **Customize:** Settings → Search "modaledit-line-indicator"

<!-- TODO: Add screenshot showing green border after activating -->

✅ **Working?** Skip to [Configuration](#configuration) for customization options
❌ **Issues?** See [Troubleshooting](#troubleshooting) for common problems

## Features

- **4-Mode Support**: Automatically changes line highlight for NORMAL, INSERT, VISUAL, and SEARCH modes
- **Theme-Aware Configuration**: Different colors for dark, light, and high contrast themes
- **Real-time Theme Switching**: Instantly adapts when you change VS Code themes
- **Per-Mode Customization**: Independent styling for each mode
- **Minimal Overhead**: Only highlights the current line
- **Zero Configuration**: Works out-of-the-box with sensible defaults

## Visual Examples

<!-- TODO: Add screenshots here before release -->
<!-- Required images (create and place in images/ directory): -->
<!-- 1. images/normal-mode.png - Normal mode with green dotted border -->
<!-- 2. images/insert-mode.png - Insert mode with red solid border -->
<!-- 3. images/visual-mode.png - Visual mode with blue dashed border -->
<!-- 4. images/search-mode.png - Search mode with yellow solid border -->
<!-- 5. images/mode-switching.gif - Animated GIF showing mode transitions (Esc→i→v, 3-5 seconds) -->
<!-- 6. images/settings-ui.png - Settings UI with example configuration -->
<!-- 7. images/output-channel.png - Output Channel logs example -->

**Normal Mode (Green Dotted Border)**
<!-- ![Normal Mode](images/normal-mode.png) -->
*TODO: Screenshot showing current line with green dotted border. Caption: "Normal mode provides a green dotted border for clear visual feedback."*

**Insert Mode (Red Solid Border)**
<!-- ![Insert Mode](images/insert-mode.png) -->
*TODO: Screenshot showing current line with red solid border. Caption: "Insert mode uses a red solid border to indicate editing state."*

**Visual Mode (Blue Dashed Border)**
<!-- ![Visual Mode](images/visual-mode.png) -->
*TODO: Screenshot showing current line with blue dashed border. Caption: "Visual mode displays a blue dashed border for selection operations."*

**Search Mode (Yellow Solid Border)**
<!-- ![Search Mode](images/search-mode.png) -->
*TODO: Screenshot showing current line with yellow solid border. Caption: "Search mode highlights with a yellow solid border."*

**Mode Switching Demo**
<!-- ![Mode Switching](images/mode-switching.gif) -->
*TODO: Animated GIF (3-5 seconds) showing transitions between modes (Esc→i→v). Caption: "Instant visual feedback when switching between ModalEdit modes."*

**Settings Configuration**
<!-- ![Settings UI](images/settings-ui.png) -->
*TODO: Screenshot of VS Code settings UI showing modaledit-line-indicator configuration options. Caption: "Easy customization through VS Code settings."*

**Output Channel Logs**
<!-- ![Output Channel](images/output-channel.png) -->
*TODO: Screenshot of Output Channel showing extension logs. Caption: "Detailed logging for troubleshooting and debugging."*

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

**How to run:** Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → Type command name

| Command | When to Use | What It Does |
|---------|-------------|--------------|
| **Toggle Enabled/Disabled** | Temporarily disable (e.g., screen sharing, presentation) | Turns extension on/off without changing settings |
| **Query Current Mode (Debug)** | Colors don't match expected mode | Shows detected mode + ModalEdit status in popup |
| **Show Log File** | Troubleshooting bugs or unexpected behavior | Opens detailed diagnostic logs with timestamps |
| **Clear Log File** | Before filing bug report | Resets log for clean reproduction of issue |

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

### Quick Configuration Examples

**Change one color:**
```json
{
  "modaledit-line-indicator.normalMode": { "border": "#00ff00" }
}
```

**Theme-specific colors:**
```json
{
  "modaledit-line-indicator.normalMode": {
    "[dark]": { "border": "#00ffff" },
    "[light]": { "border": "#0000ff" }
  }
}
```

**More examples:** See [docs/CONFIGURATION-EXAMPLES.md](docs/CONFIGURATION-EXAMPLES.md) for detailed configuration examples including subtle indicators, high visibility with backgrounds, and advanced theme-adaptive configurations.

## Settings Reference

### Global Setting

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable/disable the indicator |

### Mode Configuration

Each mode (`normalMode`, `insertMode`, `visualMode`, `searchMode`) supports the following properties:

| Property | Type | Default | Valid Values | Examples |
|----------|------|---------|--------------|----------|
| `background` | CSS color | `rgba(255,255,255,0)` | Any CSS color | `#00ff00`, `rgba(0,255,0,0.1)`, `transparent` |
| `border` | CSS color | Varies by mode* | Any CSS color | `#00aa00`, `rgb(0,170,0)`, `cyan` |
| `borderStyle` | CSS keyword | Varies by mode** | `solid` \| `dashed` \| `dotted` \| `double` \| `groove` \| `ridge` \| `inset` \| `outset` | `dotted`, `solid` |
| `borderWidth` | CSS length | `2px` | Positive length | `1px`, `0.5em`, `3px` |
| `[dark]` | object | _(none)_ | Any property overrides | `{ "border": "#00ffff" }` |
| `[light]` | object | _(none)_ | Any property overrides | `{ "border": "#0000ff" }` |
| `[highContrastDark]` | object | _(none)_ | Any property overrides | `{ "borderWidth": "4px" }` |
| `[highContrastLight]` | object | _(none)_ | Any property overrides | `{ "border": "#000000" }` |

**Default border colors by mode:**
- *Normal: `#00aa00` (green), Insert: `#aa0000` (red), Visual: `#0000aa` (blue), Search: `#aaaa00` (yellow)*

**Default border styles by mode:**
- **Normal: `dotted`, Insert: `solid`, Visual: `dashed`, Search: `solid`*

**Theme Override Objects** can contain any combination of the above properties.

**Cascading Fallback**: Each property (background, border, borderStyle, borderWidth) is resolved independently through the fallback chain:
- **HC Dark**: `[highContrastDark]` → `[dark]` → common → defaults
- **HC Light**: `[highContrastLight]` → `[light]` → common → defaults
- **Regular Dark/Light**: `[dark/light]` → common → defaults

This allows selective overrides (e.g., only override `borderWidth` for high contrast, inherit other properties from the base theme).

---

**Upgrading from older versions?** See [CHANGELOG.md](CHANGELOG.md#migration-notes) for migration guides.

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow and contribution guidelines.

## Requirements

- VS Code 1.106.0+ (High Contrast Light theme support requires this API version)
- **Recommended:** ModalEdit extension
  - **With ModalEdit:** Full 4-mode detection (normal/insert/visual/search)
  - **Without ModalEdit:** Works but always shows insert mode styling

## Troubleshooting

### Common Issues

#### "Nothing visible after install"

**Symptoms:** Extension installed but no border appears on current line.

**Diagnosis & Fix:**
1. **Verify ModalEdit installed:** Extensions → Search "ModalEdit" → Check if installed
2. **Test mode switch:** Press `Esc` (Normal mode) → Should see green dotted border
3. **Check enabled setting:** Settings → "modaledit-line-indicator.enabled" should be `true`
4. **View logs:** Command Palette → "ModalEdit Line Indicator: Show Log File"
   - Look for "ModalEdit extension FOUND" or "NOT FOUND"
   - Check for any ERROR entries
5. **Restart VS Code:** Sometimes required after first install

**Without ModalEdit:** Extension works but always shows insert mode (red solid border). Install ModalEdit for full 4-mode support.

#### "Wrong colors for my theme"

**Symptoms:** Colors don't match your dark/light theme, or invisible in high contrast.

**Diagnosis & Fix:**
1. **Check theme detection:** View logs (Output Channel) for "Color theme changed to: X"
2. **Verify theme kind:** VS Code uses 4 kinds (dark, light, highContrastDark, highContrastLight)
3. **Add theme override:** Settings → Add `[dark]` or `[light]` configuration:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "[dark]": { "border": "#00ffff" },
       "[light]": { "border": "#0000ff" }
     }
   }
   ```
4. **Test switching:** Change theme → Colors should update immediately
5. **High contrast:** Use `[highContrastDark]` and `[highContrastLight]` with thicker borders (`borderWidth: "4px"`)

#### "Output Channel keeps appearing"

**Symptoms:** Output panel opens automatically on VS Code startup.

**Affected Versions:** v0.1.0 - v0.1.2 (fixed in v0.1.3+)

**Workaround for older versions:**
1. Close Output panel
2. Settings → "modaledit-line-indicator.logLevel" → Set to `"error"` (less verbose)
3. Or upgrade to v0.1.3+

**Fixed in v0.1.3:** Output panel no longer auto-opens on startup.

#### "Performance lag/stutter"

**Symptoms:** Cursor movement feels sluggish, high CPU usage.

**Expected:** Smooth performance on modern hardware (<5% CPU, <5ms decoration updates).

**Diagnosis & Fix:**
1. **Check CPU usage:** Activity Monitor/Task Manager → VS Code process
2. **If high CPU (>10%):**
   - Disable other decoration extensions temporarily
   - Check for conflicting extensions (other vim/modal editing tools)
   - Verify no infinite loops in logs (shouldn't happen, but check)
3. **If consistently slow:**
   - Report as performance bug with system specs
   - Include CPU model, RAM, VS Code version
   - Attach logs showing decoration update times

**Temporary disable:** Command Palette → "ModalEdit Line Indicator: Toggle Enabled/Disabled"

#### "Borders not visible in [theme name]"

**Symptoms:** Border present but hard to see against background.

**Diagnosis & Fix:**
1. **Identify theme colors:** Check your theme's background color
2. **Add high-contrast colors:** Settings → Override border colors for better visibility:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "border": "#00ff00",      // Bright green
       "borderWidth": "3px"       // Thicker for visibility
     }
   }
   ```
3. **Test different styles:** Try `borderStyle: "solid"` instead of `"dotted"` for better visibility
4. **Add background:** Use semi-transparent background for extra visibility:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "border": "#00ff00",
       "background": "rgba(0, 255, 0, 0.1)"  // Subtle green tint
     }
   }
   ```

### Diagnostic Commands

**Access via:** Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`) → Type command name

- **"Show Log File":** Open detailed diagnostic logs (includes mode detection, theme changes, errors)
- **"Query Current Mode (Debug)":** Shows currently detected mode + ModalEdit status
- **"Toggle Enabled/Disabled":** Temporarily disable extension to test if it's causing issues
- **"Clear Log File":** Reset logs before reproducing a bug for clean log output

### Getting Help

If issues persist after trying above solutions:

1. **Collect diagnostics:**
   - Run "Clear Log File" command
   - Reproduce the issue
   - Run "Show Log File" command
   - Copy relevant log entries

2. **Check existing issues:** [GitHub Issues](https://github.com/GoodDingo/modaledit-line-indicator/issues)

3. **File new issue with:**
   - VS Code version (`Help → About`)
   - Extension version (Extensions panel)
   - ModalEdit version (if installed)
   - OS and version
   - Steps to reproduce
   - Relevant log entries
   - Screenshots (if visual issue)

## License

MIT

## Contributing

Contributions welcome! Please submit issues and pull requests on GitHub.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and release notes.
