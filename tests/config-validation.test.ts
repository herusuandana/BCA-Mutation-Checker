import * as fc from "fast-check";
import { validateConfig } from "../src/config/validator";
import { BrowserType, LogLevel } from "../src/types/config";

// Feature: bca-mutation-checker, Property 22: Configuration Validation Errors
// Validates: Requirements 11.3

describe("Configuration Validation Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];
  const validLogLevels: LogLevel[] = ["debug", "info", "warning", "error"];
  const minInterval = 5 * 60 * 1000; // 5 minutes

  describe("Property 22: Configuration Validation Errors", () => {
    it("should report error for missing credentials", () => {
      fc.assert(
        fc.property(
          fc.record({
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (configWithoutCreds) => {
            const result = validateConfig(configWithoutCreds);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "credentials")).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for missing username in credentials", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(
              result.errors.some((e) => e.field === "credentials.username"),
            ).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for missing password in credentials", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(
              result.errors.some((e) => e.field === "credentials.password"),
            ).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for interval below minimum", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: 0, max: minInterval - 1 }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "interval")).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for empty browsers array", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.constant([]),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "browsers")).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for invalid browser type", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(
              fc
                .string()
                .filter((s) => !validBrowsers.includes(s as BrowserType)),
              { minLength: 1 },
            ),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(
              result.errors.some((e) => e.field.startsWith("browsers[")),
            ).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for invalid log level", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc
                .string()
                .filter((s) => !validLogLevels.includes(s as LogLevel)),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "logging.level")).toBe(
              true,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report error for missing logging configuration", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({ min: minInterval }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(false);
            expect(result.errors.some((e) => e.field === "logging")).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should report specific field names in validation errors", () => {
      fc.assert(
        fc.property(
          fc.oneof(
            // Missing credentials
            fc.record({
              interval: fc.integer({ min: minInterval }),
              browsers: fc.array(fc.constantFrom(...validBrowsers), {
                minLength: 1,
              }),
              logging: fc.record({ level: fc.constantFrom(...validLogLevels) }),
            }),
            // Invalid interval
            fc.record({
              credentials: fc.record({
                username: fc.string({ minLength: 1 }),
                password: fc.string({ minLength: 1 }),
              }),
              interval: fc.integer({ max: minInterval - 1 }),
              browsers: fc.array(fc.constantFrom(...validBrowsers), {
                minLength: 1,
              }),
              logging: fc.record({ level: fc.constantFrom(...validLogLevels) }),
            }),
            // Empty browsers
            fc.record({
              credentials: fc.record({
                username: fc.string({ minLength: 1 }),
                password: fc.string({ minLength: 1 }),
              }),
              interval: fc.integer({ min: minInterval }),
              browsers: fc.constant([]),
              logging: fc.record({ level: fc.constantFrom(...validLogLevels) }),
            }),
          ),
          (invalidConfig) => {
            const result = validateConfig(invalidConfig);
            expect(result.valid).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            // Each error should have a specific field name
            result.errors.forEach((error) => {
              expect(error.field).toBeTruthy();
              expect(typeof error.field).toBe("string");
              expect(error.field.length).toBeGreaterThan(0);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
