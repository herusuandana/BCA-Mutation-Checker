import * as fc from "fast-check";
import { Logger, LogEntry } from "../src/logging/logger";
import { LogLevel } from "../src/types/config";

// Feature: bca-mutation-checker, Property 20: Log Level Assignment
// Validates: Requirements 10.4

describe("Log Level Assignment Property Tests", () => {
  const validLogLevels: LogLevel[] = ["debug", "info", "warning", "error"];

  describe("Property 20: Log Level Assignment", () => {
    it("should assign debug level to debug logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "debug" });
            logger.debug(message);

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe("debug");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should assign info level to info logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "info" });
            logger.info(message);

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe("info");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should assign warning level to warning logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "warning" });
            logger.warning(message);

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe("warning");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should assign error level to error logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "error" });
            logger.error(message);

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe("error");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should assign correct level to all log types", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.constantFrom(...validLogLevels),
          fc.string({ minLength: 5 }),
          (component, level, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "debug" });

            // Call the appropriate log method based on level
            switch (level) {
              case "debug":
                logger.debug(message);
                break;
              case "info":
                logger.info(message);
                break;
              case "warning":
                logger.warning(message);
                break;
              case "error":
                logger.error(message);
                break;
            }

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).toBe(level);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always have a valid log level from the defined set", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.constantFrom(...validLogLevels),
          fc.string({ minLength: 5 }),
          (component, level, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "debug" });

            // Call the appropriate log method
            switch (level) {
              case "debug":
                logger.debug(message);
                break;
              case "info":
                logger.info(message);
                break;
              case "warning":
                logger.warning(message);
                break;
              case "error":
                logger.error(message);
                break;
            }

            expect(capturedEntry).not.toBeNull();
            expect(validLogLevels).toContain(capturedEntry!.level);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain level consistency across multiple logs", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.array(
            fc.record({
              level: fc.constantFrom(...validLogLevels),
              message: fc.string({ minLength: 5 }),
            }),
            { minLength: 2, maxLength: 10 },
          ),
          (component, logs) => {
            const capturedEntries: LogEntry[] = [];

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntries.push(entry);
              }
            }

            const logger = new TestLogger(component, { level: "debug" });

            // Log all messages
            logs.forEach((log) => {
              switch (log.level) {
                case "debug":
                  logger.debug(log.message);
                  break;
                case "info":
                  logger.info(log.message);
                  break;
                case "warning":
                  logger.warning(log.message);
                  break;
                case "error":
                  logger.error(log.message);
                  break;
              }
            });

            // Check each entry has correct level
            expect(capturedEntries.length).toBe(logs.length);
            capturedEntries.forEach((entry, index) => {
              expect(entry.level).toBe(logs[index].level);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have level as a string type", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.constantFrom(...validLogLevels),
          fc.string({ minLength: 5 }),
          (component, level, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "debug" });

            switch (level) {
              case "debug":
                logger.debug(message);
                break;
              case "info":
                logger.info(message);
                break;
              case "warning":
                logger.warning(message);
                break;
              case "error":
                logger.error(message);
                break;
            }

            expect(capturedEntry).not.toBeNull();
            expect(typeof capturedEntry!.level).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not have undefined or null level", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.constantFrom(...validLogLevels),
          fc.string({ minLength: 5 }),
          (component, level, message) => {
            let capturedEntry: LogEntry | null = null;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                capturedEntry = entry;
              }
            }

            const logger = new TestLogger(component, { level: "debug" });

            switch (level) {
              case "debug":
                logger.debug(message);
                break;
              case "info":
                logger.info(message);
                break;
              case "warning":
                logger.warning(message);
                break;
              case "error":
                logger.error(message);
                break;
            }

            expect(capturedEntry).not.toBeNull();
            expect(capturedEntry!.level).not.toBeUndefined();
            expect(capturedEntry!.level).not.toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should respect log level filtering", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (component, message) => {
            let debugCaptured = false;
            let infoCaptured = false;

            class TestLogger extends Logger {
              protected output(entry: LogEntry): void {
                if (entry.level === "debug") debugCaptured = true;
                if (entry.level === "info") infoCaptured = true;
              }
            }

            // Logger set to 'info' level should not output debug logs
            const logger = new TestLogger(component, { level: "info" });
            logger.debug(message);
            logger.info(message);

            expect(debugCaptured).toBe(false);
            expect(infoCaptured).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
