# Implementation Plan: 4-Mode Line Indicator with Per-Mode Configuration

## Executive Summary

**Goal:** Add VISUAL and SEARCH mode support to ModalEdit Line Indicator extension with per-mode border styling (background, border color, border style, border width for each mode).

**Scope:**
- Extend from 2 modes (NORMAL, INSERT) to 4 modes (NORMAL, INSERT, VISUAL, SEARCH)
- Migrate from shared border settings to per-mode border settings (breaking change)
- Implement robust mode detection using ModalEdit context keys
- Update all tests and documentation

**Impact:**
- Configuration: 7 settings → 17 settings (1 enabled + 4 modes × 4 properties)
- Code changes: 1 file (src/extension.ts), 1 file (package.json)
- Test changes: 7 test files (update existing tests)
- Documentation changes: 4 files (README.md, DEVELOPMENT.md, CLAUDE.md, + new docs)

**Timeline:** Estimated 4-6 hours of development + testing

---

## Root Cause Analysis: INSERT Color Bug

### The Problem

When selecting text in NORMAL mode (entering VISUAL mode), the line indicator switches from green (NORMAL) to red (INSERT) instead of staying green or showing a distinct VISUAL color.

### The Diagnosis

**There is NO bug in the extension!** The extension is working exactly as designed for a 2-mode system.

**Current Mode Detection Logic** (src/extension.ts:166-179):

```typescript
private async isInNormalMode(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return false;

    // ModalEdit sets different cursor styles for different modes:
    // - Normal mode: Block cursor (vscode.TextEditorCursorStyle.Block = 2)
    // - Insert mode: Line cursor (vscode.TextEditorCursorStyle.Line = 1)
    const cursorStyle = editor.options.cursorStyle as number | undefined;

    // Block cursor (2) = Normal mode, anything else = Insert mode
    return cursorStyle === vscode.TextEditorCursorStyle.Block;
}
```

**What Actually Happens:**

1. User is in NORMAL mode → cursor style is **Block (2)** → extension shows GREEN ✅
2. User presses `v` to select text → ModalEdit enters **VISUAL mode**
3. ModalEdit changes cursor style from Block → **LineThin (4)** (per ModalEdit config default)
4. Extension checks cursor style: **LineThin ≠ Block** → assumes INSERT mode → shows RED ❌
5. User sees red line indicator and thinks it's a bug

**Why This Happens:**

ModalEdit has **4 cursor styles** (from ModalEdit package.json:210-213):
- NORMAL: Block (2)
- INSERT: Line (1)
- **VISUAL: LineThin (4)** ← The culprit!
- SEARCH: Underline (5)

Extension only recognizes 2 states:
- Block cursor = NORMAL (green)
- **Anything else** = INSERT (red) ← VISUAL falls into this bucket!

**The Real Issue:** Extension doesn't support VISUAL mode, so it incorrectly classifies it as INSERT mode.

---

## Solution Architecture

### High-Level Strategy

1. **Mode Detection:** Use ModalEdit context keys + selection state (robust, future-proof)
2. **Configuration:** Per-mode settings for all 4 modes (flexible, clean)
3. **Decorations:** 4 decoration types, apply exactly one at a time (exclusive)
4. **Events:** Leverage existing selection change events + cursor polling (responsive)

### Mode Detection Algorithm

**Priority order** (matches ModalEdit's own logic):

```
1. Check modaledit.searching === true → SEARCH mode
2. Check modaledit.normal === false → INSERT mode
3. Check editor.hasSelection → VISUAL mode
4. Else → NORMAL mode
```

**Implementation:**

```typescript
type Mode = 'normal' | 'insert' | 'visual' | 'search';

private async detectCurrentMode(): Promise<Mode> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return 'insert';

    // Priority 1: Check SEARCH mode (has dedicated context key)
    const isSearching = await vscode.commands.executeCommand('getContext', 'modaledit.searching');
    if (isSearching) return 'search';

    // Priority 2: Check NORMAL mode (has dedicated context key)
    const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
    if (!isNormal) return 'insert';

    // Priority 3: In NORMAL mode - check if selecting (VISUAL mode)
    const hasSelection = editor.selections.some(
        sel => !sel.anchor.isEqual(sel.active)
    );

    return hasSelection ? 'visual' : 'normal';
}
```

**Why This Works:**

- ✅ Uses official ModalEdit context keys (stable API)
- ✅ Matches ModalEdit's own mode detection logic
- ✅ Works regardless of cursor style customization
- ✅ Gracefully degrades if ModalEdit not installed (all → INSERT)
- ✅ No dependency on fragile cursor style mapping

---

## Implementation Plan

### Phase 1: Configuration Schema (package.json)

**File:** `package.json`

**Changes:**

1. **Remove deprecated settings** (2 settings):
   - `modaledit-line-indicator.borderStyle`
   - `modaledit-line-indicator.borderWidth`

2. **Update existing mode settings** (4 settings - add borderStyle/borderWidth):

   **NORMAL mode** (2 existing + 2 new = 4 total):
   ```json
   "modaledit-line-indicator.normalModeBackground": {
       "type": "string",
       "default": "rgba(255, 255, 255, 0)",
       "scope": "resource",
       "description": "Background color for normal mode line highlight (CSS color format)"
   },
   "modaledit-line-indicator.normalModeBorder": {
       "type": "string",
       "default": "#00aa00",
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
       "description": "Border width for normal mode line highlight (CSS format, e.g., '2px', '0.1em')"
   }
   ```

   **INSERT mode** (2 existing + 2 new = 4 total):
   ```json
   "modaledit-line-indicator.insertModeBackground": {
       "type": "string",
       "default": "rgba(255, 255, 255, 0)",
       "scope": "resource",
       "description": "Background color for insert mode line highlight (CSS color format)"
   },
   "modaledit-line-indicator.insertModeBorder": {
       "type": "string",
       "default": "#aa0000",
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
       "description": "Border width for insert mode line highlight (CSS format, e.g., '2px', '0.1em')"
   }
   ```

3. **Add VISUAL mode settings** (4 new):
   ```json
   "modaledit-line-indicator.visualModeBackground": {
       "type": "string",
       "default": "rgba(255, 255, 255, 0)",
       "scope": "resource",
       "description": "Background color for visual mode line highlight (CSS color format)"
   },
   "modaledit-line-indicator.visualModeBorder": {
       "type": "string",
       "default": "#0000aa",
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
       "description": "Border width for visual mode line highlight (CSS format, e.g., '2px', '0.1em')"
   }
   ```

4. **Add SEARCH mode settings** (4 new):
   ```json
   "modaledit-line-indicator.searchModeBackground": {
       "type": "string",
       "default": "rgba(255, 255, 255, 0)",
       "scope": "resource",
       "description": "Background color for search mode line highlight (CSS color format)"
   },
   "modaledit-line-indicator.searchModeBorder": {
       "type": "string",
       "default": "#aaaa00",
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
       "description": "Border width for search mode line highlight (CSS format, e.g., '2px', '0.1em')"
   }
   ```

**Summary:**
- Before: 7 settings (1 enabled + 2 modes × 2 + 2 shared)
- After: 17 settings (1 enabled + 4 modes × 4)
- Breaking change: `borderStyle` and `borderWidth` removed

---

### Phase 2: Type Definitions (src/extension.ts)

**File:** `src/extension.ts`

**Changes:**

1. **Add Mode type** (add near top of file):
   ```typescript
   type Mode = 'normal' | 'insert' | 'visual' | 'search';
   ```

2. **Update DecorationTypes interface** (line ~70):
   ```typescript
   // Before
   interface DecorationTypes {
       normal: vscode.TextEditorDecorationType;
       insert: vscode.TextEditorDecorationType;
   }

   // After
   interface DecorationTypes {
       normal: vscode.TextEditorDecorationType;
       insert: vscode.TextEditorDecorationType;
       visual: vscode.TextEditorDecorationType;
       search: vscode.TextEditorDecorationType;
   }
   ```

3. **Update state tracking** (class properties):
   ```typescript
   // Before
   private isNormalModeCache: boolean = false;

   // After
   private currentModeCache: Mode = 'insert';
   ```

---

### Phase 3: Mode Detection (src/extension.ts)

**File:** `src/extension.ts`

**Changes:**

1. **Replace `isInNormalMode()` method** (currently lines 166-179):
   ```typescript
   /**
    * Detects the current ModalEdit mode using context keys and selection state.
    *
    * Priority order (matches ModalEdit's internal logic):
    * 1. SEARCH mode - if modaledit.searching context is true
    * 2. INSERT mode - if modaledit.normal context is false
    * 3. VISUAL mode - if modaledit.normal is true AND editor has selection
    * 4. NORMAL mode - if modaledit.normal is true AND no selection
    *
    * @returns The current mode ('normal' | 'insert' | 'visual' | 'search')
    */
   private async detectCurrentMode(): Promise<Mode> {
       const editor = vscode.window.activeTextEditor;
       if (!editor) {
           return 'insert'; // Fallback when no editor active
       }

       try {
           // Priority 1: Check SEARCH mode (has dedicated context key)
           const isSearching = await vscode.commands.executeCommand('getContext', 'modaledit.searching');
           if (isSearching) {
               this.logger.log('Mode detected: SEARCH (modaledit.searching = true)');
               return 'search';
           }

           // Priority 2: Check NORMAL mode (has dedicated context key)
           const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
           if (!isNormal) {
               this.logger.log('Mode detected: INSERT (modaledit.normal = false)');
               return 'insert';
           }

           // Priority 3: In NORMAL mode - check if selecting (VISUAL mode)
           const hasSelection = editor.selections.some(
               sel => !sel.anchor.isEqual(sel.active)
           );

           if (hasSelection) {
               this.logger.log('Mode detected: VISUAL (modaledit.normal = true, has selection)');
               return 'visual';
           }

           this.logger.log('Mode detected: NORMAL (modaledit.normal = true, no selection)');
           return 'normal';

       } catch (error) {
           // If context query fails (ModalEdit not installed), default to INSERT
           this.logger.error(`Mode detection failed: ${error}, defaulting to INSERT`);
           return 'insert';
       }
   }
   ```

2. **Update mode caching logic** (wherever `isNormalModeCache` is used):
   ```typescript
   // Before
   if (isNormalMode !== this.isNormalModeCache) {
       this.isNormalModeCache = isNormalMode;
       // ...
   }

   // After
   const currentMode = await this.detectCurrentMode();
   if (currentMode !== this.currentModeCache) {
       this.currentModeCache = currentMode;
       // ...
   }
   ```

---

### Phase 4: Decoration Management (src/extension.ts)

**File:** `src/extension.ts`

**Changes:**

1. **Update `createDecorations()` method** (currently lines 117-160):
   ```typescript
   /**
    * Creates text editor decoration types for all 4 modes.
    * Each mode has its own background, border color, border style, and border width.
    *
    * @returns Object containing decoration types for normal, insert, visual, and search modes
    */
   private createDecorations(): DecorationTypes {
       const config = vscode.workspace.getConfiguration('modaledit-line-indicator');

       this.logger.log('Creating decorations for 4 modes');

       // Helper function to create decoration for a specific mode
       const createModeDecoration = (mode: Mode): vscode.TextEditorDecorationType => {
           const bg = config.get<string>(`${mode}ModeBackground`, 'rgba(255, 255, 255, 0)');
           const borderColor = config.get<string>(`${mode}ModeBorder`, '#ffffff');
           const borderStyle = config.get<string>(`${mode}ModeBorderStyle`, 'solid');
           const borderWidth = config.get<string>(`${mode}ModeBorderWidth`, '2px');

           this.logger.log(`  ${mode.toUpperCase()}: bg=${bg}, border=${borderWidth} ${borderStyle} ${borderColor}`);

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

2. **Update `applyDecorations()` method** (currently lines 238-248):
   ```typescript
   /**
    * Applies decorations to an editor based on the current mode.
    * Only one decoration type is applied at a time (exclusive).
    *
    * @param editor - The text editor to apply decorations to
    * @param ranges - The ranges to decorate (typically current line only)
    * @param mode - The current mode ('normal' | 'insert' | 'visual' | 'search')
    */
   private applyDecorations(
       editor: vscode.TextEditor,
       ranges: vscode.Range[],
       mode: Mode
   ): void {
       // Clear all decorations first
       editor.setDecorations(this.decorations.normal, []);
       editor.setDecorations(this.decorations.insert, []);
       editor.setDecorations(this.decorations.visual, []);
       editor.setDecorations(this.decorations.search, []);

       // Apply decoration for current mode only
       switch (mode) {
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

       this.logger.log(`Applied ${mode.toUpperCase()} mode decoration to ${ranges.length} range(s)`);
   }
   ```

3. **Update `reloadDecorations()` method** (currently lines 366-379):
   ```typescript
   /**
    * Reloads decorations when configuration changes.
    * Disposes old decoration types and creates new ones with updated settings.
    */
   private async reloadDecorations(): Promise<void> {
       this.logger.log('Reloading decorations (config changed)');

       // Dispose old decorations
       this.decorations.normal.dispose();
       this.decorations.insert.dispose();
       this.decorations.visual.dispose();
       this.decorations.search.dispose();

       // Create new decorations with updated config
       this.decorations = this.createDecorations();

       // Reapply to all visible editors
       await this.updateAllVisibleEditors();
   }
   ```

4. **Update `updateHighlight()` method** (currently lines 193-250):
   ```typescript
   /**
    * Updates line highlight for the active editor.
    * Detects current mode and applies appropriate decoration.
    */
   private async updateHighlight(): Promise<void> {
       // ... existing debounce logic ...

       const editor = vscode.window.activeTextEditor;
       if (!editor) {
           this.logger.log('No active editor, skipping highlight update');
           return;
       }

       // Detect current mode
       const currentMode = await this.detectCurrentMode();

       // Get ranges to decorate (current line)
       const ranges = this.getDecorateRanges(editor);

       // Apply decorations
       this.applyDecorations(editor, ranges, currentMode);
   }
   ```

5. **Update `dispose()` method** (add visual and search):
   ```typescript
   public dispose(): void {
       this.logger.log('Disposing ModalEditLineIndicator');

       // Clear decorations from all visible editors
       vscode.window.visibleTextEditors.forEach(editor => {
           editor.setDecorations(this.decorations.normal, []);
           editor.setDecorations(this.decorations.insert, []);
           editor.setDecorations(this.decorations.visual, []);
           editor.setDecorations(this.decorations.search, []);
       });

       // Dispose decoration types
       this.decorations.normal.dispose();
       this.decorations.insert.dispose();
       this.decorations.visual.dispose();
       this.decorations.search.dispose();

       // ... rest of dispose logic ...
   }
   ```

---

### Phase 5: Testing Updates

**Files:** All test files in `src/test/suite/`

**Changes:**

1. **Update `modeDetection.test.ts`** (6 tests):
   - Update to test 4 modes instead of 2
   - Test VISUAL mode detection (normal + selection)
   - Test SEARCH mode detection (modaledit.searching context)
   - Test priority order (SEARCH > INSERT > VISUAL > NORMAL)

2. **Update `decorationLifecycle.test.ts`** (8 tests):
   - Create 4 decoration types instead of 2
   - Test all 4 decorations are disposed
   - Test config changes recreate all 4 decorations

3. **Update `configuration.test.ts`** (9 tests → 17+ tests):
   - Test all 17 configuration keys exist
   - Test default values for all modes
   - Test VISUAL and SEARCH mode config reads
   - Remove tests for deprecated `borderStyle` and `borderWidth`

4. **Update `extension.test.ts`** (9 tests):
   - Update mode detection tests to cover 4 modes
   - Test queryMode command returns correct mode

5. **Update `eventHandling.test.ts`** (7 tests):
   - Test selection change triggers VISUAL mode
   - Test clearing selection returns to NORMAL
   - Test entering search triggers SEARCH mode

6. **Update `modalEditIntegration.test.ts`** (9 tests):
   - Test VISUAL mode detection when ModalEdit installed
   - Test SEARCH mode detection when ModalEdit installed
   - Test graceful degradation (all modes → INSERT) when ModalEdit not installed

7. **Update `example.test.ts`** (6 tests):
   - Update examples to show 4-mode usage

**Test Execution:**
```bash
make test          # Run all automated tests
make coverage      # Generate coverage report
```

---

### Phase 6: Manual Testing

**File:** `ai_docs/MANUAL-TESTING.md`

**Add new test cases** (expand from 33 to ~45):

**VISUAL Mode Tests** (8 new):
1. Enter NORMAL mode → press `v` → verify blue dashed border appears
2. While in VISUAL mode, move cursor → verify blue dashed border follows
3. While in VISUAL mode, extend selection → verify blue dashed border stays
4. Press Escape from VISUAL mode → verify returns to green dotted border (NORMAL)
5. Enter INSERT mode → select text with Shift+Arrow → verify stays red solid (not VISUAL)
6. Configure custom VISUAL border color → verify applies correctly
7. Configure custom VISUAL border style (solid) → verify applies correctly
8. Configure VISUAL background color → verify applies correctly

**SEARCH Mode Tests** (4 new):
1. Enter NORMAL mode → press `/` → verify yellow solid border appears
2. Type search query while in SEARCH mode → verify yellow border stays
3. Press Escape from SEARCH mode → verify returns to green dotted border (NORMAL)
4. Configure custom SEARCH border color → verify applies correctly

**Mode Transition Tests** (4 new):
1. NORMAL → INSERT → NORMAL → VISUAL → NORMAL → verify all transitions work
2. NORMAL → SEARCH → NORMAL → verify transition works
3. VISUAL → INSERT → VISUAL → verify transitions work
4. Rapid mode switching (N→V→N→I→N) → verify no flickering/lag

**Per-Mode Border Tests** (4 new):
1. Configure different borderWidth for each mode → verify all apply correctly
2. Configure different borderStyle for each mode → verify all apply correctly
3. Set NORMAL borderWidth to 4px, INSERT to 1px → verify width changes on mode switch
4. Set NORMAL borderStyle to double, INSERT to dotted → verify style changes on mode switch

---

### Phase 7: Documentation Updates

**Files to update:**

#### 1. README.md

**Update Features section:**
```markdown
## Features

- **Dynamic Line Highlighting**: Changes line highlight color and style based on current editing mode
- **4 Mode Support**:
  - **NORMAL mode**: Dotted green border (default)
  - **INSERT mode**: Solid red border (default)
  - **VISUAL mode**: Dashed blue border (default)
  - **SEARCH mode**: Solid yellow border (default)
- **Per-Mode Customization**: Configure background, border color, border style, and border width independently for each mode
- **Real-time Updates**: Instantly reflects mode changes
- **Minimal Performance Impact**: Efficient decoration management and event handling
```

**Add Configuration section:**
```markdown
## Configuration

All settings are configurable per mode. Each mode has 4 properties:

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `modaledit-line-indicator.enabled` | boolean | `true` | Enable/disable extension |
| **Normal Mode** | | | |
| `normalModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (transparent) |
| `normalModeBorder` | string | `#00aa00` | Border color (green) |
| `normalModeBorderStyle` | enum | `dotted` | Border style (solid/dashed/dotted/...) |
| `normalModeBorderWidth` | string | `2px` | Border width |
| **Insert Mode** | | | |
| `insertModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (transparent) |
| `insertModeBorder` | string | `#aa0000` | Border color (red) |
| `insertModeBorderStyle` | enum | `solid` | Border style |
| `insertModeBorderWidth` | string | `2px` | Border width |
| **Visual Mode** | | | |
| `visualModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (transparent) |
| `visualModeBorder` | string | `#0000aa` | Border color (blue) |
| `visualModeBorderStyle` | enum | `dashed` | Border style |
| `visualModeBorderWidth` | string | `2px` | Border width |
| **Search Mode** | | | |
| `searchModeBackground` | string | `rgba(255, 255, 255, 0)` | Background color (transparent) |
| `searchModeBorder` | string | `#aaaa00` | Border color (yellow) |
| `searchModeBorderStyle` | enum | `solid` | Border style |
| `searchModeBorderWidth` | string | `2px` | Border width |

### Example Configuration

```json
{
  "modaledit-line-indicator.normalModeBorder": "#00ff00",
  "modaledit-line-indicator.normalModeBorderStyle": "double",
  "modaledit-line-indicator.normalModeBorderWidth": "3px",

  "modaledit-line-indicator.visualModeBackground": "#0000ff10",
  "modaledit-line-indicator.visualModeBorder": "#0000ff",
  "modaledit-line-indicator.visualModeBorderStyle": "dashed",
  "modaledit-line-indicator.visualModeBorderWidth": "2px"
}
```
```

**Add Migration section:**
```markdown
## Migration from v1.x to v2.0

### Breaking Changes

Version 2.0 introduces per-mode border configuration. The shared `borderStyle` and `borderWidth` settings have been removed.

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

If you had customized the old settings, you'll need to reconfigure them per-mode.
```

#### 2. DEVELOPMENT.md

**Update Architecture section:**
```markdown
### Mode Detection

The extension detects ModalEdit modes using context keys and selection state:

1. **SEARCH mode**: Queries `modaledit.searching` context key
2. **INSERT mode**: Queries `modaledit.normal` context key (false = insert)
3. **VISUAL mode**: Checks `modaledit.normal === true` AND editor has selection
4. **NORMAL mode**: Checks `modaledit.normal === true` AND no selection

This priority order matches ModalEdit's internal mode logic.
```

**Update Configuration section:**
```markdown
### Configuration System

All settings namespaced with `modaledit-line-indicator.*` (17 total):
- `enabled` (boolean, default: `true`) - Enable/disable extension
- 4 modes × 4 properties each:
  - `{mode}ModeBackground` (string) - Background color
  - `{mode}ModeBorder` (string) - Border color
  - `{mode}ModeBorderStyle` (enum) - Border style (solid/dashed/dotted/etc)
  - `{mode}ModeBorderWidth` (string) - Border width (CSS format)

Where `{mode}` is: `normal`, `insert`, `visual`, or `search`.
```

#### 3. CLAUDE.md

**Update project overview:**
```markdown
## Project Overview

VS Code extension that provides dynamic line highlighting based on ModalEdit modes. Changes line highlight colors and styles in real-time when switching between modes:
- **NORMAL mode**: Dotted green border (default)
- **INSERT mode**: Solid red border (default)
- **VISUAL mode**: Dashed blue border (default)
- **SEARCH mode**: Solid yellow border (default)

**External Dependency**: Requires the ModalEdit extension to be installed and active for context key access.
```

**Update Critical Implementation Details section:**
```markdown
**Mode Detection Mechanism**:
- Queries `modaledit.normal` and `modaledit.searching` context keys
- Returns `Promise<Mode>` - must be awaited
- Detects VISUAL mode by checking `modaledit.normal === true` AND `editor has selection`
- Falls back to INSERT mode if ModalEdit extension not available
- Priority order: SEARCH → INSERT → VISUAL → NORMAL
```

**Update Configuration System section:**
```markdown
## Configuration System

All settings namespaced with `modaledit-line-indicator.*` (17 total):
- `enabled` (boolean, default: `true`) - Enable/disable extension
- **Per-mode settings** (4 modes × 4 properties = 16 settings):
  - `{mode}ModeBackground` - Background color (default: transparent)
  - `{mode}ModeBorder` - Border color (green/red/blue/yellow)
  - `{mode}ModeBorderStyle` - Border style (dotted/solid/dashed/solid)
  - `{mode}ModeBorderWidth` - Border width (default: 2px)

Where `{mode}` is: `normal`, `insert`, `visual`, or `search`.
```

#### 4. ai_docs/MANUAL-TESTING.md

Add new sections for VISUAL mode, SEARCH mode, and per-mode border testing (see Phase 6 above).

---

### Phase 8: Build and Validate

**Commands:**

```bash
# Clean build
make clean
make all

# Run automated tests
make test          # Should pass all 54+ tests

# Run validation
make validate      # TypeScript, ESLint, Prettier, tests

# Manual testing
# Press F5 in VS Code → Extension Development Host
# Follow manual testing checklist (45 test cases)
```

**Validation Checklist:**

- [ ] TypeScript compiles without errors (`make compile`)
- [ ] ESLint passes (`make lint`)
- [ ] Prettier formatting passes (`make format`)
- [ ] All automated tests pass (`make test`)
- [ ] Extension loads in Development Host (F5)
- [ ] All 4 modes detected correctly (check console logs)
- [ ] All 4 decorations apply correctly (visual verification)
- [ ] Configuration changes apply in real-time
- [ ] No console errors or warnings
- [ ] Manual testing checklist complete (45 test cases)

---

## Implementation Checklist

### Package Configuration
- [ ] Remove `borderStyle` setting from package.json
- [ ] Remove `borderWidth` setting from package.json
- [ ] Update `normalModeBackground` default to `rgba(255, 255, 255, 0)`
- [ ] Update `normalModeBorder` default to `#00aa00`
- [ ] Add `normalModeBorderStyle` setting (default: `dotted`)
- [ ] Add `normalModeBorderWidth` setting (default: `2px`)
- [ ] Update `insertModeBackground` default to `rgba(255, 255, 255, 0)`
- [ ] Update `insertModeBorder` default to `#aa0000`
- [ ] Add `insertModeBorderStyle` setting (default: `solid`)
- [ ] Add `insertModeBorderWidth` setting (default: `2px`)
- [ ] Add `visualModeBackground` setting (default: `rgba(255, 255, 255, 0)`)
- [ ] Add `visualModeBorder` setting (default: `#0000aa`)
- [ ] Add `visualModeBorderStyle` setting (default: `dashed`)
- [ ] Add `visualModeBorderWidth` setting (default: `2px`)
- [ ] Add `searchModeBackground` setting (default: `rgba(255, 255, 255, 0)`)
- [ ] Add `searchModeBorder` setting (default: `#aaaa00`)
- [ ] Add `searchModeBorderStyle` setting (default: `solid`)
- [ ] Add `searchModeBorderWidth` setting (default: `2px`)

### Code Changes (src/extension.ts)
- [ ] Add `Mode` type definition
- [ ] Update `DecorationTypes` interface (add visual, search)
- [ ] Replace `isNormalModeCache` with `currentModeCache: Mode`
- [ ] Replace `isInNormalMode()` with `detectCurrentMode()`
- [ ] Update `createDecorations()` to create 4 decoration types
- [ ] Update `applyDecorations()` to handle 4 modes
- [ ] Update `reloadDecorations()` to dispose 4 decorations
- [ ] Update `updateHighlight()` to use new mode detection
- [ ] Update `dispose()` to clear/dispose 4 decorations
- [ ] Update all mode caching logic
- [ ] Add comprehensive logging for mode detection

### Test Updates
- [ ] Update `modeDetection.test.ts` (4 modes)
- [ ] Update `decorationLifecycle.test.ts` (4 decorations)
- [ ] Update `configuration.test.ts` (17 settings)
- [ ] Update `extension.test.ts` (4 modes)
- [ ] Update `eventHandling.test.ts` (VISUAL/SEARCH transitions)
- [ ] Update `modalEditIntegration.test.ts` (VISUAL/SEARCH detection)
- [ ] Update `example.test.ts` (4-mode examples)
- [ ] All tests pass (`make test`)

### Documentation Updates
- [ ] Update README.md (features, configuration, migration)
- [ ] Update DEVELOPMENT.md (architecture, mode detection)
- [ ] Update CLAUDE.md (overview, mode detection, config count)
- [ ] Update ai_docs/MANUAL-TESTING.md (add VISUAL/SEARCH tests)
- [ ] Create research/modaledit-integration-guide.md ✅
- [ ] Create research/configuration-architecture.md ✅
- [ ] Create research/implementation-plan.md ✅ (this file)

### Build and Validation
- [ ] Run `make clean`
- [ ] Run `make all` (install, compile, lint, validate)
- [ ] Run `make test` (all tests pass)
- [ ] Run `make validate` (full validation)
- [ ] Manual testing in Extension Development Host (F5)
- [ ] Complete manual testing checklist (45 test cases)
- [ ] Check console logs for errors/warnings
- [ ] Verify all 4 modes work correctly
- [ ] Verify configuration changes apply in real-time

### Pre-Release
- [ ] Version bump in package.json (1.x.x → 2.0.0)
- [ ] Update CHANGELOG.md (breaking changes, new features)
- [ ] Git commit with detailed message
- [ ] Create git tag (v2.0.0)
- [ ] Test installation via `make install-ext`
- [ ] Test in clean VS Code workspace
- [ ] Beta testing with real users (optional but recommended)

---

## Risk Assessment

### Breaking Changes

**Impact:** HIGH - Users with custom `borderStyle` or `borderWidth` will lose those settings

**Mitigation:**
- Clear documentation in README.md migration section
- Version bump to 2.0.0 (semantic versioning)
- Consider adding migration helper (optional)

### ModalEdit Dependency

**Impact:** MEDIUM - Extension behavior depends on ModalEdit context keys

**Mitigation:**
- Graceful degradation (all modes → INSERT if ModalEdit not installed)
- Extension still functions as basic line indicator
- Clear documentation that ModalEdit is recommended

### Testing Coverage

**Impact:** MEDIUM - VS Code Decoration API is write-only (cannot query colors programmatically)

**Mitigation:**
- Comprehensive manual testing checklist (45 test cases)
- Automated tests for mode detection, config, events, lifecycle
- Real-world testing in Extension Development Host

### Performance

**Impact:** LOW - Additional async context queries on every selection change

**Mitigation:**
- Context queries are very fast (~1ms each)
- Debouncing prevents excessive updates (10ms)
- Cursor polling already in place (50ms)
- Minimal performance impact expected

---

## Timeline Estimate

**Total: 4-6 hours**

| Phase | Task | Estimated Time |
|-------|------|----------------|
| 1 | Configuration schema (package.json) | 30 min |
| 2 | Type definitions (src/extension.ts) | 15 min |
| 3 | Mode detection (src/extension.ts) | 45 min |
| 4 | Decoration management (src/extension.ts) | 60 min |
| 5 | Test updates (all test files) | 90 min |
| 6 | Manual testing (45 test cases) | 30 min |
| 7 | Documentation updates (4 files) | 45 min |
| 8 | Build and validation | 15 min |
| **Total** | | **5 hours 30 minutes** |

**Buffer:** +30 min for debugging, edge cases, refinement

---

## Success Criteria

### Functional Requirements

- [ ] Extension detects all 4 modes correctly (NORMAL, INSERT, VISUAL, SEARCH)
- [ ] Each mode shows distinct border color and style by default
- [ ] All 17 configuration settings work correctly
- [ ] Configuration changes apply in real-time
- [ ] Extension gracefully degrades when ModalEdit not installed
- [ ] No flickering or lag during mode transitions
- [ ] All automated tests pass (54+ tests)
- [ ] All manual tests pass (45 test cases)

### Non-Functional Requirements

- [ ] Performance: No noticeable lag or CPU spike during mode changes
- [ ] Reliability: No console errors or warnings
- [ ] Usability: Clear configuration documentation and examples
- [ ] Maintainability: Clean, well-documented code following SOLID principles
- [ ] Compatibility: Works with latest VS Code and ModalEdit versions

### Documentation Requirements

- [ ] README.md: Clear feature description, configuration guide, migration guide
- [ ] DEVELOPMENT.md: Updated architecture and development workflow
- [ ] CLAUDE.md: Updated implementation details for AI assistance
- [ ] Manual testing: Comprehensive test cases for VISUAL and SEARCH modes
- [ ] Research docs: Integration guide, configuration architecture, implementation plan

---

## Post-Implementation

### Code Review Checklist

- [ ] Code follows KISS, DRY, SOLID principles
- [ ] All functions have clear, descriptive names
- [ ] Complex logic has explanatory comments
- [ ] No magic numbers or hardcoded values
- [ ] Error handling is comprehensive
- [ ] Resource cleanup is thorough (dispose pattern)
- [ ] Logging is appropriate (not too verbose, not too quiet)

### Future Enhancements (Out of Scope)

- [ ] Configuration migration helper (auto-migrate v1 → v2 settings)
- [ ] Configuration presets (e.g., "Solarized", "Monokai")
- [ ] Per-language mode colors (e.g., different colors for Python vs JavaScript)
- [ ] Animation/transitions between mode changes
- [ ] Custom mode detection hooks (for other modal editing extensions)

---

## Summary

This implementation plan provides a comprehensive roadmap for adding 4-mode support (NORMAL, INSERT, VISUAL, SEARCH) with per-mode border configuration to the ModalEdit Line Indicator extension.

**Key Changes:**
- Configuration: 7 → 17 settings (breaking change)
- Mode detection: Cursor style → Context keys + selection state (robust)
- Decorations: 2 → 4 decoration types (extensible)
- Tests: Updated all 7 test suites + 12 new manual tests

**Expected Outcome:**
- Users can clearly distinguish all 4 ModalEdit modes by line indicator appearance
- Each mode has independent, customizable styling
- Extension is more robust and future-proof
- "INSERT color bug" is completely resolved

The plan is detailed, actionable, and ready for implementation. All research has been documented in the `research/` directory for future reference.
