import * as fc from "fast-check";
import { validateConfig } from "../src/config/validator";
import { applyDefaults } from "../src/config/defaults";
import { BrowserType, LogLevel } from "../src/types/config";

// Feature: bca-mutation-checker, Property 21: Configuration Field Support
// Validates: Requirements 11.2

describe("Configuration Field Support Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];
  const validLogLevels: LogLevel[] = ["debug", "info", "warning", "error"];
  const minInterval = 5 * 60 * 1000;

  describe("Property 21: Configuration Field Support", () => {
    it("should successfully parse and validate all required fields", () => {
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
              maxLength: 4,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse credentials field", () => {
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
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.credentials.username).toBe(
              config.credentials.username,
            );
            expect(fullConfig.credentials.password).toBe(
              config.credentials.password,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse interval field", () => {
      fc.assert(
        fc.property(
          fc.record({
            credentials: fc.record({
              username: fc.string({ minLength: 1 }),
              password: fc.string({ minLength: 1 }),
            }),
            interval: fc.integer({
              min: minInterval,
              max: 24 * 60 * 60 * 1000,
            }),
            browsers: fc.array(fc.constantFrom(...validBrowsers), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.interval).toBe(config.interval);
            expect(typeof fullConfig.interval).toBe("number");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse browsers field", () => {
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
              maxLength: 4,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.browsers).toEqual(config.browsers);
            expect(Array.isArray(fullConfig.browsers)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse userAgents field when provided", () => {
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
            userAgents: fc.array(fc.string({ minLength: 10 }), {
              minLength: 1,
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.userAgents).toEqual(config.userAgents);
            expect(Array.isArray(fullConfig.userAgents)).toBe(true);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse proxy field when provided", () => {
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
            proxy: fc.record({
              enabled: fc.boolean(),
              servers: fc.array(
                fc.record({
                  server: fc.string({ minLength: 5 }),
                  username: fc.option(fc.string(), { nil: undefined }),
                  password: fc.option(fc.string(), { nil: undefined }),
                }),
                { minLength: 0, maxLength: 3 },
              ),
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.proxy?.enabled).toBe(config.proxy?.enabled);
            expect(fullConfig.proxy?.servers).toEqual(config.proxy?.servers);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse webhook field when provided", () => {
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
            webhook: fc.record({
              url: fc.webUrl(),
              retryAttempts: fc.integer({ min: 0, max: 10 }),
            }),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.webhook?.url).toBe(config.webhook?.url);
            expect(fullConfig.webhook?.retryAttempts).toBe(
              config.webhook?.retryAttempts,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should successfully parse logging field", () => {
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
              level: fc.constantFrom(...validLogLevels),
              outputPath: fc.option(fc.string(), { nil: undefined }),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);
            expect(fullConfig.logging.level).toBe(config.logging.level);
            if (config.logging.outputPath) {
              expect(fullConfig.logging.outputPath).toBe(
                config.logging.outputPath,
              );
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should make all fields accessible after parsing", () => {
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
            userAgents: fc.option(fc.array(fc.string({ minLength: 10 })), {
              nil: undefined,
            }),
            proxy: fc.option(
              fc.record({
                enabled: fc.boolean(),
                servers: fc.array(
                  fc.record({ server: fc.string({ minLength: 5 }) }),
                ),
              }),
              { nil: undefined },
            ),
            webhook: fc.option(
              fc.record({
                url: fc.webUrl(),
                retryAttempts: fc.integer({ min: 0 }),
              }),
              { nil: undefined },
            ),
            logging: fc.record({
              level: fc.constantFrom(...validLogLevels),
            }),
          }),
          (config) => {
            const result = validateConfig(config);
            expect(result.valid).toBe(true);

            const fullConfig = applyDefaults(config);

            // All fields should be accessible
            expect(() => fullConfig.credentials.username).not.toThrow();
            expect(() => fullConfig.credentials.password).not.toThrow();
            expect(() => fullConfig.interval).not.toThrow();
            expect(() => fullConfig.browsers).not.toThrow();
            expect(() => fullConfig.userAgents).not.toThrow();
            expect(() => fullConfig.proxy).not.toThrow();
            expect(() => fullConfig.webhook).not.toThrow();
            expect(() => fullConfig.logging.level).not.toThrow();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
