# Changelog

All notable changes to the "ModalEdit Line Indicator" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.1] - 2025-11-17

### Added
- **4-Mode Support**: Added VISUAL and SEARCH mode detection alongside existing NORMAL and INSERT modes
- **Per-Mode Border Configuration**: Each mode now has independent border style and width settings
  - `normalModeBorderStyle` (default: `dotted`)
  - `normalModeBorderWidth` (default: `2px`)
  - `insertModeBorderStyle` (default: `solid`)
  - `insertModeBorderWidth` (default: `2px`)
  - `visualModeBorderStyle` (default: `dashed`)
  - `visualModeBorderWidth` (default: `2px`)
  - `searchModeBorderStyle` (default: `solid`)
  - `searchModeBorderWidth` (default: `2px`)
- **New Mode Detection System**: Switched from cursor style detection to ModalEdit context keys
  - More robust and reliable mode detection
  - Supports VISUAL mode (detected via selection state)
  - Supports SEARCH mode (via `modaledit.searching` context)
- **New Color Schemes**: Updated default border colors for better visibility
  - NORMAL: Green (`#00aa00`) with dotted border
  - INSERT: Red (`#aa0000`) with solid border
  - VISUAL: Blue (`#0000aa`) with dashed border
  - SEARCH: Yellow (`#aaaa00`) with solid border

### Changed
- **BREAKING**: Removed shared `borderStyle` and `borderWidth` settings
  - Replaced with per-mode settings (see Added section)
  - Users with custom border settings will need to reconfigure per-mode
- **Background Color Defaults**: Changed all mode backgrounds from semi-transparent colored to fully transparent (`rgba(255, 255, 255, 0)`)
  - Cleaner visual appearance with border-only highlighting
  - Users who prefer colored backgrounds can still configure them
- **Mode Detection**: Replaced cursor style polling with ModalEdit context key queries
  - More accurate mode detection
  - Better integration with ModalEdit's internal state
- **Border Style Options**: Expanded from 3 to 8 CSS border style options
  - Now supports: `solid`, `dashed`, `dashed`, `double`, `groove`, `ridge`, `inset`, `outset`

### Fixed
- **VISUAL Mode Bug**: Fixed issue where VISUAL mode was incorrectly detected as INSERT mode
  - Root cause: Extension only recognized 2 modes (NORMAL/INSERT)
  - Solution: Added proper VISUAL and SEARCH mode support with context-based detection

### Technical Changes
- Upgraded mode detection from cursor style (fragile) to context keys (robust)
- Updated all 54 automated tests to validate 4-mode behavior
- Refactored decoration management to handle 4 decoration types
- Improved type safety with new `Mode` type: `'normal' | 'insert' | 'visual' | 'search'`

### Migration Guide

**If you haven't customized settings:** No action needed. Defaults will work out of the box.

**If you customized `borderStyle` or `borderWidth`:**

Before (v0.1.0):
```json
{
  "modaledit-line-indicator.borderStyle": "dashed",
  "modaledit-line-indicator.borderWidth": "3px"
}
```

After (v0.1.1):
```json
{
  "modaledit-line-indicator.normalModeBorderStyle": "dotted",
  "modaledit-line-indicator.normalModeBorderWidth": "3px",
  "modaledit-line-indicator.insertModeBorderStyle": "solid",
  "modaledit-line-indicator.insertModeBorderWidth": "3px",
  "modaledit-line-indicator.visualModeBorderStyle": "dashed",
  "modaledit-line-indicator.visualModeBorderWidth": "3px",
  "modaledit-line-indicator.searchModeBorderStyle": "solid",
  "modaledit-line-indicator.searchModeBorderWidth": "3px"
}
```

**If you prefer the old colored backgrounds:**

```json
{
  "modaledit-line-indicator.normalModeBackground": "#00770020",
  "modaledit-line-indicator.insertModeBackground": "#77000020"
}
```

## [Unreleased]

### Developer Experience
- Added comprehensive testing framework (Mocha + @vscode/test-cli)
- Added code coverage reporting (c8)
- Added Prettier for code formatting
- Added ESLint with Prettier integration
- Added Husky for git hooks (pre-commit, commit-msg)
- Added commitlint for conventional commits
- Added GitHub Actions CI/CD workflows
- Added VS Code workspace configuration (launch.json, tasks.json, etc.)
- Added EditorConfig for cross-editor consistency

## [0.0.1] - 2025-11-16

### Added
- Initial release (pre-alpha)
- Basic functionality for line highlighting based on ModalEdit modes
