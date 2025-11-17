# Configuration Architecture Guide

## Overview

This document analyzes the current configuration architecture of the ModalEdit Line Indicator extension and provides a comprehensive guide for implementing per-mode configuration settings.

## Current Configuration Architecture

### Configuration Schema Location

All extension configuration is defined in `package.json` under the `contributes.configuration` section.

**Source:** `package.json` lines 58-112

### Current Settings (7 total)

#### 1. Global Settings (1)

```json
"modaledit-line-indicator.enabled": {
    "type": "boolean",
    "default": true,
    "scope": "resource",
    "description": "Enable or disable the line indicator"
}
```

#### 2. Normal Mode Settings (2)

```json
"modaledit-line-indicator.normalModeBackground": {
    "type": "string",
    "default": "#00770020",
    "scope": "resource",
    "description": "Background color for normal mode line highlight (hex format)"
},
"modaledit-line-indicator.normalModeBorder": {
    "type": "string",
    "default": "#005500",
    "scope": "resource",
    "description": "Border color for normal mode line highlight (hex format)"
}
```

#### 3. Insert Mode Settings (2)

```json
"modaledit-line-indicator.insertModeBackground": {
    "type": "string",
    "default": "#77000020",
    "scope": "resource",
    "description": "Background color for insert mode line highlight (hex format)"
},
"modaledit-line-indicator.insertModeBorder": {
    "type": "string",
    "default": "#aa0000",
    "scope": "resource",
    "description": "Border color for insert mode line highlight (hex format)"
}
```

#### 4. Shared Border Settings (2)

```json
"modaledit-line-indicator.borderStyle": {
    "type": "string",
    "enum": ["solid", "dashed", "dotted"],
    "default": "solid",
    "scope": "resource",
    "description": "Border style for line highlight"
},
"modaledit-line-indicator.borderWidth": {
    "type": "string",
    "default": "2px",
    "scope": "resource",
    "description": "Border width for line highlight (CSS format, e.g., '2px', '0.1em')"
}
```

### Configuration Structure Pattern

**Current pattern:**
```
{mode}Mode{property}  // For mode-specific settings
{property}            // For shared settings
```

**Examples:**
- `normalModeBackground` ✅ Mode-specific
- `insertModeBorder` ✅ Mode-specific
- `borderStyle` ✅ Shared across modes
- `borderWidth` ✅ Shared across modes

### Configuration Access in Code

**Source:** `src/extension.ts` lines 117-160 (createDecorations method)

```typescript
private createDecorations(): DecorationTypes {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

    // Read mode-specific colors
    const normalBg = config.get<string>('normalModeBackground', '#00770020');
    const normalBorder = config.get<string>('normalModeBorder', '#005500');
    const insertBg = config.get<string>('insertModeBackground', '#77000020');
    const insertBorder = config.get<string>('insertModeBorder', '#aa0000');

    // Read shared border properties
    const borderStyle = config.get<string>('borderStyle', 'solid');
    const borderWidth = config.get<string>('borderWidth', '2px');

    // Create decoration types
    return {
        normal: vscode.window.createTextEditorDecorationType({
            backgroundColor: normalBg,
            border: `${borderWidth} ${borderStyle} ${normalBorder}`,
            isWholeLine: true,
        }),
        insert: vscode.window.createTextEditorDecorationType({
            backgroundColor: insertBg,
            border: `${borderWidth} ${borderStyle} ${insertBorder}`,
            isWholeLine: true,
        }),
    };
}
```

### Configuration Change Handling

**Source:** `src/extension.ts` lines 348-360

```typescript
vscode.workspace.onDidChangeConfiguration(async (event) => {
    if (event.affectsConfiguration('modaledit-line-indicator')) {
        logger.log('Configuration changed, reloading decorations');
        await this.reloadDecorations();
    }
})

private async reloadDecorations(): Promise<void> {
    // Dispose old decorations
    this.decorations.normal.dispose();
    this.decorations.insert.dispose();

    // Create new decorations with updated config
    this.decorations = this.createDecorations();

    // Reapply to all visible editors
    await this.updateAllVisibleEditors();
}
```

**Key insight:** When configuration changes, decorations must be:
1. Disposed (to free resources)
2. Recreated (to pick up new settings)
3. Reapplied (to update visible editors)

## Configuration Naming Conventions

### VS Code Best Practices

1. **Scope:** Use `"resource"` for settings that can vary per workspace
2. **Naming:** Use camelCase for setting names
3. **Namespacing:** Prefix all settings with extension name
4. **Defaults:** Always provide sensible defaults
5. **Descriptions:** Clear, concise descriptions for users

### Color Format

**Current format:** Hex strings with alpha channel

```
#RRGGBBAA
#00770020  ← Green with ~12% opacity
#77000020  ← Red with ~12% opacity
```

**Alternative formats supported by VS Code:**
- `#RRGGBB` (no alpha)
- `rgb(r, g, b)`
- `rgba(r, g, b, a)`
- Named colors: `red`, `green`, etc.

**Recommendation:** Stick with hex format for consistency.

### Border Style Format

**Current:** Enum with 3 values
```json
"enum": ["solid", "dashed", "dotted"]
```

**Why enum?** Provides validation and auto-completion in VS Code settings UI.

**Alternative:** String type with no validation (not recommended).

### Border Width Format

**Current:** CSS string format
```json
"default": "2px"
```

**Valid CSS values:**
- `2px` (pixels)
- `0.1em` (ems)
- `1pt` (points)
- `medium`, `thick`, `thin` (keywords)

**Recommendation:** Use `px` for consistency and predictability.

## Configuration Evolution: Shared → Per-Mode

### Problem with Shared Border Settings

**Current limitation:**
- All modes share the same `borderStyle` (solid/dashed/dotted)
- All modes share the same `borderWidth` (2px)
- Cannot distinguish modes by border appearance alone

**User request:**
- NORMAL mode: Green dotted border
- INSERT mode: Red solid border
- VISUAL mode: Blue dashed border
- SEARCH mode: Yellow solid border

### Migration Strategy

**Option 1: Breaking Change (Clean Slate)**

Remove shared settings, add per-mode settings:

```json
// REMOVE
"borderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "solid" }
"borderWidth": { "type": "string", "default": "2px" }

// ADD (4 modes × 2 properties = 8 new settings)
"normalModeBorderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "dotted" }
"normalModeBorderWidth": { "type": "string", "default": "2px" }
"insertModeBorderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "solid" }
"insertModeBorderWidth": { "type": "string", "default": "2px" }
"visualModeBorderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "dashed" }
"visualModeBorderWidth": { "type": "string", "default": "2px" }
"searchModeBorderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "solid" }
"searchModeBorderWidth": { "type": "string", "default": "2px" }
```

**Pros:**
- Clean configuration schema
- No legacy settings
- Clear per-mode configuration

**Cons:**
- ⚠️ **Breaking change** - users' existing `borderStyle` and `borderWidth` settings ignored
- Need migration guide

**Option 2: Backward Compatible (Deprecated + New)**

Keep old settings as fallbacks, add per-mode settings:

```json
// DEPRECATED (keep for backward compatibility)
"borderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "solid", "deprecationMessage": "Use mode-specific borderStyle settings instead" }
"borderWidth": { "type": "string", "default": "2px", "deprecationMessage": "Use mode-specific borderWidth settings instead" }

// NEW (fall back to shared if not set)
"normalModeBorderStyle": { "type": "string", "enum": ["solid", "dashed", "dotted"], "default": "dotted" }
// ... etc
```

**Pros:**
- No breaking changes
- Smooth migration path

**Cons:**
- More complex code (fallback logic)
- Confusion if users set both old and new settings

**Recommendation:** Use **Option 1** (breaking change) for cleaner architecture. Extension is in active development, not widely deployed yet.

## Proposed Configuration Architecture (4 Modes)

### New Configuration Schema (17 total settings)

#### Global Settings (1)

```json
"modaledit-line-indicator.enabled": {
    "type": "boolean",
    "default": true,
    "scope": "resource",
    "description": "Enable or disable the line indicator"
}
```

#### Normal Mode Settings (4)

```json
"modaledit-line-indicator.normalModeBackground": {
    "type": "string",
    "default": "rgba(255, 255, 255, 0)",  // Transparent
    "scope": "resource",
    "description": "Background color for normal mode line highlight (CSS color format)"
},
"modaledit-line-indicator.normalModeBorder": {
    "type": "string",
    "default": "#00aa00",  // Green
    "scope": "resource",
    "description": "Border color for normal mode line highlight (CSS color format)"
},
"modaledit-line-indicator.normalModeBorderStyle": {
    "type": "string",
    "enum": ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"],
    "default": "dotted",
    "scope": "resource",
    "description": "Border style for normal mode line highlight"
},
"modaledit-line-indicator.normalModeBorderWidth": {
    "type": "string",
    "default": "2px",
    "scope": "resource",
    "description": "Border width for normal mode line highlight (CSS format)"
}
```

#### Insert Mode Settings (4)

```json
"modaledit-line-indicator.insertModeBackground": {
    "type": "string",
    "default": "rgba(255, 255, 255, 0)",  // Transparent
    "scope": "resource",
    "description": "Background color for insert mode line highlight (CSS color format)"
},
"modaledit-line-indicator.insertModeBorder": {
    "type": "string",
    "default": "#aa0000",  // Red
    "scope": "resource",
    "description": "Border color for insert mode line highlight (CSS color format)"
},
"modaledit-line-indicator.insertModeBorderStyle": {
    "type": "string",
    "enum": ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"],
    "default": "solid",
    "scope": "resource",
    "description": "Border style for insert mode line highlight"
},
"modaledit-line-indicator.insertModeBorderWidth": {
    "type": "string",
    "default": "2px",
    "scope": "resource",
    "description": "Border width for insert mode line highlight (CSS format)"
}
```

#### Visual Mode Settings (4)

```json
"modaledit-line-indicator.visualModeBackground": {
    "type": "string",
    "default": "rgba(255, 255, 255, 0)",  // Transparent
    "scope": "resource",
    "description": "Background color for visual mode line highlight (CSS color format)"
},
"modaledit-line-indicator.visualModeBorder": {
    "type": "string",
    "default": "#0000aa",  // Blue
    "scope": "resource",
    "description": "Border color for visual mode line highlight (CSS color format)"
},
"modaledit-line-indicator.visualModeBorderStyle": {
    "type": "string",
    "enum": ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"],
    "default": "dashed",
    "scope": "resource",
    "description": "Border style for visual mode line highlight"
},
"modaledit-line-indicator.visualModeBorderWidth": {
    "type": "string",
    "default": "2px",
    "scope": "resource",
    "description": "Border width for visual mode line highlight (CSS format)"
}
```

#### Search Mode Settings (4)

```json
"modaledit-line-indicator.searchModeBackground": {
    "type": "string",
    "default": "rgba(255, 255, 255, 0)",  // Transparent
    "scope": "resource",
    "description": "Background color for search mode line highlight (CSS color format)"
},
"modaledit-line-indicator.searchModeBorder": {
    "type": "string",
    "default": "#aaaa00",  // Yellow
    "scope": "resource",
    "description": "Border color for search mode line highlight (CSS color format)"
},
"modaledit-line-indicator.searchModeBorderStyle": {
    "type": "string",
    "enum": ["solid", "dashed", "dotted", "double", "groove", "ridge", "inset", "outset"],
    "default": "solid",
    "scope": "resource",
    "description": "Border style for search mode line highlight"
},
"modaledit-line-indicator.searchModeBorderWidth": {
    "type": "string",
    "default": "2px",
    "scope": "resource",
    "description": "Border width for search mode line highlight (CSS format)"
}
```

### Configuration Access Pattern (Type-Safe)

```typescript
type Mode = 'normal' | 'insert' | 'visual' | 'search';

interface ModeConfig {
    background: string;
    border: string;
    borderStyle: string;
    borderWidth: string;
}

function getModeConfig(mode: Mode): ModeConfig {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

    return {
        background: config.get<string>(`${mode}ModeBackground`, 'rgba(255, 255, 255, 0)'),
        border: config.get<string>(`${mode}ModeBorder`, '#ffffff'),
        borderStyle: config.get<string>(`${mode}ModeBorderStyle`, 'solid'),
        borderWidth: config.get<string>(`${mode}ModeBorderWidth`, '2px'),
    };
}

// Usage
const normalConfig = getModeConfig('normal');
const insertConfig = getModeConfig('insert');
const visualConfig = getModeConfig('visual');
const searchConfig = getModeConfig('search');
```

### Decoration Creation with Per-Mode Config

```typescript
interface DecorationTypes {
    normal: vscode.TextEditorDecorationType;
    insert: vscode.TextEditorDecorationType;
    visual: vscode.TextEditorDecorationType;
    search: vscode.TextEditorDecorationType;
}

private createDecorations(): DecorationTypes {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

    // Helper to create decoration for a mode
    const createModeDecoration = (mode: Mode): vscode.TextEditorDecorationType => {
        const bg = config.get<string>(`${mode}ModeBackground`, 'rgba(255, 255, 255, 0)');
        const borderColor = config.get<string>(`${mode}ModeBorder`, '#ffffff');
        const borderStyle = config.get<string>(`${mode}ModeBorderStyle`, 'solid');
        const borderWidth = config.get<string>(`${mode}ModeBorderWidth`, '2px');

        return vscode.window.createTextEditorDecorationType({
            backgroundColor: bg,
            border: `${borderWidth} ${borderStyle} ${borderColor}`,
            isWholeLine: true,
        });
    };

    return {
        normal: createModeDecoration('normal'),
        insert: createModeDecoration('insert'),
        visual: createModeDecoration('visual'),
        search: createModeDecoration('search'),
    };
}
```

## Configuration Validation

### Type Safety

VS Code provides built-in validation based on `type` and `enum` properties:

```json
// String validation
"normalModeBackground": {
    "type": "string"  // Must be string
}

// Enum validation
"normalModeBorderStyle": {
    "enum": ["solid", "dashed", "dotted"]  // Must be one of these
}
```

### Runtime Validation

For CSS values that don't have enum validation:

```typescript
function validateCssColor(color: string): string {
    // Basic validation - could be more sophisticated
    if (color.startsWith('#') ||
        color.startsWith('rgb') ||
        color.startsWith('rgba') ||
        /^[a-z]+$/.test(color)) {
        return color;
    }

    console.warn(`Invalid color value: ${color}, using default`);
    return 'rgba(255, 255, 255, 0)';
}

function validateCssDimension(dimension: string): string {
    // Validate px, em, pt, etc.
    if (/^\d+\.?\d*(px|em|pt|rem|%)$/.test(dimension)) {
        return dimension;
    }

    console.warn(`Invalid dimension value: ${dimension}, using default`);
    return '2px';
}
```

## Configuration UI/UX

### Settings UI Organization

VS Code automatically organizes settings by extension. Users see:

```
Extensions
  └─ ModalEdit Line Indicator
      ├─ Enabled
      ├─ Normal Mode Background
      ├─ Normal Mode Border
      ├─ Normal Mode Border Style
      ├─ Normal Mode Border Width
      ├─ Insert Mode Background
      ├─ Insert Mode Border
      ... (17 total settings)
```

### Grouping Strategy

Use clear naming to group related settings:

```
{mode}Mode{property}

normalModeBackground      ← Groups by prefix
normalModeBorder          ←
normalModeBorderStyle     ←
normalModeBorderWidth     ←

insertModeBackground      ← Next group
insertModeBorder          ←
...
```

Users can search/filter by mode name (e.g., "normal mode") to see all related settings.

### Color Picker Integration

VS Code automatically shows color picker for string settings with color values:

```json
"normalModeBorder": {
    "type": "string",
    "default": "#00aa00"  // ← Color picker icon appears
}
```

Users can:
- Click color square to open picker
- Type hex/rgb values manually
- Copy/paste colors

### Enum Dropdown Integration

VS Code automatically shows dropdown for enum settings:

```json
"normalModeBorderStyle": {
    "enum": ["solid", "dashed", "dotted"]  // ← Dropdown appears
}
```

## Configuration Migration Guide

### For Users (README.md section)

```markdown
## Migration from v1.x to v2.0

### Breaking Changes

The shared `borderStyle` and `borderWidth` settings have been replaced with per-mode settings.

**Before (v1.x):**
```json
{
  "modaledit-line-indicator.borderStyle": "solid",
  "modaledit-line-indicator.borderWidth": "2px"
}
```

**After (v2.0):**
```json
{
  "modaledit-line-indicator.normalModeBorderStyle": "dotted",
  "modaledit-line-indicator.normalModeBorderWidth": "2px",
  "modaledit-line-indicator.insertModeBorderStyle": "solid",
  "modaledit-line-indicator.insertModeBorderWidth": "2px",
  "modaledit-line-indicator.visualModeBorderStyle": "dashed",
  "modaledit-line-indicator.visualModeBorderWidth": "2px",
  "modaledit-line-indicator.searchModeBorderStyle": "solid",
  "modaledit-line-indicator.searchModeBorderWidth": "2px"
}
```

If you had customized `borderStyle` or `borderWidth`, you'll need to set them per-mode.
```

### Automated Migration (Optional)

Could implement one-time migration on extension activation:

```typescript
async function migrateConfiguration(): Promise<void> {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

    // Check if old settings exist
    const oldBorderStyle = config.inspect('borderStyle');
    const oldBorderWidth = config.inspect('borderWidth');

    if (oldBorderStyle?.globalValue || oldBorderWidth?.globalValue) {
        // Migrate to new settings
        const style = oldBorderStyle?.globalValue as string ?? 'solid';
        const width = oldBorderWidth?.globalValue as string ?? '2px';

        const modes: Mode[] = ['normal', 'insert', 'visual', 'search'];
        for (const mode of modes) {
            await config.update(`${mode}ModeBorderStyle`, style, vscode.ConfigurationTarget.Global);
            await config.update(`${mode}ModeBorderWidth`, width, vscode.ConfigurationTarget.Global);
        }

        // Remove old settings
        await config.update('borderStyle', undefined, vscode.ConfigurationTarget.Global);
        await config.update('borderWidth', undefined, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            'ModalEdit Line Indicator: Configuration migrated to v2.0 per-mode settings'
        );
    }
}
```

**Note:** Migration is optional. Can just document breaking change and let users reconfigure.

## Best Practices Summary

### Configuration Schema
1. ✅ Use clear, consistent naming: `{mode}Mode{property}`
2. ✅ Always provide sensible defaults
3. ✅ Use `"scope": "resource"` for workspace-specific settings
4. ✅ Use enums for fixed sets of valid values
5. ✅ Write clear, helpful descriptions

### Configuration Access
1. ✅ Use type-safe helper functions (e.g., `getModeConfig(mode)`)
2. ✅ Always provide fallback defaults in `config.get()`
3. ✅ Cache configuration objects when possible (decorations)
4. ✅ Validate runtime values (colors, dimensions)
5. ✅ Handle configuration changes (dispose + recreate decorations)

### Configuration Changes
1. ✅ Listen to `onDidChangeConfiguration` events
2. ✅ Check `affectsConfiguration()` to filter irrelevant changes
3. ✅ Dispose old resources before creating new ones
4. ✅ Reapply decorations to all visible editors after reload
5. ✅ Log configuration changes for debugging

### User Experience
1. ✅ Group related settings with consistent naming
2. ✅ Use color picker for color settings (automatic with string type)
3. ✅ Use dropdown for enum settings (automatic)
4. ✅ Document breaking changes clearly
5. ✅ Consider migration helpers for major changes

## Summary

**Current Architecture:** 7 settings (1 global + 2 modes × 2 properties + 2 shared)

**Proposed Architecture:** 17 settings (1 global + 4 modes × 4 properties)

**Key Changes:**
- Shared border settings → per-mode settings (breaking change)
- 2 modes → 4 modes (NORMAL, INSERT, VISUAL, SEARCH)
- Transparent backgrounds by default (user preference)
- Distinct border styles per mode (dotted, solid, dashed, solid)

**Implementation Pattern:**
```typescript
config.get<string>(`${mode}Mode${property}`, defaultValue)
```

This architecture provides maximum flexibility while maintaining clean, type-safe configuration management.
