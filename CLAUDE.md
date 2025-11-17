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

All settings namespaced with `modaledit-line-indicator.*`:
- Color customization: `normalModeBackground`, `normalModeBorder`, `insertModeBackground`, `insertModeBorder`
- Visual style: `borderStyle` (solid/dashed/dotted), `borderWidth`
- Behavior: `enabled`

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

**Commands contributed**:
- `modaledit-line-indicator.toggleEnabled` - user-facing toggle
- `modaledit-line-indicator.updateHighlight` - internal command for forced updates

## Testing

**Test Infrastructure**:
- Test framework: Mocha
- Test runner: `@vscode/test-cli` and `@vscode/test-electron`
- Coverage: c8 (generates HTML and text reports)
- Tests located in: `src/test/suite/`

**Running tests**:
```bash
make test              # Run all tests
make coverage          # Generate coverage report
```

**Test entry points**:
- `src/test/runTest.ts` - Test runner configuration
- `src/test/suite/index.ts` - Test suite setup
- `src/test/suite/extension.test.ts` - Extension tests

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
- Test failures: Ensure ModalEdit extension is installed in test environment

## Files and Directories

**Source**: `src/extension.ts` only - single file extension
**Tests**: `src/test/` directory
**Output**: `out/extension.js` (generated, git-ignored)
**Config**: `package.json`, `tsconfig.json`, `.eslintrc.json`
**Build**: `Makefile` - use this, not npm directly
**Documentation**: `README.md` (user-facing), `DEVELOPMENT.md` (developer-facing)

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
4. Run `make validate` - must pass
5. Run `make coverage` - ensure adequate test coverage
6. Test in clean VS Code install via `make install-ext`
7. Run `vsce publish` (requires Personal Access Token)
