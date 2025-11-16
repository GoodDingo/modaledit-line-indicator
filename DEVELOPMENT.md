# Development Guide

This guide provides instructions for developing, building, and validating the ModalEdit Line Indicator VS Code extension.

## Prerequisites

- Node.js 16+ and npm
- VS Code 1.80.0 or higher
- Git
- Make (standard on macOS/Linux, use WSL or GNU Make on Windows)

## Quick Start

```bash
# Full build pipeline (recommended first run)
make all

# Or step by step:
make install     # Install dependencies
make compile     # Compile TypeScript
make lint        # Run ESLint
make validate    # Validate extension
```

## Project Structure

```
vscode-coloring-plugin/
├── src/
│   └── extension.ts          # Main extension code
├── out/                       # Compiled JavaScript (generated)
│   └── extension.js
├── package.json              # Extension manifest
├── tsconfig.json             # TypeScript configuration
├── .eslintrc.json           # ESLint configuration
├── .eslintignore            # ESLint ignore patterns
├── .gitignore               # Git ignore patterns
├── .vscodeignore            # VS Code packaging ignore patterns
├── Makefile                 # Build automation
├── README.md                # User documentation
├── DEVELOPMENT.md           # This file
├── CLAUDE.md                # Claude Code instructions
└── instructions.md          # Template source

```

## Makefile Commands

### Development Workflow

| Command | Description |
|---------|-------------|
| `make all` | Run complete build pipeline (clean → install → compile → lint → validate) |
| `make install` | Install npm dependencies |
| `make compile` | Compile TypeScript to JavaScript |
| `make watch` | Watch mode - recompile on file changes |
| `make clean` | Remove compiled output and artifacts |

### Code Quality

| Command | Description |
|---------|-------------|
| `make lint` | Run ESLint on source files |
| `make lint-fix` | Run ESLint and auto-fix issues |

### Validation

| Command | Description |
|---------|-------------|
| `make validate` | Full validation (compile + lint + manifest + structure checks) |
| `make check` | Alias for validate |
| `make check-manifest` | Verify package.json has all required fields |
| `make check-structure` | Verify required files and directories exist |

### Packaging & Installation

| Command | Description |
|---------|-------------|
| `make package` | Create .vsix package file |
| `make install-ext` | Install extension to VS Code |
| `make uninstall-ext` | Uninstall extension from VS Code |
| `make reinstall` | Uninstall and reinstall extension |

### Information

| Command | Description |
|---------|-------------|
| `make info` | Display extension info and build status |
| `make version` | Display extension version |
| `make help` | Display all available commands |

## Development Workflow

### Standard Development Cycle

```bash
# 1. Start development
make install
make watch        # Keep this running in terminal

# 2. Edit code in src/extension.ts

# 3. Test extension (press F5 in VS Code)
#    This launches Extension Development Host

# 4. Before committing
make lint-fix     # Fix linting issues
make validate     # Ensure everything is valid
```

### Making Changes

1. **Edit source code** in `src/extension.ts`
2. **TypeScript compiles automatically** if using `make watch`
3. **Test in VS Code** by pressing F5 to launch debug session
4. **Lint your code** with `make lint` or `make lint-fix`
5. **Validate** with `make validate` before committing

### Testing the Extension

**Method 1: Debug Mode (Recommended)**
1. Open project in VS Code
2. Press `F5` or select "Run → Start Debugging"
3. New VS Code window opens with extension loaded
4. Test mode switching and line highlighting

**Method 2: Install Locally**
```bash
make package      # Creates .vsix file
make install-ext  # Installs to VS Code
```

## Validation Checklist

Before committing or publishing, ensure all checks pass:

```bash
make validate
```

This runs:
- ✅ TypeScript compilation
- ✅ ESLint checks
- ✅ package.json manifest validation
- ✅ Project structure validation

## npm Scripts

The Makefile wraps these npm scripts (you can also call them directly):

```json
{
  "vscode:prepublish": "npm run compile",
  "compile": "tsc -p ./",
  "watch": "tsc -watch -p ./",
  "pretest": "npm run compile && npm run lint",
  "lint": "eslint src --ext ts",
  "lint:fix": "eslint src --ext ts --fix",
  "package": "vsce package",
  "clean": "rm -rf out"
}
```

## ESLint Configuration

ESLint is configured with:
- TypeScript parser and plugin
- Recommended TypeScript rules
- Custom rules for naming conventions, semicolons, and code quality

**Auto-fix issues:**
```bash
make lint-fix
# or
npm run lint:fix
```

## TypeScript Configuration

Configured in `tsconfig.json`:
- Target: ES2020
- Module: CommonJS
- Strict mode enabled
- Source maps enabled
- Output: `./out` directory

## Extension Validation

### Required package.json Fields

Our extension includes all required fields:
- ✅ `name` - Extension identifier
- ✅ `version` - Semantic version
- ✅ `publisher` - Publisher identifier
- ✅ `engines.vscode` - VS Code version requirement
- ✅ `main` - Entry point (./out/extension.js)
- ✅ `activationEvents` - When extension activates
- ✅ `contributes` - Commands and configuration

### Required Files

- ✅ `package.json` - Extension manifest
- ✅ `src/extension.ts` - Main extension code
- ✅ `tsconfig.json` - TypeScript config
- ✅ `.eslintrc.json` - ESLint config
- ✅ `out/extension.js` - Compiled output (after build)

## Troubleshooting

### "out/ directory not found"
```bash
make compile
```

### "Dependencies not installed"
```bash
make install
```

### "Linting errors"
```bash
make lint-fix    # Auto-fix what's possible
make lint        # Check remaining issues
```

### "Extension won't load in VS Code"
1. Check VS Code Developer Console: `Help → Toggle Developer Tools`
2. Look for errors in Console tab
3. Verify `make validate` passes
4. Try `make reinstall`

### "TypeScript compilation errors"
1. Check `tsconfig.json` is valid
2. Verify `@types/vscode` version matches `engines.vscode` in package.json
3. Run `make clean && make compile`

## Publishing Checklist

Before publishing to VS Code Marketplace:

1. ✅ Update version in `package.json`
2. ✅ Update `CHANGELOG.md` (if exists)
3. ✅ Run `make validate` - all checks must pass
4. ✅ Update publisher name in `package.json`
5. ✅ Update repository URL in `package.json`
6. ✅ Test extension thoroughly in clean VS Code install
7. ✅ Create package: `make package`
8. ✅ Publish: `vsce publish` (requires marketplace account)

## Git Workflow

```bash
# After making changes
git add .
make validate           # Ensure everything is valid
git commit -m "Description of changes"
git push
```

## Additional Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Extension Manifest Reference](https://code.visualstudio.com/api/references/extension-manifest)
- [Publishing Extensions](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [Testing Extensions](https://code.visualstudio.com/api/working-with-extensions/testing-extension)

## Contact & Contributing

See CONTRIBUTING.md for contribution guidelines (when created).
