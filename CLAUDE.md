# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VS Code extension that provides dynamic line highlighting based on ModalEdit modes. Changes line highlight colors in real-time when switching between normal mode (green) and insert mode (red).

**External Dependency**: Requires the ModalEdit extension to be installed and active for context key access.

## Build System

This project uses **Make** as the primary build system. All development commands should use the Makefile targets.

### Essential Commands

```bash
# First-time setup or after pulling changes
make all              # Full pipeline: clean → install → compile → lint → validate

# Active development
make watch            # Auto-recompile on file changes (keep running during development)
make lint-fix         # Auto-fix ESLint issues before committing
make format           # Format code with Prettier
make validate         # Full validation check before committing

# Testing
make test             # Run extension tests
make coverage         # Generate code coverage report
# Press F5 in VS Code to launch Extension Development Host for manual testing

# Packaging and installation
make package          # Create .vsix file
make install-ext      # Install to VS Code
make reinstall        # Uninstall and reinstall extension
```

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

**Mode Detection Mechanism**:
- Queries `modaledit.normal` context using `vscode.commands.executeCommand('getContext', 'modaledit.normal')`
- Returns `Promise<boolean>` - must be awaited
- Falls back to `false` if ModalEdit extension not available
- No direct mode change events - relies on selection changes as proxy

**Decoration System**:
- Two `TextEditorDecorationType` instances created on initialization (normal, insert)
- Decorations applied exclusively (only one active at a time)
- Applied to current line only via `getDecorateRanges()`
- Must be manually cleared when switching modes or disabling extension
- Must be disposed and recreated when configuration changes

**Event-Driven Updates**:
- Listens to `onDidChangeTextEditorSelection` (cursor movement triggers mode check)
- Listens to `onDidChangeActiveTextEditor` (switching editors triggers update)
- Listens to `onDidChangeConfiguration` (settings changes trigger decoration reload)
- 10ms debounce on `updateHighlight()` prevents excessive redraws during rapid cursor movement

**Resource Management**:
- All event listeners stored in `disposables` array
- On deactivation: clear decorations → dispose listeners → dispose decoration types
- Decorations must be disposed when recreating (config changes)
- Debounce timer must be cleared on disposal

### Data Flow

```
User switches mode (ModalEdit handles this)
  ↓
ModalEdit sets context key 'modaledit.normal'
  ↓
Cursor moves or selection changes
  ↓
onDidChangeTextEditorSelection fires
  ↓
Extension queries 'modaledit.normal' context
  ↓
Applies appropriate decoration (normal or insert)
  ↓
VS Code renders line highlight
```

## Configuration System

All settings namespaced with `modaledit-line-indicator.*` (7 total):
- `enabled` (boolean, default: `true`) - Enable/disable extension
- `normalModeBackground` (string, default: `#00770020`) - Normal mode background color
- `normalModeBorder` (string, default: `#005500`) - Normal mode border color
- `insertModeBackground` (string, default: `#77000020`) - Insert mode background color
- `insertModeBorder` (string, default: `#aa0000`) - Insert mode border color
- `borderStyle` (enum: solid/dashed/dotted, default: `solid`) - Border style
- `borderWidth` (string, default: `2px`) - Border width

Configuration changes trigger `reloadDecorations()` which:
1. Disposes old decoration types
2. Creates new decoration types with updated settings
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
make test              # Run all 54 automated tests (~3 seconds)
make coverage          # Generate coverage report (process isolation limitation documented)
```

**Test Suites** (7 total, 54 tests):
- `modeDetection.test.ts` - ModalEdit integration (6 tests)
- `decorationLifecycle.test.ts` - Decoration creation/disposal (8 tests)
- `extension.test.ts` - Extension activation/commands (9 tests)
- `eventHandling.test.ts` - VS Code events (7 tests)
- `configuration.test.ts` - All config keys (9 tests)
- `modalEditIntegration.test.ts` - ModalEdit detection/fallback (9 tests)
- `example.test.ts` - TestHelper usage examples (6 tests)

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
- Colors not changing: ModalEdit extension not installed or mode context not updating
- Extension not loading: Check `make validate` passes, verify `out/extension.js` exists
- TypeScript errors: Run `make clean && make compile`
- Test failures: Tests gracefully skip ModalEdit-specific scenarios if ModalEdit not installed
- Logging: Check Output channel "ModalEdit Line Indicator" or run `showLogFile` command

## Files and Directories

**Source**:
- `src/extension.ts` - Main extension code (single file)
- `src/test/suite/*.test.ts` - 7 test suites (54 tests)
- `src/test/helpers/testHelpers.ts` - 21 test helper methods
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
- Mode checks are async but lightweight (context query only)
- No file watching or heavy computation - event-driven only

## Publishing Checklist

Before publishing to marketplace:
1. Update `publisher` field in package.json (currently "user")
2. Update `repository.url` in package.json
3. Update version following semver
4. Run `make validate` - must pass (all 54 tests passing)
5. Complete manual testing checklist (`ai_docs/MANUAL-TESTING.md` - 33 test cases)
6. Test in clean VS Code install via `make install-ext`
7. Verify with real users (beta testing) before claiming production-ready
8. Run `vsce publish` (requires Personal Access Token)

**IMPORTANT**: Do not claim extension is "production-ready" until verified by real users. Use "ready for review" or "beta testing" instead.