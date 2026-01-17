import { LogLevel } from "../types/config";
import { sanitizeLog } from "./sanitizer";

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  context?: any;
}

/**
 * Logger options
 */
export interface LoggerOptions {
  level?: LogLevel;
  credentials?: {
    username?: string;
    password?: string;
  };
}

/**
 * Logger class for structured logging with multiple levels
 */
export class Logger {
  private level: LogLevel;
  private component: string;
  private credentials?: { username?: string; password?: string };

  /**
   * Log level priorities for filtering
   */
  private static readonly LEVEL_PRIORITY: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warning: 2,
    error: 3,
  };

  /**
   * Create a new logger instance
   * @param component - Component name for log entries
   * @param options - Logger options
   */
  constructor(component: string, options: LoggerOptions = {}) {
    this.component = component;
    this.level = options.level || "info";
    this.credentials = options.credentials;
  }

  /**
   * Log a debug message
   * @param message - Log message
   * @param context - Optional context data
   */
  debug(message: string, context?: any): void {
    this.log("debug", message, context);
  }

  /**
   * Log an info message
   * @param message - Log message
   * @param context - Optional context data
   */
  info(message: string, context?: any): void {
    this.log("info", message, context);
  }

  /**
   * Log a warning message
   * @param message - Log message
   * @param context - Optional context data
   */
  warning(message: string, context?: any): void {
    this.log("warning", message, context);
  }

  /**
   * Log an error message
   * @param message - Log message
   * @param context - Optional context data (can include Error object)
   */
  error(message: string, context?: any): void {
    this.log("error", message, context);
  }

  /**
   * Internal log method
   * @param level - Log level
   * @param message - Log message
   * @param context - Optional context data
   */
  private log(level: LogLevel, message: string, context?: any): void {
    // Check if this log level should be output
    if (!this.shouldLog(level)) {
      return;
    }

    // Sanitize message and context
    const sanitized = sanitizeLog(message, context, this.credentials);

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message: sanitized.message,
      context: sanitized.context,
    };

    this.output(entry);
  }

  /**
   * Check if a log level should be output based on configured minimum level
   * @param level - Log level to check
   * @returns True if log should be output
   */
  private shouldLog(level: LogLevel): boolean {
    return Logger.LEVEL_PRIORITY[level] >= Logger.LEVEL_PRIORITY[this.level];
  }

  /**
   * Output log entry (can be overridden for custom output)
   * @param entry - Log entry to output
   */
  protected output(entry: LogEntry): void {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    console.log(
      `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.component}] ${entry.message}${contextStr}`,
    );
  }

  /**
   * Set the minimum log level
   * @param level - New minimum log level
   */
  setLevel(level: LogLevel): void {
    this.level = level;
  }

  /**
   * Get the current log level
   * @returns Current log level
   */
  getLevel(): LogLevel {
    return this.level;
  }

  /**
   * Get the component name
   * @returns Component name
   */
  getComponent(): string {
    return this.component;
  }
}
