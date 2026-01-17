/**
 * Error handler with categorization and recovery strategies
 */

import { Logger } from "../logging/logger";
import {
  ErrorCategory,
  ErrorAction,
  ErrorContext,
  CategorizedError,
  IErrorHandler,
} from "./types";

export class ErrorHandler implements IErrorHandler {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Handle an error and determine the appropriate action
   */
  handleError(error: Error, context: ErrorContext): ErrorAction {
    const category = this.categorizeError(error);
    const recoverable = this.isRecoverable(category, context);

    // Log the error with context
    this.logError(error, category, context, recoverable);

    // Determine action based on category and recoverability
    return this.determineAction(category, context, recoverable);
  }

  /**
   * Categorize an error based on its type and message
   */
  categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
    const name = error.name.toLowerCase();

    // Authentication errors
    if (
      message.includes("authentication") ||
      message.includes("login") ||
      message.includes("credential") ||
      message.includes("unauthorized") ||
      message.includes("401")
    ) {
      return ErrorCategory.Authentication;
    }

    // Network errors
    if (
      message.includes("network") ||
      message.includes("timeout") ||
      message.includes("econnrefused") ||
      message.includes("enotfound") ||
      message.includes("dns") ||
      message.includes("proxy") ||
      name.includes("networkerror")
    ) {
      return ErrorCategory.Network;
    }

    // Browser errors
    if (
      message.includes("browser") ||
      message.includes("page") ||
      message.includes("navigation") ||
      message.includes("element not found") ||
      message.includes("selector") ||
      message.includes("playwright")
    ) {
      return ErrorCategory.Browser;
    }

    // Parsing errors
    if (
      message.includes("parse") ||
      message.includes("invalid date") ||
      message.includes("invalid amount") ||
      message.includes("invalid transaction type") ||
      message.includes("missing required fields")
    ) {
      return ErrorCategory.Parsing;
    }

    // Webhook errors
    if (
      message.includes("webhook") ||
      message.includes("http request failed") ||
      (message.includes("fetch") && message.includes("failed"))
    ) {
      return ErrorCategory.Webhook;
    }

    // Config errors
    if (
      message.includes("config") ||
      message.includes("validation") ||
      message.includes("required field")
    ) {
      return ErrorCategory.Config;
    }

    // Default to browser error for unknown errors
    return ErrorCategory.Browser;
  }

  /**
   * Determine if an error is recoverable
   */
  isRecoverable(category: ErrorCategory, context: ErrorContext): boolean {
    // Config errors are never recoverable
    if (category === ErrorCategory.Config) {
      return false;
    }

    // Check if we've exceeded max attempts
    if (context.attempt >= context.maxAttempts) {
      return false;
    }

    // All other categories are potentially recoverable
    return true;
  }

  /**
   * Determine the appropriate action for an error
   */
  private determineAction(
    category: ErrorCategory,
    context: ErrorContext,
    recoverable: boolean,
  ): ErrorAction {
    // Fatal errors
    if (!recoverable) {
      if (category === ErrorCategory.Config) {
        return { type: "fatal", exitCode: 1 };
      }
      // Non-recoverable after max attempts - skip this check
      return { type: "skip" };
    }

    // Recoverable errors - determine retry delay
    switch (category) {
      case ErrorCategory.Authentication:
        // Wait longer for auth errors (30 seconds)
        return { type: "retry", delay: 30000 };

      case ErrorCategory.Network:
        // Exponential backoff for network errors
        const networkDelay = Math.min(
          Math.pow(2, context.attempt) * 1000,
          60000,
        );
        return { type: "retry", delay: networkDelay };

      case ErrorCategory.Browser:
        // Try fallback browser if available
        if (context.attempt < 3) {
          return { type: "fallback", alternative: "next-browser" };
        }
        return { type: "skip" };

      case ErrorCategory.Parsing:
        // Skip malformed records, continue with others
        return { type: "skip" };

      case ErrorCategory.Webhook:
        // Exponential backoff for webhook errors
        const webhookDelay = Math.min(
          Math.pow(2, context.attempt) * 1000,
          30000,
        );
        return { type: "retry", delay: webhookDelay };

      default:
        return { type: "skip" };
    }
  }

  /**
   * Log error with appropriate level and context
   */
  private logError(
    error: Error,
    category: ErrorCategory,
    context: ErrorContext,
    recoverable: boolean,
  ): void {
    const logContext = {
      category,
      operation: context.operation,
      attempt: context.attempt,
      maxAttempts: context.maxAttempts,
      recoverable,
      errorMessage: error.message,
      errorName: error.name,
    };

    if (recoverable) {
      this.logger.warning(
        `Recoverable error in ${context.operation}`,
        logContext,
      );
    } else {
      this.logger.error(
        `Non-recoverable error in ${context.operation}`,
        logContext,
      );
    }
  }

  /**
   * Create a categorized error object
   */
  createCategorizedError(
    error: Error,
    context: ErrorContext,
  ): CategorizedError {
    const category = this.categorizeError(error);
    const recoverable = this.isRecoverable(category, context);

    return {
      category,
      originalError: error,
      context,
      recoverable,
    };
  }
}
