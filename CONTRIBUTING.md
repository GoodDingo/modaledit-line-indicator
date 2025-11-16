# Contributing to ModalEdit Line Indicator

Thank you for your interest in contributing to ModalEdit Line Indicator! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project follows a standard code of conduct. Be respectful, constructive, and collaborative.

## Development Setup

### Prerequisites
- Node.js 18+
- npm 9+
- VS Code 1.106.0+
- Git

### Getting Started

1. Fork and clone the repository:
```bash
git clone https://github.com/yourusername/modaledit-line-indicator.git
cd modaledit-line-indicator
```

2. Install dependencies:
```bash
make install
# or
npm install
```

3. Start development:
```bash
make watch
# or
npm run watch
```

4. Press F5 in VS Code to launch the Extension Development Host

## Development Workflow

### Build System

This project uses Make as the primary build system:

- `make all` - Full build pipeline (clean, install, compile, lint, validate)
- `make watch` - Auto-recompile on file changes
- `make test` - Run tests
- `make coverage` - Generate code coverage report
- `make lint` - Run ESLint
- `make lint-fix` - Auto-fix ESLint issues
- `make format` - Format code with Prettier
- `make validate` - Full validation (compile, lint, test)

### Code Quality Standards

#### Linting
- ESLint configured with TypeScript support
- Prettier for code formatting
- Run `make lint-fix` before committing

#### Testing
- Write tests for new features
- Maintain test coverage above 70%
- Run `make test` before submitting PR

#### Formatting
- Code is automatically formatted with Prettier
- Format-on-save is enabled in VS Code workspace
- Pre-commit hooks ensure formatting

## Commit Guidelines

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD changes
- `chore`: Other changes (dependencies, etc.)

### Examples
```
feat: add support for multi-cursor highlighting
fix: resolve decoration memory leak on editor close
docs: update README with new configuration options
test: add integration tests for mode switching
```

## Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Validate your changes**
   ```bash
   make validate
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   ```

   Husky pre-commit hooks will run linting and format checks automatically.

5. **Push and create PR**
   ```bash
   git push origin feat/your-feature-name
   ```

   Then create a pull request on GitHub.

6. **PR Review**
   - Ensure CI passes
   - Address review comments
   - Keep commits clean and focused

## Project Structure

```
src/
  extension.ts          # Main extension code
  test/
    suite/
      extension.test.ts # Integration tests
    runTest.ts         # Test runner
.vscode/               # VS Code workspace configuration
.github/               # GitHub workflows and templates
Makefile               # Build system
```

## Testing

### Running Tests

```bash
# Run all tests
make test

# Run with coverage
make coverage

# Watch mode for TDD
npm run watch
# Then press F5 for "Extension Tests" launch configuration
```

### Writing Tests

- Use Mocha with TDD-style (`suite`, `test`)
- Place tests in `src/test/suite/`
- Test files must end with `.test.ts`
- Example:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Feature Test Suite', () => {
  test('Should do something', async () => {
    // Arrange
    const expected = true;

    // Act
    const actual = await someFunction();

    // Assert
    assert.strictEqual(actual, expected);
  });
});
```

## Documentation

- Update README.md for user-facing changes
- Update DEVELOPMENT.md for developer-facing changes
- Update CLAUDE.md if architecture changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md following Keep a Changelog format

## Release Process

Releases are handled automatically via GitHub Actions:

1. Update CHANGELOG.md with release notes
2. Create and push a version tag:
   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```
3. GitHub Actions will automatically:
   - Run tests
   - Build the extension
   - Publish to VS Code Marketplace
   - Create GitHub release

## Getting Help

- Open an issue for bugs or feature requests
- Check existing issues before creating new ones
- Provide detailed information for bug reports

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
