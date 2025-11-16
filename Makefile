# Makefile for VS Code Extension: ModalEdit Line Indicator
# Ensures code is compiled, linted, validated and ready for installation

.PHONY: help all clean install compile lint lint-fix validate check package test install-ext uninstall-ext

# Default target
.DEFAULT_GOAL := help

# Extension name and version (extracted from package.json)
EXT_NAME := modaledit-line-indicator
EXT_VERSION := $(shell node -p "require('./package.json').version")
VSIX_FILE := $(EXT_NAME)-$(EXT_VERSION).vsix

# Colors for output
CYAN := \033[0;36m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(CYAN)ModalEdit Line Indicator - VS Code Extension$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(CYAN)<target>$(NC)\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(CYAN)%-15s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(YELLOW)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

##@ Development

all: clean install compile lint validate ## Run full build pipeline (clean, install, compile, lint, validate)
	@echo "$(GREEN)✓ Full build pipeline completed successfully!$(NC)"

clean: ## Remove compiled output and build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf out/
	@rm -rf *.vsix
	@rm -rf node_modules/.cache
	@echo "$(GREEN)✓ Clean complete$(NC)"

install: ## Install npm dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

compile: ## Compile TypeScript to JavaScript
	@echo "$(YELLOW)Compiling TypeScript...$(NC)"
	@npm run compile
	@echo "$(GREEN)✓ Compilation complete$(NC)"

watch: ## Watch and recompile on changes
	@echo "$(YELLOW)Starting TypeScript watch mode...$(NC)"
	@npm run watch

##@ Code Quality

lint: ## Run ESLint on source files
	@echo "$(YELLOW)Running ESLint...$(NC)"
	@npm run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

lint-fix: ## Run ESLint and auto-fix issues
	@echo "$(YELLOW)Running ESLint with auto-fix...$(NC)"
	@npm run lint:fix
	@echo "$(GREEN)✓ Linting with fixes complete$(NC)"

format: ## Format code with Prettier
	@echo "$(YELLOW)Formatting code...$(NC)"
	@npm run format
	@echo "$(GREEN)✓ Formatting complete$(NC)"

format-check: ## Check code formatting
	@echo "$(YELLOW)Checking code formatting...$(NC)"
	@npm run format:check
	@echo "$(GREEN)✓ Format check complete$(NC)"

##@ Validation

validate: compile lint format-check check-manifest check-structure test ## Validate extension is ready for packaging
	@echo "$(GREEN)✓ Extension validation complete!$(NC)"

check: validate ## Alias for validate

check-manifest: ## Verify package.json has required fields
	@echo "$(YELLOW)Checking package.json manifest...$(NC)"
	@node -e "const pkg = require('./package.json'); \
		const required = ['name', 'version', 'publisher', 'engines', 'main', 'contributes']; \
		const missing = required.filter(f => !pkg[f]); \
		if (missing.length > 0) { \
			console.error('$(RED)✗ Missing required fields:', missing.join(', '), '$(NC)'); \
			process.exit(1); \
		} else { \
			console.log('$(GREEN)✓ All required manifest fields present$(NC)'); \
		}"

check-structure: ## Verify required files and directories exist
	@echo "$(YELLOW)Checking project structure...$(NC)"
	@test -f package.json || (echo "$(RED)✗ Missing package.json$(NC)" && exit 1)
	@test -f tsconfig.json || (echo "$(RED)✗ Missing tsconfig.json$(NC)" && exit 1)
	@test -f .eslintrc.json || (echo "$(RED)✗ Missing .eslintrc.json$(NC)" && exit 1)
	@test -d src || (echo "$(RED)✗ Missing src/ directory$(NC)" && exit 1)
	@test -f src/extension.ts || (echo "$(RED)✗ Missing src/extension.ts$(NC)" && exit 1)
	@test -d out || (echo "$(RED)✗ Missing out/ directory - run 'make compile' first$(NC)" && exit 1)
	@test -f out/extension.js || (echo "$(RED)✗ Missing out/extension.js - run 'make compile' first$(NC)" && exit 1)
	@echo "$(GREEN)✓ Project structure valid$(NC)"

##@ Packaging & Installation

package: validate ## Package extension as .vsix file
	@echo "$(YELLOW)Packaging extension...$(NC)"
	@npm run package
	@test -f $(VSIX_FILE) && echo "$(GREEN)✓ Package created: $(VSIX_FILE)$(NC)" || (echo "$(RED)✗ Package creation failed$(NC)" && exit 1)

install-ext: package ## Install extension to VS Code
	@echo "$(YELLOW)Installing extension to VS Code...$(NC)"
	@code --install-extension $(VSIX_FILE)
	@echo "$(GREEN)✓ Extension installed$(NC)"

uninstall-ext: ## Uninstall extension from VS Code
	@echo "$(YELLOW)Uninstalling extension from VS Code...$(NC)"
	@code --uninstall-extension user.$(EXT_NAME) || true
	@echo "$(GREEN)✓ Extension uninstalled$(NC)"

reinstall: uninstall-ext install-ext ## Uninstall and reinstall extension

##@ Testing

test: compile ## Run extension tests
	@echo "$(YELLOW)Running tests...$(NC)"
	@npm test
	@echo "$(GREEN)✓ Tests complete$(NC)"

coverage: compile ## Generate code coverage report
	@echo "$(YELLOW)Generating coverage report...$(NC)"
	@npm run coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"
	@echo "$(CYAN)View HTML report: open coverage/index.html$(NC)"

##@ Information

info: ## Display extension information
	@echo "$(CYAN)Extension Information:$(NC)"
	@echo "  Name:        $(shell node -p "require('./package.json').name")"
	@echo "  Version:     $(shell node -p "require('./package.json').version")"
	@echo "  Publisher:   $(shell node -p "require('./package.json').publisher")"
	@echo "  Description: $(shell node -p "require('./package.json').description")"
	@echo ""
	@echo "$(CYAN)Build Status:$(NC)"
	@test -d out && echo "  Compiled:    $(GREEN)Yes$(NC)" || echo "  Compiled:    $(RED)No$(NC)"
	@test -f $(VSIX_FILE) && echo "  Packaged:    $(GREEN)Yes ($(VSIX_FILE))$(NC)" || echo "  Packaged:    $(RED)No$(NC)"
	@test -d node_modules && echo "  Dependencies:$(GREEN)Installed$(NC)" || echo "  Dependencies:$(RED)Not installed$(NC)"

version: ## Display extension version
	@echo "$(EXT_VERSION)"
