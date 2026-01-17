import * as fc from "fast-check";
import {
  applyDefaults,
  DEFAULT_PROXY_SETTINGS,
  DEFAULT_WEBHOOK_RETRY_ATTEMPTS,
} from "../src/config/defaults";
import { BrowserType, LogLevel } from "../src/types/config";

// Feature: bca-mutation-checker, Property 23: Configuration Default Values
// Validates: Requirements 11.4

describe("Configuration Defaults Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];
  const validLogLevels: LogLevel[] = ["debug", "info", "warning", "error"];
  const minInterval = 5 * 60 * 1000;

  describe("Property 23: Configuration Default Values", () => {
    it("should apply empty array for missing userAgents", () => {
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
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.userAgents).toBeDefined();
            expect(Array.isArray(config.userAgents)).toBe(true);
            expect(config.userAgents).toEqual([]);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should apply default proxy settings when proxy is missing", () => {
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
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.proxy).toBeDefined();
            expect(config.proxy?.enabled).toBe(DEFAULT_PROXY_SETTINGS.enabled);
            expect(config.proxy?.servers).toEqual(
              DEFAULT_PROXY_SETTINGS.servers,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should apply default retryAttempts when webhook is provided without retryAttempts", () => {
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
            webhook: fc.record({
              url: fc.webUrl(),
            }),
          }),
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.webhook).toBeDefined();
            expect(config.webhook?.retryAttempts).toBe(
              DEFAULT_WEBHOOK_RETRY_ATTEMPTS,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve provided userAgents when present", () => {
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
            userAgents: fc.array(fc.string({ minLength: 10 }), {
              minLength: 1,
            }),
          }),
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.userAgents).toEqual(partialConfig.userAgents);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve provided proxy settings when present", () => {
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
            proxy: fc.record({
              enabled: fc.boolean(),
              servers: fc.array(
                fc.record({
                  server: fc.string({ minLength: 5 }),
                  username: fc.option(fc.string(), { nil: undefined }),
                  password: fc.option(fc.string(), { nil: undefined }),
                }),
              ),
            }),
          }),
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.proxy?.enabled).toBe(partialConfig.proxy?.enabled);
            expect(config.proxy?.servers).toEqual(partialConfig.proxy?.servers);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve webhook URL when provided", () => {
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
            webhook: fc.record({
              url: fc.webUrl(),
              retryAttempts: fc.integer({ min: 0, max: 10 }),
            }),
          }),
          (partialConfig) => {
            const config = applyDefaults(partialConfig);
            expect(config.webhook?.url).toBe(partialConfig.webhook?.url);
            expect(config.webhook?.retryAttempts).toBe(
              partialConfig.webhook?.retryAttempts,
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should always return a complete Config object with all required fields", () => {
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
            userAgents: fc.option(fc.array(fc.string()), { nil: undefined }),
            proxy: fc.option(
              fc.record({
                enabled: fc.boolean(),
                servers: fc.array(fc.record({ server: fc.string() })),
              }),
              { nil: undefined },
            ),
            webhook: fc.option(
              fc.record({
                url: fc.webUrl(),
                retryAttempts: fc.option(fc.integer({ min: 0 }), {
                  nil: undefined,
                }),
              }),
              { nil: undefined },
            ),
          }),
          (partialConfig) => {
            const config = applyDefaults(partialConfig);

            // Check all required fields are present
            expect(config.credentials).toBeDefined();
            expect(config.interval).toBeDefined();
            expect(config.browsers).toBeDefined();
            expect(config.logging).toBeDefined();
            expect(config.userAgents).toBeDefined();
            expect(config.proxy).toBeDefined();

            // Check types
            expect(typeof config.credentials).toBe("object");
            expect(typeof config.interval).toBe("number");
            expect(Array.isArray(config.browsers)).toBe(true);
            expect(typeof config.logging).toBe("object");
            expect(Array.isArray(config.userAgents)).toBe(true);
            expect(typeof config.proxy).toBe("object");
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
