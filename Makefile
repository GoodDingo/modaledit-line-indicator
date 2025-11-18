# Makefile for VS Code Extension: ModalEdit Line Indicator
# Ensures code is compiled, linted, validated and ready for installation

.PHONY: help all clean install build watch lint lint-fix format format-check validate package test coverage install-ext

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

all: clean install lint validate ## Run full build pipeline (clean, install, lint, validate)
	@echo "$(GREEN)✓ Full build pipeline completed successfully!$(NC)"

clean: ## Remove compiled output and build artifacts
	@echo "$(YELLOW)Cleaning build artifacts...$(NC)"
	@rm -rf dist/
	@rm -rf out/
	@rm -rf *.vsix
	@rm -rf node_modules/.cache
	@echo "$(GREEN)✓ Clean complete$(NC)"

install: ## Install npm dependencies
	@echo "$(YELLOW)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

build: ## Build production bundle with esbuild
	@echo "$(YELLOW)Building production bundle...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ Build complete$(NC)"

watch: ## Watch and rebuild on changes
	@echo "$(YELLOW)Starting esbuild watch mode...$(NC)"
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

validate: build lint format-check test ## Validate extension is ready for packaging
	@echo "$(GREEN)✓ Extension validation complete!$(NC)"

##@ Packaging & Installation

package: build lint format-check test ## Package extension as .vsix file (with minified JS)
	@echo "$(YELLOW)Packaging extension...$(NC)"
	@npm run package
	@test -f $(VSIX_FILE) && echo "$(GREEN)✓ Package created: $(VSIX_FILE)$(NC)" || (echo "$(RED)✗ Package creation failed$(NC)" && exit 1)

install-ext: package ## Install extension to VS Code
	@echo "$(YELLOW)Installing extension to VS Code...$(NC)"
	code --install-extension $(VSIX_FILE)
	@echo "$(GREEN)✓ Extension installed$(NC)"

##@ Testing

test: ## Run extension tests
	@echo "$(YELLOW)Running tests...$(NC)"
	@npm test
	@echo "$(GREEN)✓ Tests complete$(NC)"

coverage: ## Generate code coverage report
	@echo "$(YELLOW)Generating coverage report...$(NC)"
	@npm run coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"
	@echo "$(CYAN)View HTML report: open coverage/index.html$(NC)"
