/**
 * Error handling types and interfaces
 */

/**
 * Error categories
 */
export enum ErrorCategory {
  Authentication = "authentication",
  Network = "network",
  Browser = "browser",
  Parsing = "parsing",
  Webhook = "webhook",
  Config = "config",
}

/**
 * Error action types
 */
export type ErrorAction =
  | { type: "retry"; delay: number }
  | { type: "skip" }
  | { type: "fallback"; alternative: any }
  | { type: "fatal"; exitCode: number };

/**
 * Error context for tracking
 */
export interface ErrorContext {
  operation: string;
  attempt: number;
  maxAttempts: number;
  sessionState?: any;
  timestamp: Date;
}

/**
 * Categorized error
 */
export interface CategorizedError {
  category: ErrorCategory;
  originalError: Error;
  context: ErrorContext;
  recoverable: boolean;
}

/**
 * Error handler interface
 */
export interface IErrorHandler {
  handleError(error: Error, context: ErrorContext): ErrorAction;
  categorizeError(error: Error): ErrorCategory;
  isRecoverable(category: ErrorCategory, context: ErrorContext): boolean;
}
