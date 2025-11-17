# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code extension that provides dynamic line highlighting based on ModalEdit modes. Changes line highlight colors and styles in real-time when switching between modes:
- **NORMAL mode**: Green dotted border (default)
- **INSERT mode**: Red solid border (default)
- **VISUAL mode**: Blue dashed border (default)
- **SEARCH mode**: Yellow solid border (default)

**External Dependency**: Requires the ModalEdit extension to be installed and active for context key access.

## Build System

This project uses **Make** as the primary build system. All development commands should use the Makefile targets.

### Essential Commands

**IMPORTANT**: Use Make for all development tasks. npm commands are available but Make is preferred.

```bash
# First-time setup or after pulling changes
make all              # Full pipeline: clean → install → compile → lint → validate

# Active development
make watch            # Auto-recompile on file changes (keep running during development)
make lint-fix         # Auto-fix ESLint issues before committing
make format           # Format code with Prettier
make validate         # Full validation check before committing

# Testing
make test             # Run extension tests (uses vscode-test, ~3 seconds)
make coverage         # Generate code coverage report
# Press F5 in VS Code to launch Extension Development Host for manual testing

# Packaging and installation
make package          # Create .vsix file
make install-ext      # Install to VS Code
make reinstall        # Uninstall and reinstall extension
```

**Direct npm equivalents** (use only if Make unavailable):
- `npm run compile` = TypeScript compilation
- `npm run watch` = Watch mode
- `npm test` = Run tests
- `npm run lint:fix` = Auto-fix linting
- `npm run format` = Format code

### Validation Before Commits

Always run `make validate` before committing. This runs:
- TypeScript compilation check
- ESLint validation
- Prettier formatting check
- package.json manifest field verification
- Project structure verification
- Extension tests

## Architecture

### Single-Class Design

**ModalEditLineIndicator** class in `src/extension.ts`:
- Manages entire extension lifecycle
- Holds mode state and decoration instances
- Registers all VS Code event listeners
- Handles activation/deactivation
- Implements `vscode.Disposable` interface for proper cleanup

**Design Pattern**: Single Responsibility Principle - one class manages the complete lifecycle of the extension. All state, decorations, and event listeners are encapsulated within this class.

### Critical Implementation Details

**Logging Infrastructure**:
- `ExtensionLogger` class with dual output (VS Code Output Channel + temp file)
- All significant events logged (activation, mode changes, decoration updates, errors)
- Log file accessible via `showLogFile` command for troubleshooting
- Output channel: "ModalEdit Line Indicator" (View → Output)

**Mode Detection Mechanism** (CRITICAL - Configuration-Independent):
- **IMPORTANT**: VS Code does NOT provide a `getContext()` API - context keys are read-only for `when` clauses
- Uses **hybrid detection**: cursor style + selection state (works across all user configurations)
- Returns `Mode` synchronously (not async)

**Detection Strategy**:
1. **Priority 1 - Selection-based**: If `hasSelection && cursorStyle !== Line` → VISUAL mode
2. **Priority 2 - Cursor patterns**: Map cursor styles to modes with selection awareness

**Why This Works Universally**:
- Users can configure ANY cursor style for each mode in ModalEdit
- VISUAL mode is fundamentally about having a selection
- INSERT mode always uses Line cursor (ModalEdit convention)
- Detection works regardless of user's `selectCursorStyle`, `normalCursorStyle`, etc.

**Cursor Style Mapping** (handles all configurations):
- `Block (2)` or `BlockOutline (5)`: VISUAL if selection, else NORMAL
- `Underline (3)` or `UnderlineThin (6)`: SEARCH mode
- `LineThin (4)`: VISUAL if selection, else INSERT
- `Line (1)`: INSERT mode (default)

**Polling System**:
- 50ms polling timer detects mode changes (cursor style updates don't fire events)
- Polls `detectCurrentMode()` synchronously every 50ms
- Starts on activation, stops on disable/disposal
- Idempotent - won't create duplicate timers

**Decoration System**:
- Four `TextEditorDecorationType` instances created on initialization (normal, insert, visual, search)
- Decorations applied exclusively (only one active at a time)
- Applied to current line only via `getDecorateRanges()`
- Must be manually cleared when switching modes or disabling extension
- Must be disposed and recreated when configuration changes

**Event-Driven Updates**:
- Listens to `onDidChangeTextEditorSelection` (cursor movement and selection changes trigger mode check)
- Listens to `onDidChangeActiveTextEditor` (switching editors triggers update)
- Listens to `onDidChangeConfiguration` (settings changes trigger decoration reload or enable/disable)
- 10ms debounce on `updateHighlight()` prevents excessive redraws during rapid cursor movement
- 50ms mode polling provides real-time mode change detection via cursor style

**Logging Strategy** (reduces noise):
- Debug logs only appear when cursor style OR selection state changes
- Mode change logs only appear when mode actually transitions
- Applied decoration logs only appear on mode changes (not every cursor move)

**Resource Management**:
- All event listeners stored in `disposables` array
- On deactivation: stop polling → clear decorations → dispose listeners → dispose decoration types
- On disable (via config): stop polling timer and clear decorations
- On enable (via config): start polling timer and apply decorations
- Decorations must be disposed when recreating (config changes)
- Both debounce timer and polling timer must be cleared on disposal

### Data Flow

```
User switches mode (ModalEdit handles this)
  ↓
ModalEdit changes cursor style + updates selection state
  ↓
Polling timer detects change (every 50ms)
  OR
Selection/cursor event fires
  ↓
detectCurrentMode() checks:
  1. hasSelection && cursorStyle !== Line? → VISUAL
  2. Cursor style pattern → NORMAL/INSERT/SEARCH
  ↓
Mode changed? Apply new decoration, log change
Mode same? Skip (no logging, no decoration update)
  ↓
VS Code renders line highlight
```

## Configuration System

All settings namespaced with `modaledit-line-indicator.*` (5 total):
- `enabled` (boolean, default: `true`) - Enable/disable extension
- **Per-mode nested objects** (4 modes with theme-aware properties):
  - `normalMode`, `insertMode`, `visualMode`, `searchMode`
  - Each mode supports: `background`, `border`, `borderStyle`, `borderWidth`
  - **Theme-specific overrides** (Stage 2):
    - `[dark]` - Regular dark theme (also serves as fallback for `[highContrastDark]`)
    - `[light]` - Regular light theme (also serves as fallback for `[highContrastLight]`)
    - `[highContrastDark]` - High contrast dark theme → falls back to `[dark]`
    - `[highContrastLight]` - High contrast light theme → falls back to `[light]`

**Configuration Structure** (v0.1.3+ with Stage 2):
```json
{
  "modaledit-line-indicator.normalMode": {
    // Common properties (apply to all themes unless overridden)
    "background": "rgba(255, 255, 255, 0)",
    "borderStyle": "dotted",
    "borderWidth": "2px",

    // Theme-specific overrides
    "[dark]": {
      "border": "#00ffff"  // Used by dark + HC dark (as fallback)
    },
    "[light]": {
      "border": "#0000ff"  // Used by light + HC light (as fallback)
    },
    "[highContrastDark]": {
      "borderWidth": "4px"  // Overrides only borderWidth
      // border falls back to [dark].border (#00ffff)
      // borderStyle falls back to common (dotted)
      // background falls back to common
    },
    "[highContrastLight]": {
      "border": "#000000",  // Overrides border
      "borderWidth": "4px"  // Overrides borderWidth
      // borderStyle falls back to common (dotted)
      // background falls back to common
    }
  }
}
```

**Theme Detection & Merging** (Stage 2):
- Uses `vscode.window.activeColorTheme.kind` to detect current theme
- **4 distinct theme kinds** detected:
  - `ColorThemeKind.Dark` (2) → `'dark'`
  - `ColorThemeKind.Light` (1) → `'light'`
  - `ColorThemeKind.HighContrast` (3) → `'highContrastDark'`
  - `ColorThemeKind.HighContrastLight` (4) → `'highContrastLight'`
- **Property-level cascading fallback** (Stage 2):
  - Each property resolved **independently** through fallback chain
  - Enables selective overrides (e.g., only override `borderWidth` for HC, inherit rest)
- **Fallback Hierarchy**:
  - **HC Dark**: `[highContrastDark]` → `[dark]` → common → defaults
  - **HC Light**: `[highContrastLight]` → `[light]` → common → defaults
  - **Regular Dark/Light**: `[dark/light]` → common → defaults
- Theme change listener (`onDidChangeActiveColorTheme`) triggers decoration reload
- **Stage 2 BREAKING CHANGE**: Removed `[highContrast]` support (use `[highContrastDark]` and `[highContrastLight]`)

Configuration changes trigger `reloadDecorations()` which:
1. Disposes old decoration types (all 4)
2. Creates new decoration types with theme-aware merged settings
3. Re-applies to all visible editors

## TypeScript Configuration

- Target: ES2020
- Module: CommonJS (required for VS Code extensions)
- Strict mode enabled
- Source maps enabled for debugging
- Output directory: `./out`
- Declaration files generated

## ESLint Configuration

- TypeScript-aware rules via `@typescript-eslint` plugin
- Prettier integration for code formatting
- Naming conventions enforced
- Semi-colons required
- Unused variables warned (except `_` prefixed)
- Auto-fix available via `make lint-fix`

## Extension Manifest (package.json)

**Critical fields**:
- `main: "./out/extension.js"` - compiled entry point, not source
- `activationEvents: ["onStartupFinished"]` - activates on VS Code startup
- `engines.vscode: "^1.106.0"` - minimum VS Code version
- `publisher: "user"` - change before publishing to marketplace

**Commands contributed** (5 total):
- `modaledit-line-indicator.toggleEnabled` - Toggle extension on/off (user-facing)
- `modaledit-line-indicator.updateHighlight` - Force highlight update (internal)
- `modaledit-line-indicator.queryMode` - Query current mode for debugging
- `modaledit-line-indicator.showLogFile` - Open log file for troubleshooting
- `modaledit-line-indicator.clearLog` - Clear log file

## Testing

**Test Infrastructure**:
- Test framework: Mocha (TDD syntax: `suite`, `test`)
- Test runner: `@vscode/test-cli` and `@vscode/test-electron`
- Coverage: c8 (shows 0% due to VS Code extension process isolation - expected limitation)
- Test helpers: 21 static methods in `src/test/helpers/testHelpers.ts` (reduces boilerplate by ~80%)
- Manual testing: 33 test cases in `ai_docs/MANUAL-TESTING.md` (required for visual verification)

**Running tests**:
```bash
make test              # Run all 113 automated tests (~10 seconds) - Stage 2: was 99 tests
make coverage          # Generate coverage report (process isolation limitation documented)

# Run specific test suite (bypass Make):
npm test -- --grep "theme detection"       # Run themeDetection.test.ts
npm test -- --grep "config merging"        # Run configMerging.test.ts
npm test -- --grep "theme change"          # Run themeChangeEvent.test.ts
npm test -- --grep "configuration"         # Run configuration.test.ts
npm test -- --grep "Stage 1"               # Run Stage 1 specific tests
npm test -- --grep "Stage 2"               # Run Stage 2 specific tests (cascading fallback)
```

**Test Suites** (11 total, 113 tests - Stage 1: +5 tests, Stage 2: +14 tests):
- `modeDetection.test.ts` - ModalEdit integration (6 tests)
- `decorationLifecycle.test.ts` - Decoration creation/disposal (8 tests)
- `extension.test.ts` - Extension activation/commands (9 tests)
- `eventHandling.test.ts` - VS Code events (7 tests)
- `configuration.test.ts` - Nested config structure (9 tests)
- `modalEditIntegration.test.ts` - ModalEdit detection/fallback (9 tests)
- `example.test.ts` - TestHelper usage examples (6 tests)
- `themeDetection.test.ts` - Theme kind detection (15 tests - **Stage 1: +5 tests**)
- `configMerging.test.ts` - Theme-aware config merging (15 tests)
- `themeChangeEvent.test.ts` - Theme change event handling (14 tests)
- `cascadingFallback.test.ts` - Cascading fallback hierarchy (**Stage 2: 14 tests** - NEW)

**Test Patterns** (documented in `src/test/helpers/testPatterns.md`):
- Standard test structure with setup/teardown
- ModalEdit integration with graceful skip
- Decoration testing (creation/disposal in try/finally)
- Configuration testing (reset in teardown)
- Event testing (dispose listeners in finally)

**Critical Testing Limitation**:
- VS Code Decoration API is write-only - cannot query colors programmatically
- Manual testing REQUIRED for visual verification (33 test cases documented)
- Coverage tool shows 0% due to Extension Host process isolation (documented limitation)

## Development Workflow

**Standard cycle**:
```bash
make install          # Once at start
make watch            # Keep running in terminal
# Edit src/extension.ts
# Press F5 to test in Extension Development Host
make lint-fix         # Before committing
make format           # Before committing
make validate         # Verify everything passes
```

**Debugging**:
- Press F5 to launch Extension Development Host
- Check console logs: extension outputs to Debug Console
- VS Code Developer Tools: `Help → Toggle Developer Tools`
- Look for "ModalEdit Line Indicator: Activating..." and "Activated" messages

**Common issues**:
- Colors not changing: ModalEdit extension not installed or inactive
- Mode detection incorrect: Check cursor style configuration in ModalEdit settings (`selectCursorStyle`, etc.)
- Extension not loading: Check `make validate` passes, verify `out/extension.js` exists
- TypeScript errors: Run `make clean && make compile`
- Test failures: Tests gracefully skip ModalEdit-specific scenarios if ModalEdit not installed
- Too many logs: Logs are already filtered to only show state changes - if still excessive, check for rapid mode switching
- Logging: Check Output channel "ModalEdit Line Indicator" or run `showLogFile` command

## Files and Directories

**Source**:
- `src/extension.ts` - Main extension code (single file)
- `src/test/suite/*.test.ts` - 10 test suites (94 tests)
- `src/test/helpers/testHelpers.ts` - 29 test helper methods (includes 8 theme-specific helpers)
- `src/test/helpers/testPatterns.md` - 5 documented test patterns

**Output**: `out/` directory (generated, git-ignored)

**Config**: `package.json`, `tsconfig.json`, `.eslintrc.json`, `.prettierrc.json`

**Build**: `Makefile` - use this, not npm directly

**Documentation**:
- `README.md` - User-facing documentation
- `DEVELOPMENT.md` - Developer workflow
- `CLAUDE.md` - This file (Claude Code guidance)
- `ai_docs/MANUAL-TESTING.md` - 33 manual test cases for visual verification
- `ai_docs/COVERAGE-REPORT.md` - Coverage analysis and limitations
- `ai_docs/test-plan/` - 9 stage reports documenting test migration

## Performance Considerations

- Decorations only applied to visible editors (not all open files)
- Debounced updates prevent excessive redraws during rapid cursor movement
- Only current line is highlighted, minimizing decoration count
- Mode detection is synchronous and lightweight (no async overhead)
- Logging is conditional - only writes when state changes
- No file watching or heavy computation - event-driven only

## Publishing Checklist

Before publishing to marketplace:
1. Update `publisher` field in package.json (currently "user")
2. Update `repository.url` in package.json
3. Update version following semver
4. Run `make validate` - must pass (all 94 tests passing)
5. Complete manual testing checklist (`ai_docs/MANUAL-TESTING.md` - 33 test cases)
6. Test in clean VS Code install via `make install-ext`
7. Verify with real users (beta testing) before claiming production-ready
8. Run `vsce publish` (requires Personal Access Token)

**IMPORTANT**: Do not claim extension is "production-ready" until verified by real users. Use "ready for review" or "beta testing" instead.

## Critical Design Decisions

**Why cursor-style detection instead of context keys?**
- VS Code does NOT provide `getContext()` API - context keys are read-only for `when` clauses
- ModalEdit ALWAYS sets different cursor styles for different modes
- Hybrid approach (cursor + selection) works universally across all user configurations

**Why synchronous detection?**
- Originally tried async `executeCommand('getContext')` but this command doesn't exist
- Cursor style is immediately available via `editor.options.cursorStyle`
- Selection state is immediately available via `editor.selection.isEmpty`
- No async overhead = better performance

**Why polling instead of events?**
- VS Code doesn't fire events when `editor.options.cursorStyle` changes
- ModalEdit updates cursor style without triggering observable events
- 50ms polling provides near-instant detection with minimal overhead

## Git Workflow

**CRITICAL**: When creating PRs:
- Run `git fetch` to update remote refs
- **ALWAYS** run diffs for `origin/main...HEAD` (not `main...HEAD`)
- Local `main` branch may be out of sync - always compare against remote
- Use `git diff origin/main...HEAD --stat` to verify PR contents
- Use `git log origin/main..HEAD --oneline` to verify PR commits
