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
make validate         # Full validation check before committing

# Testing
# Press F5 in VS Code to launch Extension Development Host

# Packaging and installation
make package          # Create .vsix file
make install-ext      # Install to VS Code
make reinstall        # Uninstall and reinstall extension
```

### Validation Before Commits

Always run `make validate` before committing. This runs:
- TypeScript compilation check
- ESLint validation
- package.json manifest field verification
- Project structure verification

## Architecture

### Single-Class Design

**ModalEditLineIndicator** class in `src/extension.ts`:
- Manages entire extension lifecycle
- Holds mode state and decoration instances
- Registers all VS Code event listeners
- Handles activation/deactivation

### Critical Implementation Details

**Mode Detection Mechanism**:
- Queries `modaledit.normal` context using `vscode.commands.executeCommand('getContext', 'modaledit.normal')`
- Returns `Promise<boolean>` - must be awaited
- Falls back to `false` if ModalEdit extension not available

**Decoration System**:
- Two `TextEditorDecorationType` instances created on initialization (normal, insert)
- Decorations applied exclusively (only one active at a time)
- Applied to current line only by default (configurable via `highlightCurrentLineOnly`)
- Must be manually cleared when switching modes or disabling extension

**Event-Driven Updates**:
- Listens to `onDidChangeTextEditorSelection` (cursor movement triggers mode check)
- Listens to `onDidChangeActiveTextEditor` (switching editors triggers update)
- Listens to `onDidChangeConfiguration` (settings changes trigger decoration reload)
- 10ms debounce on `updateHighlight()` prevents excessive redraws

**Resource Management**:
- All event listeners stored in `disposables` array
- On deactivation: clear decorations → dispose listeners → dispose decoration types
- Decorations must be disposed when recreating (config changes)

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
- Behavior: `enabled`, `highlightCurrentLineOnly`

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

## ESLint Configuration

- TypeScript-aware rules via `@typescript-eslint` plugin
- Naming conventions enforced
- Semi-colons required
- Unused variables warned (except `_` prefixed)
- Auto-fix available via `make lint-fix`

## Extension Manifest (package.json)

**Critical fields**:
- `main: "./out/extension.js"` - compiled entry point, not source
- `activationEvents: ["onStartupFinished"]` - activates on VS Code startup
- `engines.vscode: "^1.80.0"` - minimum VS Code version
- `publisher: "user"` - change before publishing to marketplace

**Commands contributed**:
- `modaledit-line-indicator.toggleEnabled` - user-facing toggle
- `modaledit-line-indicator.updateHighlight` - internal command for forced updates

## Development Workflow

**Standard cycle**:
```bash
make install          # Once at start
make watch            # Keep running in terminal
# Edit src/extension.ts
# Press F5 to test in Extension Development Host
make lint-fix         # Before committing
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

## Files and Directories

**Source**: `src/extension.ts` only - single file extension
**Output**: `out/extension.js` (generated, git-ignored)
**Config**: `package.json`, `tsconfig.json`, `.eslintrc.json`
**Build**: `Makefile` - use this, not npm directly
**Documentation**: `README.md` (user-facing), `DEVELOPMENT.md` (developer-facing)

## Performance Considerations

- Decorations only applied to visible editors (not all open files)
- Debounced updates prevent excessive redraws during rapid cursor movement
- Current line only mode minimizes decoration count
- Mode checks are async but lightweight (context query only)

## Publishing Checklist

Before publishing to marketplace:
1. Update `publisher` field in package.json (currently "user")
2. Update `repository.url` in package.json
3. Update version following semver
4. Run `make validate` - must pass
5. Test in clean VS Code install via `make install-ext`
6. Run `vsce publish` (requires Personal Access Token)
