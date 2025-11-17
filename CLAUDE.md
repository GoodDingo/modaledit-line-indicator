# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code extension providing dynamic line highlighting for ModalEdit modes (NORMAL, INSERT, VISUAL, SEARCH). Requires ModalEdit extension installed.

## Build System & Commands

**Primary build tool: Make** (npm available as fallback)

```bash
# Development cycle
make all              # Full pipeline: clean → install → compile → lint → validate
make watch            # Auto-recompile (keep running)
make validate         # Pre-commit check (required before commits)

# Testing
make test             # 111 tests (~12s), Press F5 for manual testing
npm test -- --grep "theme detection"  # Run specific suite

# Package & deploy
make package          # Create .vsix
make install-ext      # Install to VS Code
```

## Architecture

### Single-Class Design (`src/extension.ts`)

`ModalEditLineIndicator` manages entire lifecycle: state, decorations (4 types), event listeners, activation/deactivation.

### Mode Detection (Configuration-Independent)

**CRITICAL**: VS Code has NO `getContext()` API. Uses hybrid detection: cursor style + selection state.

**Detection logic**:
1. `hasSelection && cursorStyle !== Line` → VISUAL
2. Cursor patterns: Block/BlockOutline → NORMAL, Underline/UnderlineThin → SEARCH, Line/LineThin → INSERT

**Why this works**: ModalEdit always sets different cursor styles per mode. Detection is synchronous (no async overhead).

**Polling**: 50ms timer (cursor style changes don't fire events), idempotent.

### Decoration System

- Four `TextEditorDecorationType` instances (normal/insert/visual/search)
- Applied exclusively to current line only
- Must dispose/recreate on config changes
- Must clear on mode switch or disable

### Event System

- `onDidChangeTextEditorSelection`: 10ms debounced `updateHighlight()`
- `onDidChangeActiveTextEditor`: update on editor switch
- `onDidChangeConfiguration`: `reloadDecorations()` or enable/disable
- `onDidChangeActiveColorTheme`: reload decorations

### Data Flow

```
ModalEdit changes cursor → 50ms polling OR selection event fires
→ detectCurrentMode() (sync) → mode changed?
→ YES: apply decoration + log | NO: skip
```

### Resource Management

- All listeners in `disposables[]`
- Deactivation: stop polling → clear decorations → dispose listeners → dispose types
- Both debounce and polling timers must clear on disposal

## Configuration System

Namespace: `modaledit-line-indicator.*` (5 settings: `enabled` + 4 modes)

**Per-mode structure** (`normalMode`, `insertMode`, `visualMode`, `searchMode`):
```json
{
  "background": "rgba(255, 255, 255, 0)",
  "border": "#00aa00",
  "borderStyle": "dotted",
  "borderWidth": "2px",
  "[dark]": { "border": "#00ffff" },
  "[light]": { "border": "#0000ff" },
  "[highContrastDark]": { "borderWidth": "4px" },
  "[highContrastLight]": { "border": "#000000", "borderWidth": "4px" }
}
```

**Theme detection**: `vscode.window.activeColorTheme.kind` → 4 kinds: Dark(2), Light(1), HighContrast(3)→'highContrastDark', HighContrastLight(4)

**Property-level cascading fallback**:
- HC Dark: `[highContrastDark]` → `[dark]` → common → defaults
- HC Light: `[highContrastLight]` → `[light]` → common → defaults
- Regular: `[dark/light]` → common → defaults

Each property resolves independently (enables selective overrides).

## Testing

**Infrastructure**: Mocha + @vscode/test-electron, c8 coverage (0% expected - Extension Host isolation)

**11 suites, 111 tests (~12s)**:
- `modeDetection` (6), `decorationLifecycle` (8), `extension` (9), `eventHandling` (7)
- `configuration` (9), `modalEditIntegration` (9), `example` (6)
- `themeDetection` (15), `configMerging` (15), `themeChangeEvent` (14), `cascadingFallback` (14)

**Test helpers**: 29 static methods in `src/test/helpers/testHelpers.ts` (reduces boilerplate ~80%)

**Manual testing required**: 33 cases in `ai_docs/MANUAL-TESTING.md` (Decoration API is write-only)

## TypeScript/ESLint

- Target: ES2020, Module: CommonJS, Strict mode, Output: `./out`
- ESLint: `@typescript-eslint` + Prettier, auto-fix: `make lint-fix`

## Extension Manifest Critical Fields

- `main: "./out/extension.js"` (compiled, not source)
- `activationEvents: ["onStartupFinished"]`
- `engines.vscode: "^1.106.0"`
- `publisher: "user"` (change before publishing)

**5 commands**: `toggleEnabled`, `updateHighlight`, `queryMode`, `showLogFile`, `clearLog`

## Logging

`ExtensionLogger`: dual output (Output Channel "ModalEdit Line Indicator" + temp file). Conditional logging (state changes only). Access: `showLogFile` command.

## Development Workflow

```bash
make install && make watch  # Once, then keep running
# Edit src/extension.ts, Press F5 to test
make lint-fix && make format && make validate  # Before commit
```

**Debugging**: F5 → Extension Development Host, `Help → Toggle Developer Tools`, look for "Activating..."

**Common issues**:
- No color change: ModalEdit not installed/active
- Wrong mode: Check ModalEdit cursor config (`selectCursorStyle`, etc.)
- Not loading: `make validate`, verify `out/extension.js`
- Logs: Output channel or `showLogFile` command

## Performance

- Decorations only on visible editors
- 10ms debounce prevents redraw spam
- Current line only (minimal decoration count)
- Sync detection (no async overhead)
- Event-driven (no file watching)

## Publishing Checklist

1. Update `publisher` and `repository.url` in package.json
2. Update version (semver)
3. `make validate` must pass (111 tests)
4. Complete 33 manual test cases
5. Test in clean VS Code install
6. Beta test with real users before "production-ready"
7. `vsce publish`

## Critical Design Decisions

**Cursor-style detection vs context keys**: VS Code has NO `getContext()` API. ModalEdit always sets cursor styles. Hybrid (cursor+selection) works universally.

**Synchronous detection**: `editor.options.cursorStyle` and `editor.selection.isEmpty` immediately available. No async overhead.

**Polling vs events**: VS Code doesn't fire events on `cursorStyle` changes. 50ms polling = near-instant + minimal overhead.

## Git Workflow

**CRITICAL for PRs**:
- `git fetch` first
- Compare `origin/main...HEAD` (NOT `main...HEAD`)
- Verify: `git diff origin/main...HEAD --stat`, `git log origin/main..HEAD --oneline`
