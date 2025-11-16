# Comprehensive Guide to VS Code Extension Development

**Last Updated**: November 2025
**Target Audience**: Extension developers (beginner to advanced)
**VS Code Version**: 1.106.0+

---

## Table of Contents

1. [Introduction to VS Code Extensions](#introduction)
2. [Architecture & Core Concepts](#architecture)
3. [Extension Manifest (package.json)](#manifest)
4. [Activation Events](#activation-events)
5. [Extension API](#extension-api)
6. [Common Extension Types](#extension-types)
7. [Testing & Quality Assurance](#testing)
8. [Build & Development Workflow](#build-workflow)
9. [Publishing & Distribution](#publishing)
10. [Best Practices & Patterns](#best-practices)
11. [Performance & Optimization](#performance)
12. [Security Considerations](#security)
13. [Advanced Topics](#advanced-topics)
14. [Resources & References](#resources)

---

## Introduction to VS Code Extensions {#introduction}

### What is a VS Code Extension?

A VS Code extension is a program that runs inside VS Code to add features, enhance functionality, or integrate with external tools. Extensions run in a separate Node.js process (the "extension host") and communicate with the VS Code UI through well-defined APIs.

### Why Build Extensions?

- **Customize your workflow**: Add features specific to your needs
- **Language support**: Add new programming languages
- **Tool integration**: Connect VS Code with external services
- **Theme customization**: Create custom color schemes
- **Productivity**: Automate repetitive tasks
- **Community**: Share tools with other developers

### Extension Capabilities

Extensions can:
- Add commands to the Command Palette
- Create custom UI components (views, panels, webviews)
- Add language features (syntax highlighting, IntelliSense, diagnostics)
- Modify the editor (decorations, hovers, code lenses)
- Integrate with debuggers
- Access the file system and workspace
- Make network requests
- Run background tasks

Extensions **cannot**:
- Modify VS Code's core UI directly
- Access DOM outside of webviews
- Run native code directly (must use child processes)
- Bypass VS Code's security model

---

## Architecture & Core Concepts {#architecture}

### Extension Host Process

VS Code runs extensions in a separate Node.js process called the "extension host". This architecture provides:

- **Stability**: Extension crashes don't crash VS Code
- **Security**: Extensions run in a sandboxed environment
- **Performance**: Heavy computations don't block the UI

```
┌─────────────────────────────────────┐
│   VS Code UI (Electron Renderer)   │
│   - Editor                          │
│   - Sidebar                         │
│   - Status Bar                      │
└──────────────┬──────────────────────┘
               │ IPC
┌──────────────▼──────────────────────┐
│   Extension Host (Node.js)          │
│   - Extension 1                     │
│   - Extension 2                     │
│   - Extension N                     │
└─────────────────────────────────────┘
```

### Extension Lifecycle

1. **Activation**: Extension is loaded when activation event occurs
2. **Execution**: Extension registers commands, providers, listeners
3. **Active**: Extension responds to events and user actions
4. **Deactivation**: Extension cleans up resources when VS Code closes

```typescript
// Entry point: activate()
export function activate(context: vscode.ExtensionContext) {
  // Called when extension is activated
  // Register commands, providers, listeners
  // Store disposables in context.subscriptions
}

// Exit point: deactivate()
export function deactivate() {
  // Called when extension is deactivated
  // Clean up resources
}
```

### Extension Context

The `ExtensionContext` object provides:

- **subscriptions**: Array to store disposables (auto-cleanup on deactivate)
- **extensionPath**: Absolute path to extension directory
- **globalState**: Persistent storage across sessions
- **workspaceState**: Persistent storage per workspace
- **secrets**: Secure credential storage
- **extensionUri**: URI of extension directory

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Store data globally
  await context.globalState.update('lastRun', Date.now());

  // Store data per workspace
  await context.workspaceState.update('projectId', '12345');

  // Store secrets securely
  await context.secrets.store('apiToken', 'secret-token');

  // Get extension path
  const configPath = path.join(context.extensionPath, 'config.json');
}
```

### Disposables

Disposables are objects that hold resources and must be disposed when no longer needed. VS Code automatically disposes all items in `context.subscriptions` when the extension deactivates.

```typescript
// Good: Register disposable in subscriptions
context.subscriptions.push(
  vscode.commands.registerCommand('myCommand', () => {})
);

// Bad: Not registered - will leak resources
vscode.commands.registerCommand('myCommand', () => {});
```

---

## Extension Manifest (package.json) {#manifest}

The `package.json` file is the extension manifest. It defines metadata, capabilities, and contributions.

### Required Fields

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "description": "A brief description",
  "version": "1.0.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.85.0"
  },
  "categories": ["Other"],
  "main": "./out/extension.js"
}
```

### Contribution Points

Contribution points define how your extension extends VS Code:

#### Commands

```json
{
  "contributes": {
    "commands": [
      {
        "command": "myExtension.helloWorld",
        "title": "Hello World",
        "category": "My Extension",
        "icon": "$(rocket)"
      }
    ]
  }
}
```

#### Configuration

```json
{
  "contributes": {
    "configuration": {
      "type": "object",
      "title": "My Extension",
      "properties": {
        "myExtension.enabled": {
          "type": "boolean",
          "default": true,
          "description": "Enable the extension",
          "scope": "resource"
        },
        "myExtension.maxItems": {
          "type": "number",
          "default": 100,
          "minimum": 1,
          "maximum": 1000,
          "description": "Maximum items to process"
        }
      }
    }
  }
}
```

**Configuration Scopes**:
- `application`: User settings only
- `machine`: User settings, not synced
- `window`: User or workspace settings
- `resource`: User, workspace, or folder settings
- `language-overridable`: Can be overridden per language

#### Keybindings

```json
{
  "contributes": {
    "keybindings": [
      {
        "command": "myExtension.helloWorld",
        "key": "ctrl+alt+h",
        "mac": "cmd+alt+h",
        "when": "editorTextFocus"
      }
    ]
  }
}
```

#### Menus

```json
{
  "contributes": {
    "menus": {
      "editor/context": [
        {
          "command": "myExtension.refactor",
          "when": "editorHasSelection",
          "group": "1_modification"
        }
      ],
      "explorer/context": [
        {
          "command": "myExtension.processFile",
          "when": "resourceExtname == .json"
        }
      ]
    }
  }
}
```

**Common Menu Locations**:
- `editor/context`: Editor right-click menu
- `editor/title`: Editor title bar
- `explorer/context`: File explorer right-click
- `view/title`: View title bar
- `commandPalette`: Command Palette (default for all commands)

#### Views

```json
{
  "contributes": {
    "viewsContainers": {
      "activitybar": [
        {
          "id": "myExtension-explorer",
          "title": "My Explorer",
          "icon": "resources/icon.svg"
        }
      ]
    },
    "views": {
      "myExtension-explorer": [
        {
          "id": "myExtension.treeView",
          "name": "My Tree View",
          "when": "workspaceFolderCount > 0"
        }
      ]
    }
  }
}
```

#### Languages

```json
{
  "contributes": {
    "languages": [
      {
        "id": "mylang",
        "aliases": ["MyLanguage", "mylang"],
        "extensions": [".ml"],
        "configuration": "./language-configuration.json"
      }
    ],
    "grammars": [
      {
        "language": "mylang",
        "scopeName": "source.mylang",
        "path": "./syntaxes/mylang.tmLanguage.json"
      }
    ]
  }
}
```

#### Themes

```json
{
  "contributes": {
    "themes": [
      {
        "label": "My Dark Theme",
        "uiTheme": "vs-dark",
        "path": "./themes/dark.json"
      }
    ],
    "iconThemes": [
      {
        "label": "My Icons",
        "id": "myIcons",
        "path": "./icons/icons.json"
      }
    ]
  }
}
```

---

## Activation Events {#activation-events}

Activation events determine when your extension loads. Choose the most specific event to minimize resource usage.

### Common Activation Events

```json
{
  "activationEvents": [
    // Activate on any file open
    "onStartupFinished",

    // Activate when specific command is invoked
    "onCommand:myExtension.helloWorld",

    // Activate when specific language is opened
    "onLanguage:javascript",

    // Activate when specific file type is opened
    "onFileSystem:sftp",

    // Activate when specific view is opened
    "onView:myExtension.treeView",

    // Activate when specific debug type starts
    "onDebug",

    // Activate when any debug session starts
    "onDebugInitialConfigurations",

    // Activate when specific task type is run
    "onTaskType:npm",

    // Activate when URI scheme is used
    "onUri",

    // Activate on specific custom event
    "onCustomEditor:catCustoms.catScratch",

    // Activate when VS Code starts (use sparingly!)
    "*"
  ]
}
```

### Best Practices for Activation

1. **Use specific events**: Prefer `onCommand` over `onStartupFinished`
2. **Lazy loading**: Don't use `*` unless absolutely necessary
3. **onStartupFinished**: Better than `*` for general startup activation
4. **Multiple events**: Use multiple specific events rather than one broad event

```json
// Good: Specific events
{
  "activationEvents": [
    "onCommand:myExtension.start",
    "onLanguage:python",
    "onView:myExtension.sidebar"
  ]
}

// Bad: Activates on every VS Code start
{
  "activationEvents": ["*"]
}
```

---

## Extension API {#extension-api}

The VS Code API is exposed through the `vscode` module. All APIs are TypeScript-friendly with full type definitions.

### Namespaces

The API is organized into namespaces:

- `vscode.commands`: Command execution and registration
- `vscode.window`: Window UI (messages, inputs, editors)
- `vscode.workspace`: Workspace management (files, folders, config)
- `vscode.languages`: Language features (diagnostics, completion, hover)
- `vscode.debug`: Debugger integration
- `vscode.tasks`: Task execution
- `vscode.extensions`: Extension management
- `vscode.env`: Environment information
- `vscode.scm`: Source control management
- `vscode.tests`: Test API

### Commands

```typescript
// Register a command
const disposable = vscode.commands.registerCommand(
  'myExtension.helloWorld',
  () => {
    vscode.window.showInformationMessage('Hello World!');
  }
);

// Execute a command
await vscode.commands.executeCommand('workbench.action.files.save');

// Execute with arguments
await vscode.commands.executeCommand('editor.action.insertSnippet', {
  snippet: 'console.log($1);'
});

// Get all commands
const commands = await vscode.commands.getCommands();
```

### Window API

```typescript
// Show messages
vscode.window.showInformationMessage('Success!');
vscode.window.showWarningMessage('Warning!');
vscode.window.showErrorMessage('Error!');

// Show message with actions
const selection = await vscode.window.showInformationMessage(
  'Do you want to continue?',
  'Yes',
  'No'
);

if (selection === 'Yes') {
  // User clicked Yes
}

// Show input box
const name = await vscode.window.showInputBox({
  prompt: 'Enter your name',
  placeHolder: 'John Doe',
  validateInput: (value) => {
    return value.length < 3 ? 'Name too short' : null;
  }
});

// Show quick pick
const item = await vscode.window.showQuickPick(
  ['Option 1', 'Option 2', 'Option 3'],
  {
    placeHolder: 'Select an option',
    canPickMany: false
  }
);

// Show progress
await vscode.window.withProgress(
  {
    location: vscode.ProgressLocation.Notification,
    title: 'Processing...',
    cancellable: true
  },
  async (progress, token) => {
    token.onCancellationRequested(() => {
      console.log('User cancelled');
    });

    progress.report({ increment: 0, message: 'Starting...' });

    for (let i = 0; i < 100; i++) {
      if (token.isCancellationRequested) break;

      await sleep(50);
      progress.report({
        increment: 1,
        message: `${i + 1}% complete`
      });
    }
  }
);

// Active text editor
const editor = vscode.window.activeTextEditor;
if (editor) {
  const document = editor.document;
  const selection = editor.selection;
  const text = document.getText(selection);
}

// All visible editors
const editors = vscode.window.visibleTextEditors;
```

### Workspace API

```typescript
// Get workspace folders
const folders = vscode.workspace.workspaceFolders;

// Get configuration
const config = vscode.workspace.getConfiguration('myExtension');
const enabled = config.get<boolean>('enabled', true);

// Update configuration
await config.update('enabled', false, vscode.ConfigurationTarget.Global);

// Watch files
const watcher = vscode.workspace.createFileSystemWatcher('**/*.js');
watcher.onDidCreate(uri => console.log('Created:', uri));
watcher.onDidChange(uri => console.log('Changed:', uri));
watcher.onDidDelete(uri => console.log('Deleted:', uri));

// Open text document
const doc = await vscode.workspace.openTextDocument('/path/to/file.txt');

// Find files
const files = await vscode.workspace.findFiles('**/*.ts', '**/node_modules/**');

// Read file
const uri = vscode.Uri.file('/path/to/file.txt');
const content = await vscode.workspace.fs.readFile(uri);

// Write file
const encoder = new TextEncoder();
await vscode.workspace.fs.writeFile(uri, encoder.encode('Hello World'));

// Listen to configuration changes
vscode.workspace.onDidChangeConfiguration(e => {
  if (e.affectsConfiguration('myExtension.enabled')) {
    // Configuration changed
  }
});

// Listen to text document changes
vscode.workspace.onDidChangeTextDocument(e => {
  console.log('Document changed:', e.document.uri);
});
```

### Languages API

```typescript
// Register completion provider
vscode.languages.registerCompletionItemProvider('javascript', {
  provideCompletionItems(document, position, token, context) {
    const item = new vscode.CompletionItem('myFunction');
    item.kind = vscode.CompletionItemKind.Function;
    item.detail = 'My custom function';
    item.documentation = new vscode.MarkdownString('**Documentation**');
    item.insertText = new vscode.SnippetString('myFunction($1)');

    return [item];
  }
}, '.'); // Trigger on '.'

// Register hover provider
vscode.languages.registerHoverProvider('javascript', {
  provideHover(document, position, token) {
    const range = document.getWordRangeAtPosition(position);
    const word = document.getText(range);

    const markdown = new vscode.MarkdownString();
    markdown.appendCodeblock(`function ${word}()`, 'javascript');
    markdown.appendText('Hover information for ' + word);

    return new vscode.Hover(markdown);
  }
});

// Create diagnostics
const diagnostics = vscode.languages.createDiagnosticCollection('myExtension');

function updateDiagnostics(document: vscode.TextDocument) {
  const diags: vscode.Diagnostic[] = [];

  const text = document.getText();
  const regex = /TODO/g;
  let match;

  while ((match = regex.exec(text))) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);

    const diagnostic = new vscode.Diagnostic(
      range,
      'TODO found in code',
      vscode.DiagnosticSeverity.Warning
    );

    diags.push(diagnostic);
  }

  diagnostics.set(document.uri, diags);
}

// Register definition provider
vscode.languages.registerDefinitionProvider('javascript', {
  provideDefinition(document, position, token) {
    // Return location of definition
    return new vscode.Location(
      vscode.Uri.file('/path/to/definition.js'),
      new vscode.Position(10, 5)
    );
  }
});

// Register code action provider
vscode.languages.registerCodeActionsProvider('javascript', {
  provideCodeActions(document, range, context, token) {
    const actions: vscode.CodeAction[] = [];

    for (const diagnostic of context.diagnostics) {
      const action = new vscode.CodeAction(
        'Fix this issue',
        vscode.CodeActionKind.QuickFix
      );

      action.edit = new vscode.WorkspaceEdit();
      action.edit.replace(document.uri, diagnostic.range, 'fixed');

      actions.push(action);
    }

    return actions;
  }
});
```

### Text Editor Decorations

```typescript
// Define decoration type
const decorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: 'rgba(255, 0, 0, 0.3)',
  border: '2px solid red',
  borderRadius: '3px',
  cursor: 'pointer',
  isWholeLine: true,
  overviewRulerColor: 'red',
  overviewRulerLane: vscode.OverviewRulerLane.Full,
  light: {
    backgroundColor: 'rgba(255, 0, 0, 0.1)'
  },
  dark: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)'
  }
});

// Apply decorations
const editor = vscode.window.activeTextEditor;
if (editor) {
  const ranges = [
    new vscode.Range(0, 0, 0, 10),
    new vscode.Range(2, 5, 2, 15)
  ];

  editor.setDecorations(decorationType, ranges);
}

// Clear decorations
editor.setDecorations(decorationType, []);

// Dispose decoration type when done
decorationType.dispose();
```

### Tree Views

```typescript
class MyTreeDataProvider implements vscode.TreeDataProvider<MyItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<MyItem | undefined>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  refresh(): void {
    this._onDidChangeTreeData.fire(undefined);
  }

  getTreeItem(element: MyItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: MyItem): Thenable<MyItem[]> {
    if (!element) {
      // Root items
      return Promise.resolve([
        new MyItem('Item 1', vscode.TreeItemCollapsibleState.None),
        new MyItem('Item 2', vscode.TreeItemCollapsibleState.Collapsed)
      ]);
    } else {
      // Children of element
      return Promise.resolve([]);
    }
  }
}

class MyItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);

    this.tooltip = `Tooltip for ${label}`;
    this.description = 'Description';
    this.iconPath = new vscode.ThemeIcon('folder');
    this.command = {
      command: 'myExtension.itemClicked',
      title: 'Click Item',
      arguments: [this]
    };
  }
}

// Register tree view
const treeDataProvider = new MyTreeDataProvider();
vscode.window.createTreeView('myExtension.treeView', {
  treeDataProvider
});
```

### Webviews

```typescript
function createWebview(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      retainContextWhenHidden: true,
      localResourceRoots: [context.extensionUri]
    }
  );

  // Set HTML content
  panel.webview.html = getWebviewContent(panel.webview, context.extensionUri);

  // Handle messages from webview
  panel.webview.onDidReceiveMessage(
    message => {
      switch (message.command) {
        case 'alert':
          vscode.window.showInformationMessage(message.text);
          return;
      }
    },
    undefined,
    context.subscriptions
  );

  // Send message to webview
  panel.webview.postMessage({ command: 'update', data: 'Hello' });
}

function getWebviewContent(webview: vscode.Webview, extensionUri: vscode.Uri) {
  const scriptUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'script.js')
  );

  const styleUri = webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'media', 'style.css')
  );

  return `<!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <link href="${styleUri}" rel="stylesheet">
    </head>
    <body>
      <h1>My Webview</h1>
      <button id="btn">Click Me</button>
      <script src="${scriptUri}"></script>
    </body>
    </html>`;
}
```

---

## Common Extension Types {#extension-types}

### 1. Language Extensions

Provide language support including syntax highlighting, IntelliSense, and diagnostics.

**Key APIs**:
- `languages.registerCompletionItemProvider`
- `languages.registerHoverProvider`
- `languages.registerDefinitionProvider`
- `languages.registerDocumentFormattingEditProvider`
- `languages.createDiagnosticCollection`

**Example: Simple formatter**

```typescript
vscode.languages.registerDocumentFormattingEditProvider('javascript', {
  provideDocumentFormattingEdits(document) {
    const edits: vscode.TextEdit[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const trimmed = line.text.trim();

      if (line.text !== trimmed) {
        edits.push(vscode.TextEdit.replace(line.range, trimmed));
      }
    }

    return edits;
  }
});
```

### 2. Theme Extensions

Customize VS Code's appearance with color themes and icon themes.

**Color Theme Structure**:

```json
{
  "name": "My Dark Theme",
  "type": "dark",
  "colors": {
    "editor.background": "#1e1e1e",
    "editor.foreground": "#d4d4d4",
    "activityBar.background": "#2d2d30",
    "statusBar.background": "#007acc"
  },
  "tokenColors": [
    {
      "scope": ["comment"],
      "settings": {
        "foreground": "#6A9955",
        "fontStyle": "italic"
      }
    },
    {
      "scope": ["keyword"],
      "settings": {
        "foreground": "#569CD6"
      }
    }
  ]
}
```

### 3. Debugger Extensions

Integrate debuggers for languages.

**Debug Configuration**:

```json
{
  "contributes": {
    "debuggers": [
      {
        "type": "myDebugger",
        "label": "My Debugger",
        "program": "./out/debugAdapter.js",
        "runtime": "node",
        "configurationAttributes": {
          "launch": {
            "required": ["program"],
            "properties": {
              "program": {
                "type": "string",
                "description": "Path to program"
              }
            }
          }
        }
      }
    ]
  }
}
```

### 4. Snippet Extensions

Provide code snippets for faster development.

**Snippet Format**:

```json
{
  "For Loop": {
    "prefix": "for",
    "body": [
      "for (let ${1:i} = 0; ${1:i} < ${2:array}.length; ${1:i}++) {",
      "\t$0",
      "}"
    ],
    "description": "For loop"
  },
  "Console Log": {
    "prefix": "log",
    "body": "console.log($1);$0",
    "description": "Log to console"
  }
}
```

### 5. Linter/Formatter Extensions

Analyze and format code.

**Example: Basic linter**

```typescript
const diagnostics = vscode.languages.createDiagnosticCollection('myLinter');

function lint(document: vscode.TextDocument) {
  const diags: vscode.Diagnostic[] = [];
  const text = document.getText();

  // Find console.log statements
  const regex = /console\.log/g;
  let match;

  while ((match = regex.exec(text))) {
    const startPos = document.positionAt(match.index);
    const endPos = document.positionAt(match.index + match[0].length);
    const range = new vscode.Range(startPos, endPos);

    const diagnostic = new vscode.Diagnostic(
      range,
      'Avoid using console.log in production',
      vscode.DiagnosticSeverity.Warning
    );

    diagnostic.code = 'no-console';
    diagnostic.source = 'myLinter';

    diags.push(diagnostic);
  }

  diagnostics.set(document.uri, diags);
}

// Lint on open and change
vscode.workspace.onDidOpenTextDocument(lint);
vscode.workspace.onDidChangeTextDocument(e => lint(e.document));
```

### 6. SCM Provider Extensions

Integrate source control systems.

**Example: Basic SCM provider**

```typescript
const scm = vscode.scm.createSourceControl('myScm', 'My SCM');

scm.inputBox.placeholder = 'Commit message';
scm.inputBox.value = '';

scm.acceptInputCommand = {
  command: 'myScm.commit',
  title: 'Commit',
  arguments: [scm]
};

const changes = scm.createResourceGroup('changes', 'Changes');
changes.resourceStates = [
  {
    resourceUri: vscode.Uri.file('/path/to/file.txt'),
    decorations: {
      strikeThrough: false,
      tooltip: 'Modified'
    }
  }
];
```

---

## Testing & Quality Assurance {#testing}

### Testing Framework

VS Code extensions use Mocha for testing with `@vscode/test-electron` for integration tests.

**Test Structure**:

```
src/
  test/
    suite/
      extension.test.ts    # Integration tests
      index.ts            # Test suite entry
    runTest.ts           # Test runner
```

**Test Runner (runTest.ts)**:

```typescript
import * as path from 'path';
import { runTests } from '@vscode/test-electron';

async function main() {
  try {
    const extensionDevelopmentPath = path.resolve(__dirname, '../../');
    const extensionTestsPath = path.resolve(__dirname, './suite/index');

    await runTests({
      extensionDevelopmentPath,
      extensionTestsPath
    });
  } catch (err) {
    console.error('Failed to run tests');
    process.exit(1);
  }
}

main();
```

**Test Suite (suite/index.ts)**:

```typescript
import * as path from 'path';
import Mocha from 'mocha';
import * as glob from 'glob';

export async function run(): Promise<void> {
  const mocha = new Mocha({
    ui: 'tdd',
    color: true,
    timeout: 20000
  });

  const testsRoot = path.resolve(__dirname, '..');

  return new Promise((resolve, reject) => {
    glob.glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
      if (err) return reject(err);

      files.forEach(f => mocha.addFile(path.resolve(testsRoot, f)));

      try {
        mocha.run(failures => {
          if (failures > 0) {
            reject(new Error(`${failures} tests failed.`));
          } else {
            resolve();
          }
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}
```

**Test File (extension.test.ts)**:

```typescript
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Extension Test Suite', () => {
  vscode.window.showInformationMessage('Start all tests.');

  test('Sample test', () => {
    assert.strictEqual(-1, [1, 2, 3].indexOf(5));
    assert.strictEqual(-1, [1, 2, 3].indexOf(0));
  });

  test('Extension should be present', () => {
    assert.ok(vscode.extensions.getExtension('publisher.extension-name'));
  });

  test('Should activate', async () => {
    const ext = vscode.extensions.getExtension('publisher.extension-name');
    await ext?.activate();
    assert.strictEqual(ext?.isActive, true);
  });

  test('Command should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    assert.ok(commands.includes('extension.helloWorld'));
  });
});
```

### Code Coverage

Use `c8` for code coverage:

```json
{
  "scripts": {
    "test": "vscode-test",
    "coverage": "c8 --reporter=html --reporter=text npm test"
  }
}
```

**Coverage Configuration (.c8rc.json)**:

```json
{
  "all": true,
  "include": ["out/**/*.js"],
  "exclude": ["out/test/**"],
  "reporter": ["text", "html", "lcov"],
  "check-coverage": true,
  "lines": 70,
  "functions": 70,
  "branches": 70,
  "statements": 70
}
```

### Unit Tests vs Integration Tests

**Unit Tests**:
- Test individual functions/classes in isolation
- No VS Code API required
- Fast execution
- Use standard Node.js test frameworks

```typescript
// unit.test.ts (no VS Code API)
import * as assert from 'assert';
import { parseConfig } from '../config';

suite('Config Parser', () => {
  test('Should parse valid config', () => {
    const result = parseConfig({ enabled: true });
    assert.strictEqual(result.enabled, true);
  });

  test('Should throw on invalid config', () => {
    assert.throws(() => parseConfig(null));
  });
});
```

**Integration Tests**:
- Test extension behavior with VS Code
- Require VS Code instance
- Slower execution
- Use `@vscode/test-electron`

```typescript
// integration.test.ts (with VS Code API)
import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Integration Tests', () => {
  test('Should create text document', async () => {
    const doc = await vscode.workspace.openTextDocument({
      content: 'Hello World',
      language: 'plaintext'
    });

    assert.strictEqual(doc.lineCount, 1);
    assert.strictEqual(doc.getText(), 'Hello World');
  });
});
```

---

## Build & Development Workflow {#build-workflow}

### TypeScript Configuration

**tsconfig.json**:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "lib": ["ES2020"],
    "outDir": "out",
    "rootDir": "src",
    "sourceMap": true,
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "moduleResolution": "node"
  },
  "include": ["src"],
  "exclude": ["node_modules", ".vscode-test"]
}
```

### ESLint Configuration

**.eslintrc.json**:

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended"
  ],
  "rules": {
    "@typescript-eslint/naming-convention": "warn",
    "@typescript-eslint/semi": "warn",
    "curly": "warn",
    "eqeqeq": "warn",
    "no-throw-literal": "warn"
  },
  "ignorePatterns": ["out", "dist", "**/*.d.ts"]
}
```

### Prettier Configuration

**.prettierrc.json**:

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

### Development Scripts

**package.json**:

```json
{
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "pretest": "npm run compile && npm run lint",
    "test": "vscode-test",
    "lint": "eslint src --ext ts",
    "lint:fix": "eslint src --ext ts --fix",
    "format": "prettier --write \"src/**/*.ts\"",
    "package": "vsce package",
    "publish": "vsce publish"
  }
}
```

### Launch Configuration

**.vscode/launch.json**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/out/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/out/test/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/out/test/**/*.js"],
      "preLaunchTask": "${defaultBuildTask}"
    }
  ]
}
```

### Tasks Configuration

**.vscode/tasks.json**:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "type": "npm",
      "script": "watch",
      "problemMatcher": "$tsc-watch",
      "isBackground": true,
      "presentation": {
        "reveal": "never"
      },
      "group": {
        "kind": "build",
        "isDefault": true
      }
    },
    {
      "type": "npm",
      "script": "compile",
      "problemMatcher": "$tsc",
      "group": "build"
    }
  ]
}
```

---

## Publishing & Distribution {#publishing}

### Prerequisites

1. **Publisher Account**: Create at https://marketplace.visualstudio.com/manage
2. **Personal Access Token (PAT)**: Generate from Azure DevOps
3. **vsce Tool**: `npm install -g @vscode/vsce`

### Package Validation

Before publishing, validate your package:

```bash
# Check package
vsce ls

# Package as .vsix
vsce package

# Test .vsix locally
code --install-extension my-extension-1.0.0.vsix
```

### Publishing Manually

```bash
# Login
vsce login your-publisher-name

# Publish
vsce publish

# Publish with specific version
vsce publish minor  # 1.0.0 -> 1.1.0
vsce publish major  # 1.0.0 -> 2.0.0
vsce publish patch  # 1.0.0 -> 1.0.1
vsce publish 2.0.1  # Specific version
```

### Publishing with CI/CD

**GitHub Actions (.github/workflows/release.yml)**:

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Package extension
        run: npm run package

      - name: Publish to Marketplace
        run: npx vsce publish -p ${{ secrets.VSCE_PAT }}
        env:
          VSCE_PAT: ${{ secrets.VSCE_PAT }}

      - name: Create GitHub Release
        uses: softprops/action-gh-release@v1
        with:
          files: '*.vsix'
```

### .vscodeignore

Control which files are packaged:

```
.vscode/**
.vscode-test/**
src/**
.gitignore
.eslintrc.json
.prettierrc.json
tsconfig.json
vsc-extension-quickstart.md
**/tsconfig.json
**/.eslintrc.json
**/*.map
**/*.ts
!out/**/*.js
```

### Version Management

Follow Semantic Versioning (semver):

- **MAJOR**: Breaking changes (1.0.0 -> 2.0.0)
- **MINOR**: New features (1.0.0 -> 1.1.0)
- **PATCH**: Bug fixes (1.0.0 -> 1.0.1)

**Automated Versioning**:

Use semantic-release for automated versioning based on commit messages:

```json
{
  "devDependencies": {
    "semantic-release": "^21.0.0",
    "semantic-release-vsce": "^5.0.0"
  }
}
```

**release.config.js**:

```javascript
module.exports = {
  branches: ['main'],
  plugins: [
    '@semantic-release/commit-analyzer',
    '@semantic-release/release-notes-generator',
    '@semantic-release/changelog',
    [
      'semantic-release-vsce',
      {
        packageVsix: true
      }
    ],
    [
      '@semantic-release/github',
      {
        assets: [{ path: '*.vsix', label: 'VS Code Extension' }]
      }
    ]
  ]
};
```

---

## Best Practices & Patterns {#best-practices}

### 1. Resource Management

Always dispose resources:

```typescript
export function activate(context: vscode.ExtensionContext) {
  // Good: Registered in subscriptions
  context.subscriptions.push(
    vscode.commands.registerCommand('cmd', () => {})
  );

  // Good: Manual tracking
  const disposable = vscode.window.onDidChangeActiveTextEditor(() => {});
  context.subscriptions.push(disposable);

  // Good: Class implementing Disposable
  const provider = new MyProvider();
  context.subscriptions.push(provider);
}

class MyProvider implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeTextDocument(this.onDocChange)
    );
  }

  dispose() {
    this.disposables.forEach(d => d.dispose());
  }
}
```

### 2. Error Handling

Handle errors gracefully:

```typescript
async function myCommand() {
  try {
    const result = await riskyOperation();
    vscode.window.showInformationMessage('Success!');
  } catch (error) {
    // Log error for debugging
    console.error('Error in myCommand:', error);

    // Show user-friendly message
    vscode.window.showErrorMessage(
      'Operation failed: ' + (error instanceof Error ? error.message : 'Unknown error')
    );
  }
}
```

### 3. Configuration Management

```typescript
class ConfigManager {
  private readonly namespace = 'myExtension';

  get<T>(key: string, defaultValue: T): T {
    const config = vscode.workspace.getConfiguration(this.namespace);
    return config.get<T>(key, defaultValue);
  }

  async update(key: string, value: any, target?: vscode.ConfigurationTarget) {
    const config = vscode.workspace.getConfiguration(this.namespace);
    await config.update(key, value, target);
  }

  onDidChange(handler: () => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration(e => {
      if (e.affectsConfiguration(this.namespace)) {
        handler();
      }
    });
  }
}
```

### 4. Async/Await Patterns

Prefer async/await over promises:

```typescript
// Good
async function loadData() {
  try {
    const data = await fetchData();
    const processed = await processData(data);
    return processed;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// Less readable
function loadData() {
  return fetchData()
    .then(data => processData(data))
    .catch(error => {
      console.error(error);
      throw error;
    });
}
```

### 5. Cancellation Tokens

Support cancellation for long operations:

```typescript
async function longOperation(token: vscode.CancellationToken) {
  for (let i = 0; i < 1000; i++) {
    if (token.isCancellationRequested) {
      throw new Error('Operation cancelled');
    }

    await processItem(i);
  }
}

// Usage with progress
vscode.window.withProgress(
  {
    location: vscode.ProgressLocation.Notification,
    cancellable: true
  },
  async (progress, token) => {
    await longOperation(token);
  }
);
```

### 6. Debouncing

Debounce frequent events:

```typescript
class DocumentListener {
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly DEBOUNCE_MS = 500;

  onDocumentChange(document: vscode.TextDocument) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      this.processDocument(document);
    }, this.DEBOUNCE_MS);
  }

  dispose() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
  }
}
```

### 7. State Management

Use context state for persistence:

```typescript
class StateManager {
  constructor(private context: vscode.ExtensionContext) {}

  // Global state (across workspaces)
  async setGlobal<T>(key: string, value: T): Promise<void> {
    await this.context.globalState.update(key, value);
  }

  getGlobal<T>(key: string, defaultValue?: T): T | undefined {
    return this.context.globalState.get<T>(key, defaultValue);
  }

  // Workspace state (per workspace)
  async setWorkspace<T>(key: string, value: T): Promise<void> {
    await this.context.workspaceState.update(key, value);
  }

  getWorkspace<T>(key: string, defaultValue?: T): T | undefined {
    return this.context.workspaceState.get<T>(key, defaultValue);
  }

  // Secrets (encrypted storage)
  async setSecret(key: string, value: string): Promise<void> {
    await this.context.secrets.store(key, value);
  }

  async getSecret(key: string): Promise<string | undefined> {
    return await this.context.secrets.get(key);
  }
}
```

### 8. Extension Dependencies

Declare and check dependencies:

```json
{
  "extensionDependencies": [
    "vscode.git"
  ],
  "extensionPack": [
    "publisher.extension1",
    "publisher.extension2"
  ]
}
```

```typescript
function checkDependency(extensionId: string): boolean {
  const extension = vscode.extensions.getExtension(extensionId);

  if (!extension) {
    vscode.window.showErrorMessage(
      `Required extension ${extensionId} is not installed.`
    );
    return false;
  }

  if (!extension.isActive) {
    extension.activate();
  }

  return true;
}
```

---

## Performance & Optimization {#performance}

### 1. Lazy Activation

Choose specific activation events:

```json
// Good: Specific events
{
  "activationEvents": [
    "onCommand:myExtension.command",
    "onLanguage:python"
  ]
}

// Bad: Activates on startup
{
  "activationEvents": ["*"]
}
```

### 2. Async Loading

Load heavy dependencies asynchronously:

```typescript
// Don't import heavy modules at top level
// import * as heavyModule from 'heavy-module'; // Bad

export function activate(context: vscode.ExtensionContext) {
  // Good: Lazy load when needed
  context.subscriptions.push(
    vscode.commands.registerCommand('cmd', async () => {
      const heavyModule = await import('heavy-module');
      heavyModule.doWork();
    })
  );
}
```

### 3. Caching

Cache expensive computations:

```typescript
class CachedProvider {
  private cache = new Map<string, any>();

  async getData(key: string): Promise<any> {
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    const data = await expensiveComputation(key);
    this.cache.set(key, data);
    return data;
  }

  invalidate(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}
```

### 4. Incremental Processing

Process data incrementally:

```typescript
async function processLargeFile(uri: vscode.Uri) {
  const content = await vscode.workspace.fs.readFile(uri);
  const text = new TextDecoder().decode(content);
  const lines = text.split('\n');

  const CHUNK_SIZE = 1000;

  for (let i = 0; i < lines.length; i += CHUNK_SIZE) {
    const chunk = lines.slice(i, i + CHUNK_SIZE);
    await processChunk(chunk);

    // Allow other operations to run
    await new Promise(resolve => setImmediate(resolve));
  }
}
```

### 5. Worker Threads

Use worker threads for CPU-intensive tasks:

```typescript
import { Worker } from 'worker_threads';

function runWorker(data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const worker = new Worker('./worker.js', {
      workerData: data
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}
```

### 6. Memory Management

Avoid memory leaks:

```typescript
class LeakFreeProvider implements vscode.Disposable {
  private listeners: vscode.Disposable[] = [];
  private data = new Map<string, any>();

  constructor() {
    // Track all disposables
    this.listeners.push(
      vscode.workspace.onDidChangeTextDocument(this.onDocChange)
    );
  }

  private onDocChange = (e: vscode.TextDocumentChangeEvent) => {
    // Use arrow function or bind to avoid memory leaks
    this.processChange(e);
  };

  dispose() {
    // Clean up all listeners
    this.listeners.forEach(d => d.dispose());
    this.listeners = [];

    // Clear data
    this.data.clear();
  }
}
```

---

## Security Considerations {#security}

### 1. Input Validation

Validate all user inputs:

```typescript
async function processUserInput() {
  const input = await vscode.window.showInputBox({
    prompt: 'Enter file path',
    validateInput: (value) => {
      // Validate path
      if (!value || value.trim().length === 0) {
        return 'Path cannot be empty';
      }

      // Check for path traversal
      if (value.includes('..')) {
        return 'Invalid path';
      }

      // Validate file extension
      if (!value.endsWith('.json')) {
        return 'Only JSON files allowed';
      }

      return null;
    }
  });

  if (!input) return;

  // Sanitize input
  const sanitized = sanitizePath(input);

  // Use sanitized input
  await processFile(sanitized);
}

function sanitizePath(path: string): string {
  // Remove dangerous characters
  return path.replace(/[^a-zA-Z0-9._/-]/g, '');
}
```

### 2. Credential Storage

Use VS Code's secret storage:

```typescript
class CredentialManager {
  constructor(private context: vscode.ExtensionContext) {}

  async saveToken(service: string, token: string) {
    const key = `${service}.token`;
    await this.context.secrets.store(key, token);
  }

  async getToken(service: string): Promise<string | undefined> {
    const key = `${service}.token`;
    return await this.context.secrets.get(key);
  }

  async deleteToken(service: string) {
    const key = `${service}.token`;
    await this.context.secrets.delete(key);
  }
}

// Never do this:
// const API_KEY = 'hardcoded-secret'; // BAD!
```

### 3. Command Injection Prevention

Sanitize commands and arguments:

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function runCommand(userInput: string) {
  // BAD: Direct command execution
  // await execAsync(`git commit -m "${userInput}"`); // Vulnerable!

  // GOOD: Use array syntax or escape properly
  const { spawn } = require('child_process');

  const child = spawn('git', ['commit', '-m', userInput]);

  return new Promise((resolve, reject) => {
    child.on('close', code => {
      if (code === 0) resolve(code);
      else reject(new Error(`Command failed with code ${code}`));
    });
  });
}
```

### 4. HTTPS for Network Requests

Always use HTTPS:

```typescript
import * as https from 'https';

async function fetchData(url: string): Promise<any> {
  // Validate URL is HTTPS
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed');
  }

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
      res.on('error', reject);
    });
  });
}
```

### 5. Webview Security

Secure webviews properly:

```typescript
function createSecureWebview(context: vscode.ExtensionContext) {
  const panel = vscode.window.createWebviewPanel(
    'myWebview',
    'My Webview',
    vscode.ViewColumn.One,
    {
      // Enable scripts only if needed
      enableScripts: true,

      // Restrict resource loading
      localResourceRoots: [
        vscode.Uri.joinPath(context.extensionUri, 'media')
      ],

      // Enable command URIs
      enableCommandUris: false
    }
  );

  // Use nonce for inline scripts
  const nonce = getNonce();

  panel.webview.html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta http-equiv="Content-Security-Policy"
            content="default-src 'none';
                     script-src 'nonce-${nonce}';
                     style-src ${panel.webview.cspSource} 'unsafe-inline';
                     img-src ${panel.webview.cspSource} https:;">
    </head>
    <body>
      <script nonce="${nonce}">
        // Secure script
      </script>
    </body>
    </html>
  `;
}

function getNonce() {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
```

### 6. Dependency Security

Keep dependencies updated:

```bash
# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix

# Update dependencies
npm update
```

**Use Dependabot**:

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

---

## Advanced Topics {#advanced-topics}

### Custom Editors

Create custom editors for specific file types:

```typescript
class MyCustomEditor implements vscode.CustomTextEditorProvider {
  public static register(context: vscode.ExtensionContext): vscode.Disposable {
    const provider = new MyCustomEditor(context);
    return vscode.window.registerCustomEditorProvider(
      'myExtension.customEditor',
      provider
    );
  }

  constructor(private context: vscode.ExtensionContext) {}

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
    token: vscode.CancellationToken
  ): Promise<void> {
    // Set up webview
    webviewPanel.webview.options = {
      enableScripts: true
    };

    webviewPanel.webview.html = this.getHtmlForWebview(webviewPanel.webview);

    // Handle updates from webview
    webviewPanel.webview.onDidReceiveMessage(async e => {
      switch (e.type) {
        case 'update':
          await this.updateDocument(document, e.content);
          break;
      }
    });

    // Handle document changes
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(e => {
      if (e.document.uri.toString() === document.uri.toString()) {
        webviewPanel.webview.postMessage({
          type: 'update',
          content: document.getText()
        });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose();
    });
  }

  private async updateDocument(document: vscode.TextDocument, content: string) {
    const edit = new vscode.WorkspaceEdit();
    edit.replace(
      document.uri,
      new vscode.Range(0, 0, document.lineCount, 0),
      content
    );
    await vscode.workspace.applyEdit(edit);
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <textarea id="content"></textarea>
        <script>
          const vscode = acquireVsCodeApi();
          const textarea = document.getElementById('content');

          textarea.addEventListener('input', () => {
            vscode.postMessage({
              type: 'update',
              content: textarea.value
            });
          });

          window.addEventListener('message', event => {
            const message = event.data;
            if (message.type === 'update') {
              textarea.value = message.content;
            }
          });
        </script>
      </body>
      </html>`;
  }
}
```

### Language Server Protocol (LSP)

Implement language servers using LSP:

```typescript
import {
  createConnection,
  TextDocuments,
  ProposedFeatures,
  InitializeParams,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams
} from 'vscode-languageserver/node';

import { TextDocument } from 'vscode-languageserver-textdocument';

// Create connection
const connection = createConnection(ProposedFeatures.all);

// Create document manager
const documents = new TextDocuments(TextDocument);

connection.onInitialize((params: InitializeParams) => {
  return {
    capabilities: {
      textDocumentSync: documents.syncKind,
      completionProvider: {
        resolveProvider: true
      }
    }
  };
});

connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
    return [
      {
        label: 'TypeScript',
        kind: CompletionItemKind.Text,
        data: 1
      },
      {
        label: 'JavaScript',
        kind: CompletionItemKind.Text,
        data: 2
      }
    ];
  }
);

documents.listen(connection);
connection.listen();
```

### Multi-Root Workspace Support

Support multi-root workspaces:

```typescript
function getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined {
  return vscode.workspace.getWorkspaceFolder(uri);
}

function getAllWorkspaceFolders(): readonly vscode.WorkspaceFolder[] | undefined {
  return vscode.workspace.workspaceFolders;
}

// Listen to workspace folder changes
vscode.workspace.onDidChangeWorkspaceFolders(e => {
  e.added.forEach(folder => {
    console.log('Added:', folder.uri.fsPath);
  });

  e.removed.forEach(folder => {
    console.log('Removed:', folder.uri.fsPath);
  });
});
```

### Remote Development

Support remote development (SSH, Containers, WSL):

```typescript
// Check if running remotely
const isRemote = vscode.env.remoteName !== undefined;

// Get remote name
const remoteName = vscode.env.remoteName; // 'ssh-remote', 'wsl', 'container'

// Extension kind
// In package.json:
{
  "extensionKind": [
    "workspace"  // Runs in remote workspace
    // or "ui"   // Runs in local UI
    // or both
  ]
}
```

### Code Actions (Refactorings)

Provide code actions and refactorings:

```typescript
vscode.languages.registerCodeActionsProvider('javascript', {
  provideCodeActions(document, range, context) {
    const actions: vscode.CodeAction[] = [];

    // Add refactoring action
    const refactor = new vscode.CodeAction(
      'Extract to function',
      vscode.CodeActionKind.Refactor
    );

    refactor.edit = new vscode.WorkspaceEdit();
    refactor.edit.replace(
      document.uri,
      range,
      'extractedFunction()'
    );

    actions.push(refactor);

    // Add quick fix for diagnostic
    for (const diagnostic of context.diagnostics) {
      const fix = new vscode.CodeAction(
        'Fix issue',
        vscode.CodeActionKind.QuickFix
      );

      fix.diagnostics = [diagnostic];
      fix.edit = new vscode.WorkspaceEdit();
      // ... apply fix

      actions.push(fix);
    }

    return actions;
  }
}, {
  providedCodeActionKinds: [
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.QuickFix
  ]
});
```

---

## Resources & References {#resources}

### Official Documentation

- **VS Code API**: https://code.visualstudio.com/api
- **Extension Guides**: https://code.visualstudio.com/api/extension-guides/overview
- **Extension Samples**: https://github.com/microsoft/vscode-extension-samples
- **API Reference**: https://code.visualstudio.com/api/references/vscode-api

### Tools

- **Yeoman Generator**: `npm install -g yo generator-code`
- **VSCE**: `npm install -g @vscode/vsce`
- **Extension Test Runner**: `@vscode/test-electron`

### Testing

- **Mocha**: https://mochajs.org/
- **VS Code Test CLI**: https://github.com/microsoft/vscode-test-cli
- **Code Coverage**: https://github.com/bcoe/c8

### Community

- **VS Code Extension Discord**: https://aka.ms/vscode-discord
- **Stack Overflow**: Tag `vscode-extensions`
- **GitHub Discussions**: https://github.com/microsoft/vscode-discussions

### Best Practices

- **Extension Guidelines**: https://code.visualstudio.com/api/references/extension-guidelines
- **UX Guidelines**: https://code.visualstudio.com/api/ux-guidelines/overview
- **Publishing Guidelines**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension

### Examples by Type

- **Language Extension**: https://github.com/microsoft/vscode-extension-samples/tree/main/lsp-sample
- **Tree View**: https://github.com/microsoft/vscode-extension-samples/tree/main/tree-view-sample
- **Webview**: https://github.com/microsoft/vscode-extension-samples/tree/main/webview-sample
- **Task Provider**: https://github.com/microsoft/vscode-extension-samples/tree/main/task-provider-sample
- **Debugger**: https://github.com/microsoft/vscode-extension-samples/tree/main/debugger-sample

---

## Conclusion

This guide covers the essential concepts, patterns, and best practices for VS Code extension development. Key takeaways:

1. **Start Simple**: Begin with the Yeoman generator and basic commands
2. **Follow Patterns**: Use established patterns for resource management and error handling
3. **Test Thoroughly**: Write integration tests and maintain code coverage
4. **Optimize Performance**: Use lazy activation and async loading
5. **Secure by Default**: Validate inputs and use secure APIs
6. **Document Well**: Provide clear README and contribution guidelines
7. **Automate**: Use CI/CD for testing and publishing
8. **Iterate**: Gather feedback and improve continuously

**Happy coding!** 🚀

---

**Document Version**: 1.0
**Last Updated**: November 2025
**Maintained By**: Developer Community
