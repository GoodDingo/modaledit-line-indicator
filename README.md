# ModalEdit Line Indicator

Dynamic line highlight indicator for ModalEdit extension in VS Code. Provides instant visual feedback for all 4 ModalEdit modes with theme-aware styling.

## Prerequisites

**Required:** [ModalEdit](https://marketplace.visualstudio.com/items?itemName=johtela.vscode-modaledit) extension

This extension provides visual feedback for ModalEdit modes. Without ModalEdit, the extension will show a warning and display insert mode styling only.

### Installing ModalEdit

1. **Install from Marketplace:**
   - Open VS Code
   - Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
   - Search for "ModalEdit"
   - Click Install on "ModalEdit" by johtela
   - Or [click here to install](https://marketplace.visualstudio.com/items?itemName=johtela.vscode-modaledit)

2. **Verify ModalEdit is working:**
   - Open any file
   - Press `Esc` (enter Normal mode)
   - Press `i` (enter Insert mode)
   - **Expected:** Cursor style changes between modes
   - **If cursor doesn't change:** Check ModalEdit configuration (see [ModalEdit docs](https://github.com/johtela/vscode-modaledit#configuration))

3. **Configure ModalEdit cursor styles (recommended):**

   Add to your `settings.json`:
   ```json
   {
     "modaledit.normal.cursorStyle": "block",
     "modaledit.insert.cursorStyle": "line",
     "modaledit.visual.cursorStyle": "underline"
   }
   ```

✅ **ModalEdit working?** Continue to Quick Start below
❌ **ModalEdit not working?** See [ModalEdit troubleshooting](https://github.com/johtela/vscode-modaledit#troubleshooting)

## Quick Start

**Note:** VS Code will automatically prompt to install ModalEdit when you install this extension.

### Stage 1: Verify ModalEdit Works

1. **Install ModalEdit** (if not already installed - see [Prerequisites](#prerequisites))
2. **Test ModalEdit modes:**
   - Press `Esc` → Cursor should become a block (Normal mode)
   - Press `i` → Cursor should become a line (Insert mode)
   - Press `v` → Cursor should become an underline (Visual mode)

✅ **Cursor changes?** Proceed to Stage 2
❌ **Cursor doesn't change?** Fix ModalEdit first - see [Prerequisites](#prerequisites)

### Stage 2: Verify Line Indicator Works

1. **Install this extension:** VS Code Marketplace → "ModalEdit Line Indicator"
2. **Test mode indicators:**
   - Press `Esc` → See **green dotted border** on current line (Normal mode)
   - Press `i` → See **red solid border** (Insert mode)
   - Press `v` → See **blue dashed border** (Visual mode)
   - Press `/` → See **yellow solid border** (Search mode)

✅ **Borders appear and change colors?** Success! Extension is working
❌ **No borders or wrong colors?** See [Troubleshooting](#troubleshooting)

### Customize

Settings → Search "modaledit-line-indicator" → Customize colors, borders, and theme-specific styling

**Next steps:**
- 🎨 [Configuration](#configuration) - Customize colors and styles
- 🐛 [Troubleshooting](#troubleshooting) - Fix common issues
- 📖 [Features](#features) - Learn about theme-aware styling

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

Or install from VSIX:
```bash
# Download the .vsix file from releases, then:
code --install-extension modaledit-line-indicator-*.vsix
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
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "border": "2px dotted #00aa00"
  },

  "modaledit-line-indicator.insertMode": {
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "border": "2px solid #aa0000"
  },

  "modaledit-line-indicator.visualMode": {
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "border": "2px dashed #0000aa"
  },

  "modaledit-line-indicator.searchMode": {
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "border": "2px solid #aaaa00"
  }
}
```

### Theme-Specific Configuration

You can specify different colors for dark, light, and high contrast themes (both dark and light variants):

```json
{
  "modaledit-line-indicator.normalMode": {
    // Common properties (apply to all themes unless overridden)
    "backgroundColor": "rgba(0, 0, 0, 0)",
    "border": "2px dotted #00aa00",

    // Dark theme override (also used as fallback for high contrast dark)
    "dark": {
      "border": "2px dotted #00ffff"  // Cyan border in dark themes
    },

    // Light theme override (also used as fallback for high contrast light)
    "light": {
      "border": "2px dotted #0000ff"  // Blue border in light themes
    },

    // High contrast dark theme override
    "darkHC": {
      "border": "4px dotted #ffffff"  // Thicker white border for better visibility
    },

    // High contrast light theme override
    "lightHC": {
      "border": "4px dotted #000000"  // Thicker black border for better visibility
    }
  }
}
```

**How It Works:**
1. **Common properties** (background, border, borderStyle, borderWidth) apply to all themes
2. **Theme-specific overrides** (`dark`, `light`, `darkHC`, `lightHC`) selectively override properties
3. **Cascading fallback hierarchy** for high contrast themes:
   - High Contrast Dark: `darkHC` → `dark` → common → defaults
   - High Contrast Light: `lightHC` → `light` → common → defaults
4. Extension automatically detects your current theme and applies the appropriate styling
5. When you switch themes, the extension instantly updates the decorations

### Quick Configuration Examples

**Change border color and style:**
```json
{
  "modaledit-line-indicator.normalMode": {
    "border": "3px solid #00ff00"
  }
}
```

**Theme-specific colors:**
```json
{
  "modaledit-line-indicator.normalMode": {
    "dark": { "border": "2px dotted #00ffff" },
    "light": { "border": "2px dotted #0000ff" }
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
| `backgroundColor` | CSS color | `rgba(0,0,0,0)` | Any CSS color | `#00ff00`, `rgba(0,255,0,0.1)`, `transparent` |
| `border` | CSS shorthand | Varies by mode* | CSS border shorthand | `2px dotted #00aa00`, `3px solid cyan` |
| `borderColor` | CSS color | Varies by mode* | Any CSS color | `#00aa00`, `rgb(0,170,0)`, `cyan` |
| `borderStyle` | CSS keyword | Varies by mode** | `solid` \| `dashed` \| `dotted` \| `double` \| `groove` \| `ridge` \| `inset` \| `outset` | `dotted`, `solid` |
| `borderWidth` | CSS length | `2px` | Positive length | `1px`, `0.5em`, `3px` |
| `borderRadius` | CSS length | `0px` | Positive length | `4px`, `0.5em`, `8px` |
| `dark` | object | _(none)_ | Any property overrides | `{ "border": "2px dotted #00ffff" }` |
| `light` | object | _(none)_ | Any property overrides | `{ "border": "2px dotted #0000ff" }` |
| `darkHC` | object | _(none)_ | Any property overrides | `{ "border": "4px dotted #ffffff" }` |
| `lightHC` | object | _(none)_ | Any property overrides | `{ "border": "4px dotted #000000" }` |

**Default borders by mode:**
- *Normal: `2px dotted #00aa00` (green), Insert: `2px solid #aa0000` (red), Visual: `2px dashed #0000aa` (blue), Search: `2px solid #aaaa00` (yellow)*

**Border Property Options:**
- **CSS Shorthand** (recommended): `"border": "2px dotted #00aa00"` - concise, single property
- **Individual Properties**: `"borderColor": "#00aa00"`, `"borderStyle": "dotted"`, `"borderWidth": "2px"` - fine-grained control
- Both formats supported; shorthand takes precedence if both specified

**Theme Override Objects** can contain any combination of the above properties.

**Cascading Fallback**: Each property is resolved independently through the fallback chain:
- **HC Dark**: `darkHC` → `dark` → common → defaults
- **HC Light**: `lightHC` → `light` → common → defaults
- **Regular Dark/Light**: `dark/light` → common → defaults

This allows selective overrides (e.g., only override border for high contrast, inherit other properties from the base theme).

---

## Complete Property Reference

All VS Code `DecorationRenderOptions` properties are supported. Properties are passed directly to the VS Code API.

### Visual Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **backgroundColor** | CSS color | Background color of the current line | `"rgba(0, 255, 0, 0.1)"`, `"#00ff00"` | ✅ Tested |
| **color** | CSS color | Text color | `"#ffffff"`, `"rgb(255, 255, 255)"` | ⚠️ Supported |
| **opacity** | Number (0-1) | Overall opacity | `"0.8"`, `"1.0"` | ⚠️ Supported |

### Border Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **border** | CSS shorthand | Border style (recommended) | `"2px dotted #00aa00"` | ✅ Tested |
| **borderColor** | CSS color | Border color (if not using shorthand) | `"#00aa00"`, `"cyan"` | ⚠️ Supported |
| **borderRadius** | CSS length | Rounded corners | `"4px"`, `"0.5em"` | ✅ Tested |
| **borderSpacing** | CSS length | Border spacing | `"2px"` | ⚠️ Supported |
| **borderStyle** | Keyword | Border line style | `"solid"`, `"dotted"`, `"dashed"`, `"double"` | ⚠️ Supported |
| **borderWidth** | CSS length | Border thickness (if not using shorthand) | `"2px"`, `"3px"` | ⚠️ Supported |

**Border Style Options**: `solid` | `dotted` | `dashed` | `double` | `groove` | `ridge` | `inset` | `outset`

### Outline Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **outline** | CSS shorthand | Outline style (like border but doesn't affect layout) | `"1px solid #00ff00"` | ⚠️ Supported |
| **outlineColor** | CSS color | Outline color | `"#00ff00"` | ⚠️ Supported |
| **outlineStyle** | Keyword | Outline line style | `"solid"`, `"dashed"` | ⚠️ Supported |
| **outlineWidth** | CSS length | Outline thickness | `"1px"`, `"2px"` | ⚠️ Supported |

**Outline Style Options**: Same as border styles

### Text Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **fontStyle** | Keyword | Font style | `"italic"`, `"normal"`, `"oblique"` | ⚠️ Supported |
| **fontWeight** | Keyword/Number | Font weight | `"bold"`, `"normal"`, `"600"` | ⚠️ Supported |
| **letterSpacing** | CSS length | Space between letters | `"1px"`, `"0.1em"` | ⚠️ Supported |
| **textDecoration** | Keyword | Text decoration | `"underline"`, `"line-through"` | ⚠️ Supported |
| **cursor** | Keyword | Mouse cursor style | `"pointer"`, `"default"`, `"text"` | ⚠️ Supported |

### Overview Ruler (Scrollbar) Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **overviewRulerColor** | CSS color | Color marker in scrollbar | `"#00ff00"`, `"rgba(0,255,0,0.5)"` | ⚠️ Supported |
| **overviewRulerLane** | Keyword | Position in scrollbar | `"Left"`, `"Center"`, `"Right"`, `"Full"` | ⚠️ Supported |

### Gutter (Line Number Area) Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **gutterIconPath** | URI/Path | Icon to display in gutter | `"/path/to/icon.svg"` | ⚠️ Supported |
| **gutterIconSize** | Keyword | Icon size | `"auto"`, `"contain"`, `"cover"`, `"50%"` | ⚠️ Supported |

### Advanced Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **rangeBehavior** | Keyword | How decoration grows when text is inserted at edges | `"OpenOpen"`, `"ClosedClosed"` | ⚠️ Supported |

**Range Behavior Options**: `OpenOpen` | `ClosedClosed` | `OpenClosed` | `ClosedOpen`

### Theme Override Properties

| Property | Type | Description | Example | Status |
|----------|------|-------------|---------|--------|
| **dark** | Object | Dark theme overrides | `{ "border": "2px dotted #00ffff" }` | ✅ Tested |
| **light** | Object | Light theme overrides | `{ "border": "2px dotted #0000ff" }` | ✅ Tested |
| **darkHC** | Object | High contrast dark overrides (fallback: dark → common) | `{ "border": "4px dotted #ffffff" }` | ✅ Tested |
| **lightHC** | Object | High contrast light overrides (fallback: light → common) | `{ "border": "4px dotted #000000" }` | ✅ Tested |

**Legend**:
- ✅ **Tested**: Property has automated test coverage and is verified working
- ⚠️ **Supported**: Property is passed through to VS Code API but not yet tested in this extension

**Note**: All properties are passed directly to VS Code's `createTextEditorDecorationType()` API. Untested properties should work but haven't been verified in test suite.

---

## Known Limitations

### CSS Shorthand vs Individual Properties

**Border Configuration**:
- ✅ **Recommended**: Use CSS shorthand `"border": "2px dotted #00aa00"` for concise configuration
- ⚠️ **Alternative**: Use individual properties `borderColor`, `borderStyle`, `borderWidth` separately
- **Precedence**: If both shorthand and individual properties are specified, behavior depends on VS Code's internal merging
- **Best Practice**: Choose one approach per mode configuration to avoid conflicts

**Outline Configuration**: Same pattern as borders - use shorthand or individual properties, not both.

### VS Code API Restrictions

**Property Support**:
- All properties are passed directly to `createTextEditorDecorationType()` API
- VS Code controls which properties are rendered and how
- Some properties may not work in all VS Code versions
- Minimum supported: VS Code 1.85.0+

**High Contrast Light Theme**:
- Requires VS Code 1.106.0+ for `ColorThemeKind.HighContrastLight` (value 4)
- Earlier versions: `lightHC` will fall back to `light` theme settings
- No breaking issues, just uses light theme colors instead

### Performance Considerations

**Decoration Complexity**:
- Simple decorations (border only): Minimal performance impact (<1% CPU)
- Complex decorations (backgrounds + borders + text styling): Slightly higher overhead
- Current line only: Minimal overhead regardless of file size
- **Tested**: Extension runs smoothly on files up to 10,000+ lines

**Recommended for Best Performance**:
- Avoid combining too many visual properties simultaneously
- Use `backgroundColor` sparingly (semi-transparent only if needed)
- Prefer borders over backgrounds for lower visual noise

**Heavy Properties** (higher rendering cost):
- `gutterIconPath` - Requires image loading
- `overviewRulerColor` - Additional scrollbar rendering
- Multiple font properties together - May cause layout recalculations

### Theme Compatibility

**Theme Detection**:
- Extension detects 4 theme kinds: `dark`, `light`, `darkHC`, `lightHC`
- Custom themes are mapped to one of these 4 kinds by VS Code
- If colors are not visible in your theme, add theme-specific overrides

**Color Visibility**:
- Default border colors may not be visible in all themes
- Solution: Configure theme-specific colors using `dark`, `light`, `darkHC`, `lightHC` overrides
- High contrast themes: Use thicker borders (3-4px) and solid style for better visibility

### Property Combinations

**Properties That Work Well Together**:
- `border` + `backgroundColor` - Classic highlight style
- `border` + `borderRadius` - Rounded border effect
- `outline` + `border` - Double border effect (outline doesn't affect layout)
- `overviewRulerColor` + `border` - Visual feedback in scrollbar and editor

**Properties That May Conflict**:
- `border` (shorthand) + `borderColor`/`borderStyle`/`borderWidth` - Use one approach
- `outline` (shorthand) + `outlineColor`/`outlineStyle`/`outlineWidth` - Use one approach
- Heavy text styling (`fontStyle` + `fontWeight` + `textDecoration` + `letterSpacing`) - May cause rendering issues

### Platform Differences

**Desktop vs Browser**:
- Extension designed for VS Code desktop
- VS Code for Web (vscode.dev): Should work but not extensively tested
- GitHub Codespaces: Should work but not tested

**Operating System**:
- Tested on: macOS, Linux
- Should work on: Windows
- Font rendering may vary by OS (especially `fontWeight`, `letterSpacing`)

### ModalEdit Dependency

**Critical Requirement**:
- Extension requires ModalEdit for mode detection
- Without ModalEdit: Extension shows warning and displays insert mode styling only
- Mode detection relies on cursor style changes from ModalEdit
- See [Prerequisites](#prerequisites) for installation instructions

**Cursor Style Detection**:
- Detects mode based on cursor style (block = normal, line = insert, underline = visual/search)
- Requires ModalEdit cursor styles to be configured
- Conflicting extensions (VSCodeVim, Vim, NeoVim) will break mode detection

### Accessibility

**Screen Readers**:
- ✅ Decorations are visual only, don't affect text content
- ✅ Screen readers can read code normally

**Color Blindness**:
- Default colors may not be distinguishable for some users
- Solution: Configure high-contrast colors or use different border styles (dotted vs solid vs dashed)
- High contrast themes (`darkHC`, `lightHC`) provide accessibility-focused defaults

**Keyboard Navigation**:
- Extension does not interfere with keyboard navigation
- All functionality works without mouse

### Future Improvements

Items not currently supported but may be added in future versions:

- **Animation/Transitions**: VS Code API doesn't support CSS transitions
- **Multi-line Highlighting**: By design, only current line is highlighted
- **Custom Shapes**: Limited to CSS border/outline properties
- **Before/After Content**: `before` and `after` decoration properties exist but are complex to configure

---

## Development

See [DEVELOPMENT.md](DEVELOPMENT.md) for development workflow and contribution guidelines.

## Requirements

- VS Code 1.106.0+ (High Contrast Light theme support requires this API version)
- **Required:** [ModalEdit extension](https://marketplace.visualstudio.com/items?itemName=johtela.vscode-modaledit)
  - **With ModalEdit:** Full 4-mode detection (normal/insert/visual/search)
  - **Without ModalEdit:** Extension shows warning and displays insert mode styling only
  - See [Prerequisites](#prerequisites) section for installation instructions

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
2. **Verify theme kind:** VS Code uses 4 kinds (dark, light, darkHC, lightHC)
3. **Add theme override:** Settings → Add `dark` or `light` configuration:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "dark": { "border": "2px dotted #00ffff" },
       "light": { "border": "2px dotted #0000ff" }
     }
   }
   ```
4. **Test switching:** Change theme → Colors should update immediately
5. **High contrast:** Use `darkHC` and `lightHC` with thicker borders (e.g., `"border": "4px dotted #ffffff"`)

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
2. **Add high-contrast colors:** Settings → Override border for better visibility:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "border": "3px solid #00ff00"  // Bright green, thicker, solid style
     }
   }
   ```
3. **Test different styles:** Try `"border": "2px solid #00aa00"` instead of `"2px dotted #00aa00"` for better visibility
4. **Add background:** Use semi-transparent background for extra visibility:
   ```json
   {
     "modaledit-line-indicator.normalMode": {
       "border": "2px solid #00ff00",
       "backgroundColor": "rgba(0, 255, 0, 0.1)"  // Subtle green tint
     }
   }
   ```

#### "Always shows red border / stuck in insert mode"

**Symptoms:** Border never changes from red, regardless of mode switching attempts.

**Root Cause:** ModalEdit extension not installed, not active, or not properly configured.

**Diagnosis (4-step):**

1. **Check ModalEdit installation:**
   - Extensions panel → Search "ModalEdit"
   - Verify "ModalEdit" by johtela is installed
   - If not installed → See [Prerequisites](#prerequisites)

2. **Check ModalEdit configuration:**
   - Open Settings → Search "modaledit"
   - Verify cursor style settings exist:
     ```json
     {
       "modaledit.normal.cursorStyle": "block",
       "modaledit.insert.cursorStyle": "line"
     }
     ```
   - If missing → Add cursor style configuration

3. **Test ModalEdit independently:**
   - Open any file
   - Press `Esc` (should enter Normal mode)
   - **Expected:** Cursor changes to block
   - **If cursor doesn't change:** ModalEdit not working - see [ModalEdit docs](https://github.com/johtela/vscode-modaledit#troubleshooting)

4. **Run diagnostic command:**
   - Command Palette → "ModalEdit Line Indicator: Query Current Mode (Debug)"
   - Check if ModalEdit is detected
   - Review output for configuration issues

**Resolution:**
- Install and configure ModalEdit properly (see [Prerequisites](#prerequisites))
- Ensure ModalEdit cursor styles are configured
- Restart VS Code after configuration changes

#### "Conflicts with other vim/modal extensions"

**Symptoms:** Extension stops working after installing VSCodeVim, Vim, NeoVim, or similar extensions.

**Root Cause:** Multiple extensions competing for cursor style control.

**Incompatible Extensions:**
- ❌ **VSCodeVim** - Conflicts with ModalEdit cursor styles
- ❌ **Vim** - Conflicts with ModalEdit cursor styles
- ❌ **NeoVim** - Conflicts with ModalEdit cursor styles
- ❌ **Dance** - May conflict depending on configuration
- ✅ **ModalEdit** - Required and fully compatible

**Resolution:**

1. **Choose ONE modal editing extension:**
   - If you want to use this extension → Use ModalEdit exclusively
   - If you prefer VSCodeVim/Vim/NeoVim → Uninstall this extension

2. **Remove conflicting extensions:**
   - Extensions panel → Search for conflicting extensions
   - Uninstall all vim/modal extensions except ModalEdit
   - Restart VS Code

3. **Verify ModalEdit works alone:**
   - Test mode switching (`Esc`, `i`, `v`)
   - Confirm cursor styles change
   - Confirm line borders appear and change colors

**Why this happens:** Multiple extensions trying to control cursor styles interfere with each other. This extension relies on ModalEdit's cursor style changes for mode detection. Other vim extensions override these styles, breaking detection.

#### "How do I configure ModalEdit cursor styles?"

**Required for:** Proper mode detection and visual feedback.

**Quick Configuration:**

Add to your `settings.json`:

```json
{
  "modaledit.normal.cursorStyle": "block",
  "modaledit.insert.cursorStyle": "line",
  "modaledit.visual.cursorStyle": "underline"
}
```

**Full ModalEdit Documentation:**
- [ModalEdit Configuration Guide](https://github.com/johtela/vscode-modaledit#configuration)
- [ModalEdit Cursor Style Options](https://github.com/johtela/vscode-modaledit#cursor-customization)

**Diagnostic - Verify Configuration:**

1. **Run diagnostic command:**
   - Command Palette → "ModalEdit Line Indicator: Query Current Mode (Debug)"
   - Shows current mode and ModalEdit status

2. **Test cursor changes:**
   - Press `Esc` → Cursor should become a block
   - Press `i` → Cursor should become a line
   - Press `v` → Cursor should become an underline

3. **If cursor doesn't change:**
   - Check Settings → "modaledit" → Verify cursor style settings
   - Check for conflicting extensions (see "Conflicts with other vim/modal extensions" above)
   - Restart VS Code
   - See [ModalEdit troubleshooting](https://github.com/johtela/vscode-modaledit#troubleshooting)

**Tip:** This extension uses cursor style changes to detect modes. If ModalEdit cursor styles aren't configured, mode detection won't work properly.

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
