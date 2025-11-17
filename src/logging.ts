import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Log level for filtering log messages
 * Hierarchy: error < warn < info < debug
 * - error: Only errors (most restrictive)
 * - warn: Errors and warnings
 * - info: Errors, warnings, and general lifecycle events
 * - debug: Everything including detailed diagnostics (most verbose)
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Numeric values for log level comparison
 * Higher value = more verbose
 */
export const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

/**
 * Logger that writes to both VS Code output channel and file
 * Dual output ensures we can review logs even after VS Code closes
 */
export class ExtensionLogger {
  private outputChannel: vscode.OutputChannel;
  private logFilePath: string;

  constructor(channelName: string) {
    this.outputChannel = vscode.window.createOutputChannel(channelName);

    // Log to temp directory - accessible across sessions
    this.logFilePath = path.join(os.tmpdir(), 'modaledit-line-indicator.log');

    // Clear old log on startup
    try {
      fs.writeFileSync(this.logFilePath, '');
    } catch (_err) {
      // Ignore if can't write - not critical
    }

    this.log('=== NEW SESSION STARTED ===');
    this.log(`Log file: ${this.logFilePath}`);
  }

  /**
   * Get current log level from configuration
   * @returns Current log level, defaults to 'error' if not configured
   */
  private getCurrentLogLevel(): LogLevel {
    const config = vscode.workspace.getConfiguration('modaledit-line-indicator');
    return (config.get<LogLevel>('logLevel') || 'error') as LogLevel;
  }

  /**
   * Check if a message at the given level should be logged
   * @param messageLevel Level of the message to log
   * @returns true if message should be logged based on current configuration
   */
  private shouldLog(messageLevel: LogLevel): boolean {
    const currentLevel = this.getCurrentLogLevel();
    return LOG_LEVEL_VALUES[currentLevel] >= LOG_LEVEL_VALUES[messageLevel];
  }

  private formatMessage(level: string, message: string, data?: unknown): string {
    const timestamp = new Date().toISOString();
    const dataStr = data !== undefined ? ` | ${JSON.stringify(data)}` : '';
    return `[${timestamp}] [${level}] ${message}${dataStr}`;
  }

  log(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) {
      return;
    }
    const formatted = this.formatMessage('INFO', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) {
      return;
    }
    const formatted = this.formatMessage('DEBUG', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) {
      return;
    }
    const formatted = this.formatMessage('WARN', message, data);
    this.outputChannel.appendLine(formatted);
    this.writeToFile(formatted);
  }

  error(message: string, error?: unknown): void {
    if (!this.shouldLog('error')) {
      return;
    }
    const errorStr = error instanceof Error ? error.stack || error.message : String(error || '');
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
    } catch (_err) {
      // Don't crash if file write fails
    }
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
}
