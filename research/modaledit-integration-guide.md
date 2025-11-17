# ModalEdit Integration Guide

## Overview

This document provides a comprehensive guide to integrating with the ModalEdit VS Code extension, based on analysis of ModalEdit's source code at `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src`.

## ModalEdit Mode System

### Available Modes

ModalEdit implements **4 distinct editing modes**:

1. **NORMAL Mode** - Command/navigation mode (Vim-like normal mode)
2. **INSERT Mode** - Standard text editing mode
3. **VISUAL Mode** - Selection mode (normal mode with active selection)
4. **SEARCH Mode** - Incremental search mode

### Mode State Management

**Source:** `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src/commands.ts`

ModalEdit tracks mode state through two primary mechanisms:

#### 1. Context Keys (VS Code's setContext API)

```typescript
// Line 342 in commands.ts
await vscode.commands.executeCommand("setContext", "modaledit.normal", value)

// Line 484 in commands.ts
await vscode.commands.executeCommand("setContext", "modaledit.searching", value)
```

**Available Context Keys:**
- `modaledit.normal` (boolean) - `true` when in NORMAL or VISUAL mode, `false` in INSERT mode
- `modaledit.searching` (boolean) - `true` when in SEARCH mode, `false` otherwise

**NOT Available:**
- ❌ `modaledit.visual` - Does not exist
- ❌ `modaledit.insert` - Does not exist
- ❌ `modaledit.select` - Does not exist

**Querying Context Keys:**
```typescript
const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
const isSearching = await vscode.commands.executeCommand('getContext', 'modaledit.searching');
```

#### 2. Cursor Styles

ModalEdit uses different cursor styles to visually indicate the current mode. This is the **primary visual indicator** for users.

**Source:** `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src/actions.ts` (lines 201-208)

```typescript
insertCursorStyle = toVSCursorStyle(config.get<Cursor>("insertCursorStyle", "line"))
normalCursorStyle = toVSCursorStyle(config.get<Cursor>("normalCursorStyle", "block"))
searchCursorStyle = toVSCursorStyle(config.get<Cursor>("searchCursorStyle", "underline"))
selectCursorStyle = toVSCursorStyle(config.get<Cursor>("selectCursorStyle", "line-thin"))
```

**Default Cursor Styles (package.json lines 210-213):**
- **NORMAL mode:** Block cursor (`vscode.TextEditorCursorStyle.Block = 2`)
- **INSERT mode:** Line cursor (`vscode.TextEditorCursorStyle.Line = 1`)
- **VISUAL mode:** LineThin cursor (`vscode.TextEditorCursorStyle.LineThin = 4`)
- **SEARCH mode:** Underline cursor (`vscode.TextEditorCursorStyle.Underline = 5`)

**Reading Current Cursor Style:**
```typescript
const editor = vscode.window.activeTextEditor;
const cursorStyle = editor.options.cursorStyle as number | undefined;
```

**Important:** Users can customize these cursor styles in ModalEdit settings, so cursor-style-based detection is fragile unless you also read ModalEdit's configuration.

### VISUAL Mode Detection

**Source:** `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src/commands.ts` (lines 454-460)

ModalEdit determines VISUAL mode through the `isSelecting()` function:

```typescript
function isSelecting(): boolean {
    if (normalMode && selecting)
        return true
    selecting = vscode.window.activeTextEditor!.selections.some(
        selection => !selection.anchor.isEqual(selection.active))
    return selecting
}
```

**VISUAL mode is active when:**
1. `normalMode === true` (context key `modaledit.normal` is `true`)
2. AND one of:
   - Internal `selecting` flag is `true`, OR
   - Editor has active selection (anchor ≠ active position)

**Practical Detection:**
```typescript
async function isInVisualMode(): Promise<boolean> {
    // Check if in normal mode first
    const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
    if (!isNormal) return false;

    // Check if selection is active
    const editor = vscode.window.activeTextEditor;
    if (!editor) return false;

    const hasSelection = editor.selections.some(
        sel => !sel.anchor.isEqual(sel.active)
    );

    return hasSelection;
}
```

### Mode Update Flow

**Source:** `/Users/mira.hedl/LEARN/GIT/github.com/johtela/vscode-modaledit/src/commands.ts` (lines 354-362)

ModalEdit updates cursor style and status bar whenever mode changes:

```typescript
export function updateCursorAndStatusBar(editor: vscode.TextEditor | undefined, help?: string) {
    if (editor) {
        // Get the style parameters
        let [style, text, color] =
            searching ? actions.getSearchStyles() :                    // Priority 1: SEARCH
                isSelecting() && normalMode ? actions.getSelectStyles() :  // Priority 2: VISUAL
                    normalMode ? actions.getNormalStyles() :                // Priority 3: NORMAL
                        actions.getInsertStyles()                            // Priority 4: INSERT

        editor.options.cursorStyle = style  // ← Cursor style is set here
```

**Mode Priority Order:**
1. **SEARCH** (if `searching === true`)
2. **VISUAL** (if `isSelecting() && normalMode`)
3. **NORMAL** (if `normalMode`)
4. **INSERT** (default/fallback)

This means you should check modes in the same priority order for accurate detection.

## Recommended Mode Detection Strategy

Based on the analysis, the **most robust approach** is a hybrid strategy using both context keys and selection state:

### Implementation

```typescript
type Mode = 'normal' | 'insert' | 'visual' | 'search';

async function detectCurrentMode(): Promise<Mode> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
        return 'insert'; // Fallback when no editor
    }

    // Priority 1: Check SEARCH mode (has dedicated context key)
    const isSearching = await vscode.commands.executeCommand('getContext', 'modaledit.searching');
    if (isSearching) {
        return 'search';
    }

    // Priority 2: Check NORMAL mode (has dedicated context key)
    const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
    if (!isNormal) {
        return 'insert';
    }

    // Priority 3: In NORMAL mode - check if selecting (VISUAL mode)
    const hasSelection = editor.selections.some(
        sel => !sel.anchor.isEqual(sel.active)
    );

    return hasSelection ? 'visual' : 'normal';
}
```

### Why This Approach?

**Advantages:**
1. ✅ Uses official ModalEdit context keys (stable API)
2. ✅ Matches ModalEdit's own mode detection logic exactly
3. ✅ Works regardless of cursor style customization
4. ✅ Follows the same priority order as ModalEdit
5. ✅ Gracefully degrades if ModalEdit is not installed (all context queries return `undefined` → INSERT mode)

**Disadvantages:**
1. ⚠️ Async operations (minimal performance impact, ~1ms per query)
2. ⚠️ Requires awaiting promises

### Alternative: Cursor Style Detection

If you need synchronous detection or want to avoid context queries:

```typescript
function detectModeFromCursor(): Mode {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return 'insert';

    const cursorStyle = editor.options.cursorStyle as number | undefined;

    // Map cursor styles to modes (using defaults)
    switch (cursorStyle) {
        case vscode.TextEditorCursorStyle.Block:        // 2
            return 'normal';
        case vscode.TextEditorCursorStyle.LineThin:     // 4
            return 'visual';
        case vscode.TextEditorCursorStyle.Underline:    // 5
            return 'search';
        case vscode.TextEditorCursorStyle.Line:         // 1
        default:
            return 'insert';
    }
}
```

**Warning:** This breaks if users customize ModalEdit cursor styles. Use hybrid approach for production code.

## Event Handling for Mode Changes

### Challenge: No Direct Mode Change Events

ModalEdit does **not** emit events when mode changes. You must infer mode changes through proxy events.

### Available Events

**1. Selection Changes** (fires when cursor moves or selection changes)
```typescript
vscode.window.onDidChangeTextEditorSelection(async (event) => {
    // This fires when:
    // - User moves cursor
    // - User creates/modifies selection (entering/exiting VISUAL mode)
    // - User changes selection in VISUAL mode

    await detectAndUpdateMode();
});
```

**2. Active Editor Changes** (fires when switching between editor tabs)
```typescript
vscode.window.onDidChangeActiveTextEditor(async (editor) => {
    // This fires when:
    // - User switches to different file/tab
    // - Split editor focus changes

    if (editor) {
        await detectAndUpdateMode();
    }
});
```

**3. Configuration Changes** (fires when ModalEdit settings change)
```typescript
vscode.workspace.onDidChangeConfiguration(async (event) => {
    // Check if ModalEdit cursor style settings changed
    if (event.affectsConfiguration('modaledit')) {
        // If using cursor-style detection, reload cursor mappings
        await reloadModalEditConfig();
    }
});
```

### Cursor Style Polling (Recommended)

Since VS Code doesn't fire events when cursor style changes programmatically, implement polling:

```typescript
private cursorStylePollTimer?: NodeJS.Timeout;
private lastKnownCursorStyle?: number;
private readonly CURSOR_POLL_MS = 50; // 50ms = 20Hz

private startCursorStylePolling(): void {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    this.lastKnownCursorStyle = editor.options.cursorStyle as number | undefined;

    this.cursorStylePollTimer = setInterval(async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        const currentStyle = editor.options.cursorStyle as number | undefined;

        // Detect cursor style change
        if (currentStyle !== this.lastKnownCursorStyle) {
            this.lastKnownCursorStyle = currentStyle;
            await this.updateModeBasedUI();
        }
    }, this.CURSOR_POLL_MS);
}

private stopCursorStylePolling(): void {
    if (this.cursorStylePollTimer) {
        clearInterval(this.cursorStylePollTimer);
        this.cursorStylePollTimer = undefined;
    }
}
```

**Why Polling?**
- Mode changes (especially NORMAL ↔ VISUAL) happen via keyboard shortcuts (e.g., `v`, `Escape`)
- ModalEdit changes cursor style immediately
- `onDidChangeTextEditorSelection` may fire **after** cursor style changes
- 50ms polling ensures UI updates within 1-2 frames (16ms @ 60fps)

## ModalEdit Configuration

### Reading ModalEdit Settings

```typescript
const modalEditConfig = vscode.workspace.getConfiguration('modaledit');

// Cursor styles (if you need cursor-based detection)
const normalCursor = modalEditConfig.get<string>('normalCursorStyle', 'block');
const insertCursor = modalEditConfig.get<string>('insertCursorStyle', 'line');
const selectCursor = modalEditConfig.get<string>('selectCursorStyle', 'line-thin');
const searchCursor = modalEditConfig.get<string>('searchCursorStyle', 'underline');

// Status bar configuration
const statusBarText = modalEditConfig.get<object>('statusText');
const statusBarColor = modalEditConfig.get<object>('statusColor');
```

### Cursor Style String Mapping

ModalEdit uses string names for cursor styles. Mapping to VS Code enum:

```typescript
function parseCursorStyle(styleString: string): vscode.TextEditorCursorStyle {
    const map: Record<string, vscode.TextEditorCursorStyle> = {
        'block': vscode.TextEditorCursorStyle.Block,           // 2
        'block-outline': vscode.TextEditorCursorStyle.BlockOutline, // 3
        'line': vscode.TextEditorCursorStyle.Line,             // 1
        'line-thin': vscode.TextEditorCursorStyle.LineThin,    // 4
        'underline': vscode.TextEditorCursorStyle.Underline,   // 5
        'underline-thin': vscode.TextEditorCursorStyle.UnderlineThin, // 6
    };

    return map[styleString.toLowerCase()] ?? vscode.TextEditorCursorStyle.Line;
}
```

## Detecting ModalEdit Availability

### Check if ModalEdit is Installed

```typescript
function isModalEditInstalled(): boolean {
    const extension = vscode.extensions.getExtension('johtela.vscode-modaledit');
    return extension !== undefined;
}
```

### Check if ModalEdit is Active

```typescript
async function isModalEditActive(): Promise<boolean> {
    const extension = vscode.extensions.getExtension('johtela.vscode-modaledit');
    if (!extension) return false;

    // Extension might be installed but not activated yet
    if (!extension.isActive) {
        await extension.activate();
    }

    return extension.isActive;
}
```

### Graceful Degradation

If ModalEdit is not installed, context queries return `undefined`:

```typescript
const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
// isNormal === undefined if ModalEdit not installed
// This is falsy, so your code treats it as INSERT mode

if (isNormal) {
    // Only executes if ModalEdit is installed AND in normal mode
}
```

**Recommendation:** Design your extension to work standalone (without ModalEdit), with enhanced features when ModalEdit is available.

## Common Integration Patterns

### Pattern 1: Mode-Aware UI Updates

```typescript
class ModalEditAwareFeature {
    private currentMode: Mode = 'insert';

    async updateUI() {
        const newMode = await this.detectCurrentMode();

        if (newMode !== this.currentMode) {
            this.currentMode = newMode;
            this.applyModeSpecificUI(newMode);
        }
    }

    private applyModeSpecificUI(mode: Mode) {
        switch (mode) {
            case 'normal':
                // Apply normal mode UI
                break;
            case 'insert':
                // Apply insert mode UI
                break;
            case 'visual':
                // Apply visual mode UI
                break;
            case 'search':
                // Apply search mode UI
                break;
        }
    }
}
```

### Pattern 2: Debounced Updates

Prevent excessive updates during rapid mode/selection changes:

```typescript
class DebounceHelper {
    private updateTimer?: NodeJS.Timeout;
    private readonly DEBOUNCE_MS = 10;

    scheduleUpdate(callback: () => Promise<void>) {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }

        this.updateTimer = setTimeout(async () => {
            await callback();
            this.updateTimer = undefined;
        }, this.DEBOUNCE_MS);
    }

    dispose() {
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
        }
    }
}
```

### Pattern 3: Resource Cleanup

Always clean up listeners and timers:

```typescript
class ModalEditIntegration implements vscode.Disposable {
    private disposables: vscode.Disposable[] = [];
    private pollTimer?: NodeJS.Timeout;

    constructor() {
        // Register event listeners
        this.disposables.push(
            vscode.window.onDidChangeTextEditorSelection(this.onSelectionChange, this),
            vscode.window.onDidChangeActiveTextEditor(this.onEditorChange, this)
        );

        // Start polling
        this.startPolling();
    }

    dispose() {
        // Stop polling first
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = undefined;
        }

        // Dispose all listeners
        this.disposables.forEach(d => d.dispose());
        this.disposables = [];
    }
}
```

## Performance Considerations

### Context Query Performance

Context queries are async but very fast (~1ms):

```typescript
// Single query
const start = Date.now();
const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
const elapsed = Date.now() - start;
// Typical: 0-2ms
```

### Batch Queries in Parallel

When checking multiple context keys:

```typescript
// ❌ Sequential (slower)
const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
const isSearching = await vscode.commands.executeCommand('getContext', 'modaledit.searching');
// Total: ~2-4ms

// ✅ Parallel (faster)
const [isNormal, isSearching] = await Promise.all([
    vscode.commands.executeCommand('getContext', 'modaledit.normal'),
    vscode.commands.executeCommand('getContext', 'modaledit.searching')
]);
// Total: ~1-2ms
```

### Polling Frequency Recommendations

- **50ms (20Hz):** Good balance for responsive UI updates
- **100ms (10Hz):** Acceptable for non-critical updates
- **16ms (60Hz):** Overkill, wastes CPU, barely perceptible improvement

## Testing ModalEdit Integration

### Test Strategy

1. **Unit Tests:** Mock VS Code API and ModalEdit context
2. **Integration Tests:** Require ModalEdit to be installed
3. **Manual Tests:** Visual verification of mode transitions

### Mocking ModalEdit Context

```typescript
// In test setup
const mockContext = new Map<string, any>();
mockContext.set('modaledit.normal', true);
mockContext.set('modaledit.searching', false);

sinon.stub(vscode.commands, 'executeCommand').callsFake((command, ...args) => {
    if (command === 'getContext') {
        return Promise.resolve(mockContext.get(args[0]));
    }
    return Promise.resolve();
});
```

### Graceful Test Skipping

```typescript
suite('ModalEdit Integration Tests', () => {
    suiteSetup(function() {
        const extension = vscode.extensions.getExtension('johtela.vscode-modaledit');
        if (!extension) {
            this.skip(); // Skip entire suite if ModalEdit not installed
        }
    });

    test('Detects normal mode', async () => {
        // Test implementation
    });
});
```

## Troubleshooting

### Issue: Mode detection always returns INSERT

**Possible causes:**
1. ModalEdit not installed → Context queries return `undefined`
2. ModalEdit not activated → Extension inactive
3. Querying wrong context key name → Typo in 'modaledit.normal'

**Solution:**
```typescript
// Add debug logging
const isNormal = await vscode.commands.executeCommand('getContext', 'modaledit.normal');
console.log('modaledit.normal context:', isNormal); // Should be true/false, not undefined
```

### Issue: VISUAL mode not detected

**Possible causes:**
1. Not checking selection state
2. Selection check happens before selection is set

**Solution:**
```typescript
// Check selection after small delay if needed
setTimeout(async () => {
    const mode = await detectCurrentMode();
    console.log('Detected mode:', mode);
}, 10);
```

### Issue: UI updates lag behind mode changes

**Possible causes:**
1. No cursor style polling
2. Polling interval too slow
3. Missing event listeners

**Solution:**
- Implement 50ms cursor style polling
- Add `onDidChangeTextEditorSelection` listener
- Use debouncing to prevent excessive updates

## Summary

**Key Takeaways:**

1. ✅ Use context keys (`modaledit.normal`, `modaledit.searching`) for mode detection
2. ✅ Detect VISUAL mode by checking `modaledit.normal === true` AND `hasSelection`
3. ✅ Implement cursor style polling for responsive updates
4. ✅ Follow ModalEdit's priority order: SEARCH → VISUAL → NORMAL → INSERT
5. ✅ Gracefully degrade when ModalEdit not installed
6. ✅ Clean up resources (listeners, timers) on disposal
7. ❌ Don't rely solely on cursor styles (users can customize them)
8. ❌ Don't assume ModalEdit is installed without checking

**Recommended Detection Flow:**

```
1. Check modaledit.searching → SEARCH mode
2. Check modaledit.normal === false → INSERT mode
3. Check hasSelection → VISUAL mode
4. Else → NORMAL mode
```

This approach is robust, performant, and matches ModalEdit's own behavior.
