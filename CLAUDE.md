# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Coding Principles

Follow these principles for all code changes:
- **KISS** (Keep It Simple, Stupid)
- **YAGNI** (You Aren't Gonna Need It)
- **DRY** (Don't Repeat Yourself)
- **SOLID** (especially Single Responsibility Principle for classes and functions)
- **Principle of Least Surprise**
- **Single source of truth**
- **Fail fast and loudly**
- Readability and maintainability are primary concerns
- Use long, descriptive, self-documenting names for functions, classes, variables
- Prefer simple, clean, maintainable solutions over "clever" complex ones
- No future-proofing
- Test critical parts, edge cases, complex logic (not everything)

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

### Modular Design (3-file structure)

**`src/extension.ts`** - Main extension class (`ModalEditLineIndicator`)
- Manages lifecycle: state, decorations (4 types), event listeners, activation/deactivation
- Mode detection logic (cursor style + selection state hybrid)
- Decoration application and resource management
- Event handling and debouncing

**`src/logging.ts`** - Logging module (exported: `ExtensionLogger`, `LogLevel`, `LOG_LEVEL_VALUES`)
- Dual output: VS Code Output Channel + temp file (`/tmp/modaledit-line-indicator.log`)
- Log levels: error < warn < info < debug (configurable via `modaledit-line-indicator.logLevel`)
- Methods: `log()`, `debug()`, `warn()`, `error()`, `show()`, `dispose()`, `getLogFilePath()`

**`src/configuration.ts`** - Configuration module (all config-related logic)
- Types: `ThemeKind`, `ThemeOverride`, `ModeConfig`, `MergedModeConfig`
- Constants: `DEFAULT_NORMAL_MODE`, `DEFAULT_INSERT_MODE`, `DEFAULT_VISUAL_MODE`, `DEFAULT_SEARCH_MODE`
- Functions: `getCurrentThemeKind()`, `getFallbackChain()`, `resolveProperty()`, `getMergedModeConfig()`, `getDefaultsForMode()`
- Theme detection and property-level cascading fallback logic
- Single source of truth for all configuration defaults

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

Namespace: `modaledit-line-indicator.*` (6 settings: `enabled` + `logLevel` + 4 modes)

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

**11 suites, 113 tests (~12s)**:
- `modeDetection` (6), `decorationLifecycle` (8), `extension` (9), `eventHandling` (7)
- `configuration` (11), `modalEditIntegration` (9), `example` (6)
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

## Logging System

**Module**: `src/logging.ts`

**Log levels** (configurable via `modaledit-line-indicator.logLevel`):
- `error` (default) - Only errors, very quiet
- `warn` - Errors + warnings
- `info` - Errors + warnings + lifecycle events and mode changes
- `debug` - Everything including detailed diagnostics (cursor state, theme resolution)

**Dual output**:
1. VS Code Output Channel: "ModalEdit Line Indicator"
2. File: `/tmp/modaledit-line-indicator.log`

**Usage in code**:
```typescript
import { ExtensionLogger } from './logging';
const logger = new ExtensionLogger('ModalEdit Line Indicator');
logger.log('Info message', { optional: 'data' });  // INFO level
logger.debug('Debug message');                     // DEBUG level
logger.warn('Warning message');                    // WARN level
logger.error('Error message', errorObject);        // ERROR level
```

**Commands**: `showLogFile` (view), `clearLog` (clear)

**Optional logger parameter**: Configuration functions accept optional logger for debug output without coupling.

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
3. `make validate` must pass (113 tests)
4. Complete 33 manual test cases
5. Test in clean VS Code install
6. Beta test with real users before "production-ready"
7. `vsce publish`

## Critical Design Decisions

**Modular architecture (SRP)**: Code is separated into 3 modules following Single Responsibility Principle:
- `extension.ts` - VS Code lifecycle and extension-specific logic
- `logging.ts` - All logging concerns (dual output, log levels, formatting)
- `configuration.ts` - All configuration logic (theme detection, cascading fallback, defaults)

This separation improves:
- Testability (can unit test logging/config in isolation)
- Maintainability (changes to logging don't affect config logic)
- Reusability (logging/config modules can be imported by tests or future modules)
- Clarity (each module has a single, clear purpose)

**Cursor-style detection vs context keys**: VS Code has NO `getContext()` API. ModalEdit always sets cursor styles. Hybrid (cursor+selection) works universally.

**Synchronous detection**: `editor.options.cursorStyle` and `editor.selection.isEmpty` immediately available. No async overhead.

**Polling vs events**: VS Code doesn't fire events on `cursorStyle` changes. 50ms polling = near-instant + minimal overhead.

**Optional logger parameter in config functions**: Configuration module functions accept optional logger interface. This enables debug output without tight coupling - config module doesn't depend on specific logger implementation.

## Git Workflow

**CRITICAL for PRs**:
- `git fetch` first
- Compare `origin/main...HEAD` (NOT `main...HEAD`)
- Verify: `git diff origin/main...HEAD --stat`, `git log origin/main..HEAD --oneline`
