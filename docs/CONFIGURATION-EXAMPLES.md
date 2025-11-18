# Configuration Examples

This document provides detailed configuration examples for the ModalEdit Line Indicator extension.

## Table of Contents

- [Example 1: Subtle Indicators](#example-1-subtle-indicators)
- [Example 2: High Visibility with Backgrounds](#example-2-high-visibility-with-backgrounds)
- [Example 3: Theme-Adaptive (Recommended)](#example-3-theme-adaptive-recommended)
- [Advanced: Per-Property Theme Overrides](#advanced-per-property-theme-overrides)
- [Advanced: High Contrast Themes](#advanced-high-contrast-themes)

---

## Example 1: Subtle Indicators

Minimal borders that don't distract from your code:

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

**Use case:** Prefer minimal visual feedback, thin 1px borders.

---

## Example 2: High Visibility with Backgrounds

Bold indicators with colored backgrounds for maximum visibility:

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

**Use case:** Need strong visual feedback, colored backgrounds with thick borders.

---

## Example 3: Theme-Adaptive (Recommended)

Different colors for dark and light themes (automatically switches when you change VS Code theme):

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dotted",
    "borderWidth": "2px",
    "dark": {
      "border": "#00ffff",
      "background": "rgba(0, 255, 255, 0.05)"
    },
    "light": {
      "border": "#0000aa",
      "background": "rgba(0, 0, 255, 0.05)"
    }
  },
  "modaledit-line-indicator.insertMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "solid",
    "borderWidth": "2px",
    "dark": {
      "border": "#ff6666"
    },
    "light": {
      "border": "#cc0000"
    }
  },
  "modaledit-line-indicator.visualMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dashed",
    "borderWidth": "2px",
    "dark": {
      "border": "#ff00ff"
    },
    "light": {
      "border": "#8800aa"
    }
  },
  "modaledit-line-indicator.searchMode": {
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "solid",
    "borderWidth": "2px",
    "dark": {
      "border": "#ffff00"
    },
    "light": {
      "border": "#aa8800"
    }
  }
}
```

**Use case:** Switch between dark and light themes, want appropriate colors for each.

---

## Advanced: Per-Property Theme Overrides

You can override individual properties for specific themes while keeping others common:

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#00aa00",
    "borderStyle": "dotted",
    "borderWidth": "2px",

    // Only override border color for dark themes
    "dark": {
      "border": "#00ffff"
    },

    // Only override border width for light themes
    "light": {
      "borderWidth": "3px"
    }
  }
}
```

**How it works:**
- Properties not specified in theme overrides inherit from common properties
- Each property resolves independently through the fallback chain
- Dark theme: border=#00ffff (overridden), borderWidth=2px (common), borderStyle=dotted (common)
- Light theme: border=#00aa00 (common), borderWidth=3px (overridden), borderStyle=dotted (common)

---

## Advanced: High Contrast Themes

High contrast themes support both dark and light variants with cascading fallback:

```json
{
  "modaledit-line-indicator.normalMode": {
    "background": "rgba(255, 255, 255, 0)",
    "border": "#00aa00",
    "borderStyle": "dotted",
    "borderWidth": "2px",

    // Fallback for regular dark themes
    "dark": {
      "border": "#00ffff"
    },

    // Fallback for regular light themes
    "light": {
      "border": "#0000ff"
    },

    // High contrast dark (falls back to dark if not specified)
    "darkHC": {
      "border": "#ffffff",
      "borderWidth": "4px"
    },

    // High contrast light (falls back to light if not specified)
    "lightHC": {
      "border": "#000000",
      "borderWidth": "4px"
    }
  }
}
```

**Cascading fallback hierarchy:**
- **High Contrast Dark**: `darkHC` → `dark` → common → defaults
- **High Contrast Light**: `lightHC` → `light` → common → defaults
- **Regular Dark**: `dark` → common → defaults
- **Regular Light**: `light` → common → defaults

**Use case:** Need specific styling for high contrast themes (accessibility requirements).

---

## Quick Reference: CSS Properties

### Border Styles
Valid `borderStyle` values:
- `solid` - Solid line
- `dashed` - Dashed line
- `dotted` - Dotted line
- `double` - Double line
- `groove` - 3D grooved border
- `ridge` - 3D ridged border
- `inset` - 3D inset border
- `outset` - 3D outset border

### Color Formats
Valid color formats for `border` and `background`:
- Hex: `#00aa00`, `#0a0`
- RGB: `rgb(0, 170, 0)`
- RGBA: `rgba(0, 170, 0, 0.1)` (last value is opacity 0-1)
- Named colors: `red`, `green`, `blue`, etc.

### Border Width
Valid `borderWidth` formats:
- Pixels: `1px`, `2px`, `3px`
- Ems: `0.1em`, `0.5em`
- Rems: `0.1rem`

---

## Tips

1. **Start simple**: Use Example 1 or 2, then add theme overrides if needed
2. **Test your colors**: Switch between dark/light themes to verify visibility
3. **Use rgba for backgrounds**: Low opacity (0.05-0.1) provides subtle highlight without obscuring code
4. **High contrast themes**: Thicker borders (3-4px) improve visibility
5. **Cascading advantage**: Override only what you need, inherit the rest

---

## Back to Main Documentation

See [README.md](../README.md) for installation instructions and basic configuration.
