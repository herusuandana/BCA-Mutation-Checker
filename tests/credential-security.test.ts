import * as fc from "fast-check";
import { Logger } from "../src/logging/logger";
import { sanitizeString, sanitizeObject } from "../src/logging/sanitizer";

// Feature: bca-mutation-checker, Property 3: Credential Security in Logs
// Validates: Requirements 2.4

describe("Credential Security Property Tests", () => {
  describe("Property 3: Credential Security in Logs", () => {
    it("should not contain username in sanitized log messages", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 10 }),
          (username, password, baseMessage) => {
            // Create message containing username
            const message = `${baseMessage} user=${username}`;

            const sanitized = sanitizeString(message, [username, password]);

            // Sanitized message should not contain username
            expect(sanitized).not.toContain(username);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not contain password in sanitized log messages", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 10 }),
          (username, password, baseMessage) => {
            // Create message containing password
            const message = `${baseMessage} password=${password}`;

            const sanitized = sanitizeString(message, [username, password]);

            // Sanitized message should not contain password
            expect(sanitized).not.toContain(password);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should redact credentials from objects with password field", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const obj = {
              username,
              password,
              otherField: "value",
            };

            const sanitized = sanitizeObject(obj);

            // Password field should be redacted
            expect(sanitized.password).toBe("[REDACTED]");
            // Other fields should remain
            expect(sanitized.otherField).toBe("value");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should redact credentials from nested objects", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const obj = {
              config: {
                auth: {
                  username,
                  password,
                },
                other: "data",
              },
            };

            const sanitized = sanitizeObject(obj);

            // Nested password should be redacted
            expect(sanitized.config.auth.password).toBe("[REDACTED]");
            // Other fields should remain
            expect(sanitized.config.other).toBe("data");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should redact credentials from arrays", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const arr = [
              { username, password },
              { username: "other", password: "other" },
            ];

            const sanitized = sanitizeObject(arr);

            // All password fields should be redacted
            expect(sanitized[0].password).toBe("[REDACTED]");
            expect(sanitized[1].password).toBe("[REDACTED]");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle case-insensitive credential field names", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (password) => {
          const variations = [
            { Password: password },
            { PASSWORD: password },
            { PaSsWoRd: password },
          ];

          variations.forEach((obj) => {
            const sanitized = sanitizeObject(obj);
            const key = Object.keys(obj)[0];
            expect(sanitized[key]).toBe("[REDACTED]");
          });
        }),
        { numRuns: 100 },
      );
    });

    it("should redact multiple occurrences of credentials in message", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            const message = `Login attempt: ${username} with ${password}, user ${username} failed`;

            const sanitized = sanitizeString(message, [username, password]);

            // All occurrences should be redacted
            expect(sanitized).not.toContain(username);
            expect(sanitized).not.toContain(password);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve non-sensitive data while redacting credentials", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 10 }),
          (username, password, publicData) => {
            const message = `User ${username} logged in from ${publicData}`;

            const sanitized = sanitizeString(message, [username, password]);

            // Public data should remain
            expect(sanitized).toContain(publicData);
            // Credentials should be redacted
            expect(sanitized).not.toContain(username);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle empty or null credentials gracefully", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 10 }), (message) => {
          const sanitized1 = sanitizeString(message, []);
          const sanitized2 = sanitizeString(message, ["", ""]);

          // Message should remain unchanged
          expect(sanitized1).toBe(message);
          expect(sanitized2).toBe(message);
        }),
        { numRuns: 100 },
      );
    });

    it("should redact credentials with special regex characters", () => {
      fc.assert(
        fc.property(fc.string({ minLength: 5 }), (baseMessage) => {
          // Credentials with special regex characters
          const password = "pass$word.123*";
          const message = `${baseMessage} password=${password}`;

          const sanitized = sanitizeString(message, [password]);

          // Password should be redacted even with special characters
          expect(sanitized).not.toContain(password);
        }),
        { numRuns: 100 },
      );
    });

    it("should work with Logger class integration", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 5 }),
          (username, password) => {
            // Capture console output
            const logs: string[] = [];
            const originalLog = console.log;
            console.log = (msg: string) => logs.push(msg);

            try {
              const logger = new Logger("test", {
                level: "info",
                credentials: { username, password },
              });

              // Log message containing credentials
              logger.info(`Login with ${username} and ${password}`);

              // Restore console.log
              console.log = originalLog;

              // Check that logged output doesn't contain credentials
              expect(logs.length).toBeGreaterThan(0);
              logs.forEach((log) => {
                expect(log).not.toContain(username);
                expect(log).not.toContain(password);
              });
            } finally {
              console.log = originalLog;
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
