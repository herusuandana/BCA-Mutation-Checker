/**
 * Property test: Recoverable Error Continuation
 * Property 19: For any recoverable error (authentication failure, network timeout),
 * the system should continue operation and attempt the next scheduled check.
 * Validates: Requirements 10.2
 */

import * as fc from "fast-check";
import { ErrorHandler } from "../src/error/error-handler";
import { ErrorCategory, ErrorContext } from "../src/error/types";
import { Logger } from "../src/logging/logger";

describe("Property 19: Recoverable Error Continuation", () => {
  let errorHandler: ErrorHandler;
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test", { level: "info" });
    errorHandler = new ErrorHandler(logger);
  });

  test("should continue operation for recoverable authentication errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 5, max: 10 }),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (attempt, maxAttempts, operation) => {
          const error = new Error("Authentication failed: Invalid credentials");
          const context: ErrorContext = {
            operation,
            attempt,
            maxAttempts,
            timestamp: new Date(),
          };

          const action = errorHandler.handleError(error, context);

          // Should not be fatal for recoverable auth errors
          expect(action.type).not.toBe("fatal");

          // Should either retry or skip (if max attempts reached)
          if (attempt < maxAttempts) {
            expect(action.type).toBe("retry");
            if (action.type === "retry") {
              expect(action.delay).toBeGreaterThan(0);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should continue operation for recoverable network errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 5, max: 10 }),
        fc.string({ minLength: 5, maxLength: 50 }),
        async (attempt, maxAttempts, operation) => {
          const error = new Error("Network timeout: Connection failed");
          const context: ErrorContext = {
            operation,
            attempt,
            maxAttempts,
            timestamp: new Date(),
          };

          const action = errorHandler.handleError(error, context);

          // Should not be fatal for network errors
          expect(action.type).not.toBe("fatal");

          // Should either retry or skip (if max attempts reached)
          if (attempt < maxAttempts) {
            expect(action.type).toBe("retry");
            if (action.type === "retry") {
              expect(action.delay).toBeGreaterThan(0);
            }
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should categorize errors correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(
          "Authentication failed",
          "Network timeout",
          "Browser launch failed",
          "Parse error: invalid date",
          "Webhook delivery failed",
        ),
        async (errorMessage) => {
          const error = new Error(errorMessage);
          const category = errorHandler.categorizeError(error);

          // Verify category is one of the valid categories
          expect(Object.values(ErrorCategory)).toContain(category);

          // Verify specific categorizations
          if (errorMessage.includes("Authentication")) {
            expect(category).toBe(ErrorCategory.Authentication);
          } else if (errorMessage.includes("Network")) {
            expect(category).toBe(ErrorCategory.Network);
          } else if (errorMessage.includes("Browser")) {
            expect(category).toBe(ErrorCategory.Browser);
          } else if (errorMessage.includes("Parse")) {
            expect(category).toBe(ErrorCategory.Parsing);
          } else if (errorMessage.includes("Webhook")) {
            expect(category).toBe(ErrorCategory.Webhook);
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should mark errors as recoverable when within attempt limits", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 6, max: 10 }),
        fc.constantFrom(
          ErrorCategory.Authentication,
          ErrorCategory.Network,
          ErrorCategory.Browser,
          ErrorCategory.Webhook,
        ),
        async (attempt, maxAttempts, category) => {
          const context: ErrorContext = {
            operation: "test-operation",
            attempt,
            maxAttempts,
            timestamp: new Date(),
          };

          const recoverable = errorHandler.isRecoverable(category, context);

          // Should be recoverable when attempt < maxAttempts
          expect(recoverable).toBe(true);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should mark errors as non-recoverable when exceeding attempt limits", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 5, max: 10 }),
        fc.constantFrom(
          ErrorCategory.Authentication,
          ErrorCategory.Network,
          ErrorCategory.Browser,
          ErrorCategory.Webhook,
        ),
        async (maxAttempts, category) => {
          const context: ErrorContext = {
            operation: "test-operation",
            attempt: maxAttempts, // Equal to max
            maxAttempts,
            timestamp: new Date(),
          };

          const recoverable = errorHandler.isRecoverable(category, context);

          // Should not be recoverable when attempt >= maxAttempts
          expect(recoverable).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should never mark config errors as recoverable", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 5, max: 10 }),
        async (attempt, maxAttempts) => {
          const context: ErrorContext = {
            operation: "test-operation",
            attempt,
            maxAttempts,
            timestamp: new Date(),
          };

          const recoverable = errorHandler.isRecoverable(
            ErrorCategory.Config,
            context,
          );

          // Config errors should never be recoverable
          expect(recoverable).toBe(false);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should provide retry action with positive delay for recoverable errors", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1, max: 3 }),
        fc.integer({ min: 5, max: 10 }),
        fc.constantFrom(
          "Authentication failed",
          "Network timeout",
          "Webhook delivery failed",
        ),
        async (attempt, maxAttempts, errorMessage) => {
          const error = new Error(errorMessage);
          const context: ErrorContext = {
            operation: "test-operation",
            attempt,
            maxAttempts,
            timestamp: new Date(),
          };

          const action = errorHandler.handleError(error, context);

          // Should provide retry action with positive delay
          if (action.type === "retry") {
            expect(action.delay).toBeGreaterThan(0);
            expect(action.delay).toBeLessThanOrEqual(60000); // Max 60 seconds
          }
        },
      ),
      { numRuns: 100 },
    );
  });
});
