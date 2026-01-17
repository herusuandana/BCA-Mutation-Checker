import * as fc from "fast-check";
import { Logger, LogEntry } from "../src/logging/logger";

// Feature: bca-mutation-checker, Property 18: Error Log Structure
// Validates: Requirements 10.1

describe("Error Log Structure Property Tests", () => {
  describe("Property 18: Error Log Structure", () => {
    it("should include timestamp in error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage) => {
            let capturedEntry: LogEntry | null = null;

            // Create logger with custom output to capture log entry
            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage);

            // Check timestamp exists and is valid ISO 8601
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.timestamp).toBeTruthy();
            expect(typeof capturedEntry!.timestamp).toBe("string");
            expect(capturedEntry!.timestamp.length).toBeGreaterThan(0);

            // Verify it's a valid ISO 8601 timestamp
            const date = new Date(capturedEntry!.timestamp);
            expect(date.toISOString()).toBe(capturedEntry!.timestamp);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include error type (level) in error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage);

            // Check level exists and is 'error'
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe("error");
            expect(typeof capturedEntry!.level).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include contextual information in error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.record({
            errorCode: fc.integer(),
            operation: fc.string(),
            details: fc.string(),
          }),
          (component, errorMessage, context) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage, context);

            // Check context exists and contains the provided data
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.context).toBeTruthy();
            expect(capturedEntry!.context.errorCode).toBe(context.errorCode);
            expect(capturedEntry!.context.operation).toBe(context.operation);
            expect(capturedEntry!.context.details).toBe(context.details);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include component name in error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage);

            // Check component exists and matches
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.component).toBe(component);
            expect(typeof capturedEntry!.component).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should include error message in error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage);

            // Check message exists
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.message).toBeTruthy();
            expect(typeof capturedEntry!.message).toBe("string");
            expect(capturedEntry!.message.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have all required fields in log entry structure", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.option(fc.record({ key: fc.string() }), { nil: undefined }),
          (component, errorMessage, context) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage, context);

            // Check all required fields exist
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry).toHaveProperty("timestamp");
            expect(capturedEntry).toHaveProperty("level");
            expect(capturedEntry).toHaveProperty("component");
            expect(capturedEntry).toHaveProperty("message");

            // Context is optional but should be present if provided
            if (context) {
              expect(capturedEntry).toHaveProperty("context");
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle Error objects in context", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage, errorDetails) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            const error = new Error(errorDetails);
            logger.error(errorMessage, { error });

            // Check error is captured in context
            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.context).toBeTruthy();
            expect(capturedEntry!.context.error).toBeTruthy();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain consistent structure across different error types", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.array(
            fc.record({
              message: fc.string({ minLength: 5 }),
              context: fc.option(fc.record({ data: fc.string() }), {
                nil: undefined,
              }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (component, errors) => {
            const capturedEntries: LogEntry[] = [];

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntries.push(entry);
              }
            }

            const logger = new TestLogger(component, { level: "error" });

            // Log multiple errors
            errors.forEach((err) => {
              logger.error(err.message, err.context);
            });

            // All entries should have the same structure
            expect(capturedEntries.length).toBe(errors.length);
            capturedEntries.forEach((entry) => {
              expect(entry).toHaveProperty("timestamp");
              expect(entry).toHaveProperty("level");
              expect(entry).toHaveProperty("component");
              expect(entry).toHaveProperty("message");
              expect(entry.level).toBe("error");
              expect(entry.component).toBe(component);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should format timestamp as ISO 8601", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, errorMessage) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(errorMessage);

            // Timestamp should be valid ISO 8601
            expect(capturedEntry).not.toBeNull();
            const timestamp = capturedEntry!.timestamp;

            // Should match ISO 8601 format
            expect(timestamp).toMatch(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            );

            // Should be parseable as a date
            const date = new Date(timestamp);
            expect(isNaN(date.getTime())).toBe(false);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
