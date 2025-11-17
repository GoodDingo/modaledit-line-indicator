# Test Plan - Stage 2: Add Logging Infrastructure

**Time Estimate:** 2-3 hours
**Difficulty:** Medium
**Dependencies:** Stage 1
**Can Skip?** ❌ NO - Required for diagnosis in Stage 3

---

## Objective

Add comprehensive logging to enable debugging and diagnosis of the mode detection bug.

**WHY THIS MATTERS:** We cannot fix what we cannot see. Logging will show us exactly what values the context query returns and when events fire.

---

## What We're Building

1. **ExtensionLogger class** - Dual output (VS Code channel + file)
2. **Logging in all critical methods** - Mode detection, decorations, events
3. **Debug commands** - Show log file, query mode, clear log

---

## Instructions

### Step 1: Create ExtensionLogger Class (45-60 min)

**File to modify:** `src/extension.ts`

**Add at the top (after imports):**

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Logger that writes to both VS Code output channel and file
 * Dual output ensures we can review logs even after VS Code closes
 */
class ExtensionLogger {
  private outputChannel: vscode.OutputChannel;
  private logFilePath: string;

  constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);

    // Log to temp directory - accessible across sessions
    this.logFilePath = path.join(os.tmpdir(), 'modaledit-line-indicator.log');

    // Clear old log on startup
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (err) {
      // Ignore if can't write - not critical
    }

    this.log('=== NEW SESSION STARTED ===');
    this.log(`Log file: ${this.logFilePath}`);
  }

  private formatMessage(level: string, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  log(message: string, data?: any): void {
    const formatted = this.formatMessage('INFO', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, data?: any): void {
    const formatted = this.formatMessage('DEBUG', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, error?: any): void {
    const errorStr = error ? (error.stack || error.toString()) : '';
    const formatted = this.formatMessage('ERROR', message, { error: errorStr });
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  show(): void {
    this.outputChannel.show();
  }

  dispose(): void {
    this.outputChannel.dispose();
  }

  private writeToFile(message: string): void {
    try {
      fs.appendFileSync(this.logFilePath, message + '\n');
    } catch (err) {
      // Don't crash if file write fails
    }
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
}
```

**Why dual output?**
- Output channel: Real-time debugging during development
- File: Persistent logs for review, sharing with team

---

### Step 2: Add Logger to ModalEditLineIndicator (30 min)

**In ModalEditLineIndicator class:**

**Add property:**
```typescript
private logger: ExtensionLogger;
```

**In constructor (after line ~25):**
```typescript
this.logger = new ExtensionLogger('ModalEdit Line Indicator');
this.logger.log('=== ModalEditLineIndicator Constructor ===');
this.logger.show(); // Auto-show output channel
```

**In dispose() method (before existing code):**
```typescript
this.logger.log('=== DEACTIVATION START ===');
```

**At end of dispose():**
```typescript
this.logger.log('=== DEACTIVATION COMPLETE ===');
this.logger.dispose();
```

---

### Step 3: Add Logging to activate() Method (20 min)

**Replace existing activate() with:**

```typescript
public async activate(): Promise<void> {
  this.logger.log('=== ACTIVATION START ===');

  // Check for ModalEdit extension
  const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');

  if (modalEditExt) {
    this.logger.log('ModalEdit extension FOUND', {
      id: modalEditExt.id,
      version: modalEditExt.packageJSON.version,
      isActive: modalEditExt.isActive
    });

    if (!modalEditExt.isActive) {
      this.logger.log('Activating ModalEdit...');
      try {
        await modalEditExt.activate();
        this.logger.log('ModalEdit activated successfully');
      } catch (error) {
        this.logger.error('Failed to activate ModalEdit', error);
      }
    }
  } else {
    this.logger.log('⚠️  ModalEdit extension NOT FOUND - will default to insert mode');
  }

  // Test initial mode detection
  this.logger.log('Testing initial mode detection...');
  const initialMode = await this.isInNormalMode();
  this.logger.log('Initial mode result', {
    isNormalMode: initialMode,
    expectedColor: initialMode ? 'GREEN (normal)' : 'RED (insert)'
  });

  this.registerListeners();

  // Apply initial decorations
  this.logger.log('Applying initial decorations', {
    visibleEditors: vscode.window.visibleTextEditors.length
  });

  for (const editor of vscode.window.visibleTextEditors) {
    await this.applyDecorations(editor);
  }

  this.logger.log('=== ACTIVATION COMPLETE ===');
}
```

---

### Step 4: Add Logging to isInNormalMode() (15 min)

**Replace existing isInNormalMode() with:**

```typescript
private async isInNormalMode(): Promise<boolean> {
  this.logger.debug('isInNormalMode() called');

  try {
    const contextValue = await vscode.commands.executeCommand(
      'getContext',
      'modaledit.normal'
    );

    // Log EXACT value and all its properties
    this.logger.debug('Context query result', {
      value: contextValue,
      type: typeof contextValue,
      isUndefined: contextValue === undefined,
      isNull: contextValue === null,
      isTrue: contextValue === true,
      isFalse: contextValue === false
    });

    const result = contextValue === true;

    this.logger.debug('isInNormalMode() returning', { result });

    return result;
  } catch (error) {
    this.logger.error('isInNormalMode() threw exception', error);
    return false;
  }
}
```

**CRITICAL:** This logs the EXACT value returned, which will tell us why it's always false.

---

### Step 5: Add Logging to applyDecorations() (15 min)

**Add at start of applyDecorations():**

```typescript
const fileName = path.basename(editor.document.fileName);
const cursorLine = editor.selection.active.line;

this.logger.debug('applyDecorations() start', {
  file: fileName,
  line: cursorLine,
  char: editor.selection.active.character
});

const isNormalMode = await this.isInNormalMode();

this.logger.log('🎨 Applying decoration', {
  mode: isNormalMode ? 'NORMAL' : 'INSERT',
  color: isNormalMode ? 'GREEN' : 'RED',
  line: cursorLine,
  file: fileName
});
```

**After setDecorations calls:**

```typescript
if (isNormalMode) {
  // ... existing setDecorations code ...
  this.logger.debug('Applied NORMAL (green), cleared INSERT');
} else {
  // ... existing setDecorations code ...
  this.logger.debug('Applied INSERT (red), cleared NORMAL');
}
```

---

### Step 6: Add Logging to Event Handlers (20 min)

**In registerListeners(), update each listener:**

**Selection change:**
```typescript
vscode.window.onDidChangeTextEditorSelection(async (e) => {
  const fileName = path.basename(e.textEditor.document.fileName);
  this.logger.debug('📍 EVENT: onDidChangeTextEditorSelection', {
    file: fileName,
    line: e.selections[0].active.line,
    char: e.selections[0].active.character,
    kind: e.kind
  });
  await this.updateHighlight();
})
```

**Editor change:**
```typescript
vscode.window.onDidChangeActiveTextEditor(async (e) => {
  const fileName = e ? path.basename(e.document.fileName) : 'none';
  this.logger.debug('📂 EVENT: onDidChangeActiveTextEditor', {
    file: fileName,
    hasEditor: !!e
  });
  if (e) {
    await this.updateHighlight();
  }
})
```

**Config change:**
```typescript
vscode.workspace.onDidChangeConfiguration((e) => {
  const affectsUs = e.affectsConfiguration('modaledit-line-indicator');
  this.logger.debug('⚙️  EVENT: onDidChangeConfiguration', {
    affectsUs
  });
  if (affectsUs) {
    this.logger.log('Configuration changed - reloading decorations');
    this.reloadDecorations();
  }
})
```

---

### Step 7: Create Debug Commands (30 min)

**Add to registerListeners() method:**

```typescript
// Command: Show log file location
this.disposables.push(
  vscode.commands.registerCommand('modaledit-line-indicator.showLogFile', () => {
    const logPath = this.logger.getLogFilePath();

    vscode.window
      .showInformationMessage(
        `Log file: ${logPath}`,
        'Open File',
        'Copy Path',
        'Reveal in Finder/Explorer'
      )
      .then((choice) => {
        if (choice === 'Open File') {
          vscode.workspace.openTextDocument(logPath).then((doc) => {
            vscode.window.showTextDocument(doc);
          });
        } else if (choice === 'Copy Path') {
          vscode.env.clipboard.writeText(logPath);
          vscode.window.showInformationMessage('Path copied to clipboard');
        } else if (choice === 'Reveal in Finder/Explorer') {
          vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(logPath));
        }
      });
  })
);

// Command: Manual mode query
this.disposables.push(
  vscode.commands.registerCommand('modaledit-line-indicator.queryMode', async () => {
    this.logger.log('=== MANUAL MODE QUERY TRIGGERED ===');

    const isNormal = await this.isInNormalMode();
    const mode = isNormal ? 'NORMAL (green)' : 'INSERT (red)';

    const modalEditExt = vscode.extensions.getExtension('johtela.vscode-modaledit');
    const modalEditInfo = modalEditExt
      ? `ModalEdit v${modalEditExt.packageJSON.version} (active: ${modalEditExt.isActive})`
      : 'ModalEdit NOT installed';

    const message = `Current Mode: ${mode}\n${modalEditInfo}`;

    this.logger.log('Manual query result', {
      isNormalMode: isNormal,
      modalEditPresent: !!modalEditExt,
      modalEditActive: modalEditExt?.isActive
    });

    vscode.window.showInformationMessage(message);
  })
);

// Command: Clear log file
this.disposables.push(
  vscode.commands.registerCommand('modaledit-line-indicator.clearLog', () => {
    try {
      const logPath = this.logger.getLogFilePath();
      fs.writeFileSync(logPath, '');
      this.logger.log('=== LOG CLEARED BY USER ===');
      vscode.window.showInformationMessage('Log file cleared');
    } catch (error) {
      vscode.window.showErrorMessage('Failed to clear log file');
    }
  })
);
```

---

### Step 8: Update package.json (10 min)

**Add to `contributes.commands` array:**

```json
{
  "command": "modaledit-line-indicator.showLogFile",
  "title": "ModalEdit Line Indicator: Show Log File"
},
{
  "command": "modaledit-line-indicator.queryMode",
  "title": "ModalEdit Line Indicator: Query Current Mode (Debug)"
},
{
  "command": "modaledit-line-indicator.clearLog",
  "title": "ModalEdit Line Indicator: Clear Log File"
}
```

---

## Gotchas

### Gotcha 1: Import Statements

Make sure you have these imports at the top of extension.ts:

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
```

### Gotcha 2: Log File Permissions

The log file goes to `os.tmpdir()` which is:
- macOS: `/tmp/`
- Linux: `/tmp/`
- Windows: `%TEMP%`

If file writes fail, logging continues to output channel only.

### Gotcha 3: Too Much Logging?

Debug logs are verbose. This is INTENTIONAL for diagnosis. We'll reduce verbosity after fixing the bug.

### Gotcha 4: TypeScript Errors

If you get "Cannot find name 'path'" errors:
1. Check imports are at top of file
2. Run `make compile` to see actual errors
3. Ensure `@types/node` is in devDependencies

---

## Validation Checklist

### Code Complete
- [ ] ExtensionLogger class created
- [ ] Logger added to ModalEditLineIndicator class
- [ ] activate() has logging
- [ ] isInNormalMode() has detailed logging
- [ ] applyDecorations() has logging
- [ ] Event handlers have logging
- [ ] Three debug commands created
- [ ] package.json updated with commands

### Compilation
- [ ] Code compiles without errors: `make compile`
- [ ] No TypeScript errors
- [ ] No linting errors: `make lint`

### Testing
- [ ] Extension Development Host launches (F5)
- [ ] Output channel "ModalEdit Line Indicator" appears automatically
- [ ] See "=== ACTIVATION START ===" in output
- [ ] See "ModalEdit extension FOUND" (if ModalEdit installed)
- [ ] See "Initial mode result" with data
- [ ] Move cursor → see "EVENT: onDidChangeTextEditorSelection"
- [ ] Switch modes → see mode detection logs

### Commands Work
- [ ] Command Palette → "Show Log File" → file opens
- [ ] Command Palette → "Query Current Mode" → shows result
- [ ] Command Palette → "Clear Log" → log cleared
- [ ] Log file path is shown correctly

### Log Content
- [ ] Logs show timestamps
- [ ] Logs show INFO/DEBUG/ERROR levels
- [ ] Context query result shows exact value
- [ ] Can identify mode detection value

---

## Expected Log Output

**On activation:**
```
[2025-11-17T...] [INFO] === NEW SESSION STARTED ===
[2025-11-17T...] [INFO] Log file: /tmp/modaledit-line-indicator.log
[2025-11-17T...] [INFO] === ModalEditLineIndicator Constructor ===
[2025-11-17T...] [INFO] === ACTIVATION START ===
[2025-11-17T...] [INFO] ModalEdit extension FOUND | {"id":"johtela.vscode-modaledit","version":"1.x.x","isActive":true}
[2025-11-17T...] [INFO] Testing initial mode detection...
[2025-11-17T...] [DEBUG] isInNormalMode() called
[2025-11-17T...] [DEBUG] Context query result | {"value":undefined,"type":"undefined","isUndefined":true,...}
[2025-11-17T...] [DEBUG] isInNormalMode() returning | {"result":false}
[2025-11-17T...] [INFO] Initial mode result | {"isNormalMode":false,"expectedColor":"RED (insert)"}
[2025-11-17T...] [INFO] === ACTIVATION COMPLETE ===
```

**The key line is:** `Context query result` - this will show us what the context actually returns!

---

## Troubleshooting

### Problem: Output channel doesn't appear

**Solution:**
- Manually open: View → Output → Select "ModalEdit Line Indicator"
- Check `this.logger.show()` is called in constructor

### Problem: No logs appear

**Solution:**
- Check Extension Development Host is running (not regular VS Code)
- Check Debug Console for errors
- Verify `make compile` succeeded

### Problem: Log file not created

**Solution:**
- Check file path: Run "Show Log File" command
- File write failures are non-critical, check output channel instead
- On Windows, ensure %TEMP% is accessible

### Problem: TypeScript errors about 'fs' module

**Solution:**
- Ensure `@types/node` is in devDependencies
- Run `npm install` to ensure types are installed
- Check tsconfig.json includes node types

---

## Commit Message

After completing and validating this stage:

```
feat: add comprehensive logging infrastructure

- Add ExtensionLogger class with dual output (channel + file)
- Add logging to all critical methods (activate, mode detection, decorations)
- Add logging to event handlers
- Create debug commands (showLogFile, queryMode, clearLog)
- Update package.json with new commands

This logging infrastructure will enable diagnosis of the mode detection bug in Stage 3.
```

---

## Next Steps

✅ **Proceed to Stage 3:** Diagnose the Bug

📁 **File:** `test-plan-stage3.md`

**What to bring:**
- Working logging infrastructure
- Ability to see exact context values
- Knowledge of where to find logs
