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

**Build system: esbuild** (2025 standard for VS Code extensions)
- Production: Single minified bundle (`dist/extension.js`, 15KB)
- Development: Source maps enabled for debugging
- Tests: Separate compilation (`out/test/**/*.test.js`)

### Common Commands

```bash
# Development cycle
make all              # Full pipeline: clean → install → lint → validate
make watch            # Auto-rebuild on changes (esbuild watch mode)
make validate         # Pre-commit check (build → lint → format-check → test)

# Building
make build            # Production bundle (minified, no source maps)
npm run build         # Same as make build
npm run watch         # Watch mode with source maps

# Testing
make test             # Run all 113 tests (~9s) on VS Code 1.85.0
npm test              # Same as make test
npm test -- --grep "theme detection"  # Run specific test suite
make coverage         # Generate code coverage report

# Code quality
make lint             # Run ESLint v9 (flat config)
make lint-fix         # Auto-fix ESLint issues
make format           # Format with Prettier
make format-check     # Check formatting

# Package & deploy
make package          # Create .vsix (runs validation: build → lint → format-check → test)
make install-ext      # Install extension to VS Code
make clean            # Remove dist/, out/, coverage/

# Utilities
make install          # Install npm dependencies

# Debugging
# Press F5 in VS Code → Extension Development Host
# Help → Toggle Developer Tools → look for "Activating..."
```

### Build Architecture (Modern 2025)

**Single Source of Truth**: `esbuild.config.js`
- esbuild for production bundling (10-100x faster than webpack)
- TypeScript for type checking only (`tsc --noEmit`)
- Separate test compilation for VS Code test runner

**Output structure**:
```
dist/extension.js          # Single bundled extension (shipped in .vsix)
out/test/**/*.test.js      # Test files (dev only, not shipped)
```

**Why esbuild**: Microsoft-recommended, built-in minification, zero config complexity, instant builds.

## Architecture

### Modular Design (3-file structure)

**Single Responsibility Principle**: Each module has one clear purpose.

**`src/extension.ts`** - Main extension class (`ModalEditLineIndicator`)
- Manages lifecycle: state, decorations (4 types), event listeners, activation/deactivation
- Mode detection logic (cursor style + selection state hybrid)
- Decoration application and resource management
- Event handling and debouncing

**`src/logging.ts`** - Logging module
- Exports: `ExtensionLogger`, `LogLevel`, `LOG_LEVEL_VALUES`
- Dual output: VS Code Output Channel + temp file (`/tmp/modaledit-line-indicator.log`)
- Log levels: error < warn < info < debug (configurable via `modaledit-line-indicator.logLevel`)
- Methods: `log()`, `debug()`, `warn()`, `error()`, `show()`, `dispose()`, `getLogFilePath()`

**`src/configuration.ts`** - Configuration module (Singleton pattern)
- Exports: `ConfigurationManager` (singleton), `ThemeKind`, `ModeConfig`, `MergedModeConfig`
- Constants: `DEFAULT_NORMAL_MODE`, `DEFAULT_INSERT_MODE`, `DEFAULT_VISUAL_MODE`, `DEFAULT_SEARCH_MODE`
- Methods: `getConfig()`, `getCurrentThemeKind()`, `getFallbackChain()`, `resolveProperty()`, `getMergedModeConfig()`
- Theme detection and property-level cascading fallback logic
- Single source of truth for all configuration defaults
- Singleton accessed via `ConfigurationManager.getInstance(logger?)`

### Mode Detection (Configuration-Independent)

**CRITICAL**: VS Code has NO `getContext()` API. Uses hybrid detection: cursor style + selection state.

**Detection logic** (synchronous):
1. `hasSelection && cursorStyle !== Line` → VISUAL
2. Cursor patterns:
   - Block/BlockOutline → NORMAL
   - Underline/UnderlineThin → SEARCH
   - Line/LineThin → INSERT

**Why this works**: ModalEdit always sets different cursor styles per mode. Detection is synchronous (no async overhead).

**Polling**: 50ms timer (cursor style changes don't fire events), idempotent. Polling starts on activation and can be stopped when extension is disabled.

### Decoration System

- Four `TextEditorDecorationType` instances (normal/insert/visual/search)
- Applied exclusively to current line only (`getDecorateRanges()` returns single-line range)
- Must dispose and recreate on config changes (theme change or settings change)
- Must clear all decorations on mode switch or disable

### Event System

Key event handlers (all registered in `registerListeners()`):
- `onDidChangeTextEditorSelection`: 10ms debounced `updateHighlight()`
- `onDidChangeActiveTextEditor`: update on editor switch
- `onDidChangeConfiguration`: `reloadDecorations()` or enable/disable
- `onDidChangeActiveColorTheme`: reload decorations (theme changed)

### Data Flow

```
ModalEdit changes cursor → 50ms polling OR selection event fires
→ detectCurrentMode() (sync) → mode changed?
→ YES: apply decoration + log | NO: skip
```

Key methods:
1. `detectCurrentMode()`: Returns current mode based on cursor + selection
2. `updateHighlight()`: Debounced decorator application
3. `applyDecorations()`: Clears all decorations, applies current mode decoration
4. `reloadDecorations()`: Recreates decoration types (config/theme changed)

### Resource Management

**CRITICAL**: Must dispose all resources on deactivation
- All listeners in `disposables[]` array
- Deactivation sequence: stop polling → clear decorations → dispose listeners → dispose decoration types
- Both debounce timer (`updateDebounceTimer`) and polling timer (`modePollTimer`) must clear on disposal
- Use `clearTimeout()` and `clearInterval()` respectively

## Configuration System

Namespace: `modaledit-line-indicator.*` (6 settings: `enabled` + `logLevel` + 4 modes)

**IMPORTANT - v0.3.0 Configuration Format**:
- Uses unbracketed theme keys: `dark`, `light`, `darkHC`, `lightHC` (NOT `"[dark]"`, `"[light]"`, etc.)
- Uses `backgroundColor` property (NOT `background`)
- Supports 23+ DecorationRenderOptions properties with 1:1 VS Code API mapping
- No migration code exists - this is the only format that has ever existed

### Per-mode structure

Each mode (`normalMode`, `insertMode`, `visualMode`, `searchMode`) supports:
```json
{
  "backgroundColor": "rgba(0, 0, 0, 0)",
  "border": "2px dotted #00aa00",
  "dark": { "border": "2px dotted #00ffff" },
  "light": { "border": "2px dotted #0000ff" },
  "darkHC": { "border": "4px dotted #ffffff" },
  "lightHC": { "border": "4px dotted #000000" }
}
```

### Theme Detection

**VS Code API**: `vscode.window.activeColorTheme.kind` → 4 kinds:
- `ColorThemeKind.Dark` (2) → `"dark"`
- `ColorThemeKind.Light` (1) → `"light"`
- `ColorThemeKind.HighContrast` (3) → `"highContrastDark"`
- `ColorThemeKind.HighContrastLight` (4) → `"highContrastLight"`

**Implementation**: `getCurrentThemeKind()` in `src/configuration.ts`

### Property-level Cascading Fallback

**CRITICAL**: Each property resolves independently through fallback chain.

Fallback chains:
- **HC Dark**: `darkHC` → `dark` → common → defaults
- **HC Light**: `lightHC` → `light` → common → defaults
- **Regular Dark**: `dark` → common → defaults
- **Regular Light**: `light` → common → defaults

**Example**: For HC Dark theme, `border` property resolution:
1. Check `config["darkHC"].border`
2. If undefined, check `config["dark"].border`
3. If undefined, check `config.border`
4. If undefined, use `defaults.border`

**Implementation**: `resolveProperty()` and `getMergedModeConfig()` in `src/configuration.ts`

This enables selective overrides (e.g., only change border color for dark theme, inherit everything else).

## Testing

**Infrastructure**: Mocha + @vscode/test-electron, c8 coverage

**Test configuration**: `.vscode-test.cjs`
- Runs on VS Code 1.85.0 (minimum supported version)
- Ensures compatibility with `engines.vscode: "^1.85.0"`

**11 suites, 113 tests (~9s)**:
- `modeDetection` (6), `decorationLifecycle` (8), `extension` (9), `eventHandling` (7)
- `configuration` (11), `modalEditIntegration` (9), `example` (6)
- `themeDetection` (15), `configMerging` (15), `themeChangeEvent` (14), `cascadingFallback` (14)

**Test helpers**: `src/test/helpers/testHelpers.ts` - 29 static methods (reduces boilerplate ~80%)

**Running specific tests**:
```bash
npm test -- --grep "theme detection"      # Run theme detection suite
npm test -- --grep "cascading fallback"   # Run cascading fallback tests
```

**Coverage**: c8 coverage is 0% (expected) - Extension Host isolation prevents coverage instrumentation.

## TypeScript Configuration

- **Target**: ES2020
- **Module**: CommonJS (VS Code requirement)
- **Strict mode**: Enabled
- **Type checking**: `tsc --noEmit` (no code generation, esbuild handles transpilation)
- **Test compilation**: `tsc -p ./` (outputs to `out/`)
- **ESLint**: v9 with flat config (`eslint.config.js`)

## Extension Manifest Critical Fields

**Main entry**: `"main": "./dist/extension.js"` (bundled, minified)
**Activation**: `"activationEvents": ["onStartupFinished"]`
**Engine**: `"engines.vscode": "^1.85.0"` (minimum supported version)
**Publisher**: `"publisher": "gooddingo"`

**5 commands**:
1. `modaledit-line-indicator.toggleEnabled` - Toggle extension on/off
2. `modaledit-line-indicator.updateHighlight` - Force decoration update (internal)
3. `modaledit-line-indicator.queryMode` - Debug: show current mode
4. `modaledit-line-indicator.showLogFile` - Open log file
5. `modaledit-line-indicator.clearLog` - Clear log file

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

**Commands**:
- `modaledit-line-indicator.showLogFile` - View log file location
- `modaledit-line-indicator.clearLog` - Clear log file

**Optional logger parameter**: Configuration functions accept optional logger for debug output without tight coupling.

## Performance Considerations

- Decorations only applied to visible editors
- 10ms debounce prevents redraw spam on rapid cursor movements
- Current line only (minimal decoration count, single range)
- Sync detection (no async overhead, immediate cursor state access)
- Event-driven (no file watching, minimal polling overhead)
- Single bundled file (fast extension loading, single I/O operation)

## Critical Design Decisions

### Modular Architecture (SRP)

Code is separated into 3 modules following Single Responsibility Principle:
- `extension.ts` - VS Code lifecycle and extension-specific logic
- `logging.ts` - All logging concerns (dual output, log levels, formatting)
- `configuration.ts` - All configuration logic (theme detection, cascading fallback, defaults)

This separation improves:
- **Testability**: Can unit test logging/config in isolation
- **Maintainability**: Changes to logging don't affect config logic
- **Reusability**: Logging/config modules can be imported by tests or future modules
- **Clarity**: Each module has a single, clear purpose

### Cursor-style Detection vs Context Keys

**Why not context keys**: VS Code has NO `getContext()` API to read context values programmatically.

**Why cursor styles**: ModalEdit always sets different cursor styles per mode. Hybrid (cursor+selection) works universally.

### Synchronous Detection

`editor.options.cursorStyle` and `editor.selection.isEmpty` are immediately available. No async overhead, no promises, no await.

### Polling vs Events

**Problem**: VS Code doesn't fire events on `cursorStyle` changes.

**Solution**: 50ms polling = near-instant detection + minimal overhead (~20 checks/second).

**Idempotent**: Mode detection is side-effect free, safe to call repeatedly.

### Optional Logger Parameter

Configuration module functions accept optional logger interface (`logger?: { debug: (msg: string, data?: any) => void }`).

**Benefits**:
- Enables debug output without tight coupling
- Config module doesn't depend on specific logger implementation
- Tests can pass mock logger or omit for silent operation

### Single Bundled Output

**Build**: esbuild creates single `dist/extension.js` (15KB minified)

**Benefits**:
- Faster extension loading (single I/O vs multiple module loads)
- 95% smaller than unbundled (356KB → 16KB)
- Tree-shaking removes unused code
- Minification reduces bandwidth and parse time

## Git Workflow

**CRITICAL for PRs**:
- `git fetch` first
- Compare `origin/main...HEAD` (NOT `main...HEAD`)
- Verify: `git diff origin/main...HEAD --stat`, `git log origin/main..HEAD --oneline`

## Documentation, comments, migrations, changes in general

**IMPORTANT**: This is *CRITICAL* always ALWAYS remember that this plugin/extension was not release yet, therefore there are no "historical changes", not migrations, no "used to be" as when the plugin will be released it will be like it is for all users for the first time, therefore keeping all references to history would confuse users. Therefore always replace historical or old data with new and current state (without historical changes or migrations). CURRENT STATE is ALWAYS THE KING!!
