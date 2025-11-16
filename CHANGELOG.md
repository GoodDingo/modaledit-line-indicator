# Changelog

All notable changes to the "ModalEdit Line Indicator" extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Initial implementation of dynamic line highlighting for ModalEdit modes
- Configuration options for normal and insert mode colors
- Border style and width customization
- Toggle command for enabling/disabling the indicator
- Support for highlighting current line only or all lines
- Configuration scope set to "resource" for per-workspace settings
- Enum descriptions for better settings UI
- Granular configuration change handling

### Changed
- Implemented proper Disposable interface pattern
- Toggle command now persists state to configuration

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
