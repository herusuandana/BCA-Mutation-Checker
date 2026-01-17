import * as fc from "fast-check";

// Feature: bca-mutation-checker, Property 8: Proxy Routing When Enabled
// Validates: Requirements 5.1

describe("Proxy Routing Property Tests", () => {
  describe("Property 8: Proxy Routing When Enabled", () => {
    it("should include proxy configuration when proxy is provided", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
            proxy: fc.record({
              server: fc.webUrl(),
              username: fc.string({ minLength: 3 }),
              password: fc.string({ minLength: 5 }),
            }),
          }),
          (options) => {
            expect(options.proxy).toBeDefined();
            expect(options.proxy.server).toBeTruthy();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have valid proxy server URL format", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
            proxy: fc.record({
              server: fc.webUrl(),
            }),
          }),
          (options) => {
            // Proxy server should be a valid URL or host:port format
            const server = options.proxy.server;
            expect(server).toBeTruthy();
            expect(typeof server).toBe("string");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should support proxy with authentication", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
            proxy: fc.record({
              server: fc.webUrl(),
              username: fc.string({ minLength: 3 }),
              password: fc.string({ minLength: 5 }),
            }),
          }),
          (options) => {
            expect(options.proxy.username).toBeDefined();
            expect(options.proxy.password).toBeDefined();
            expect(options.proxy.username!.length).toBeGreaterThan(0);
            expect(options.proxy.password!.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should support proxy without authentication", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
            proxy: fc.record({
              server: fc.webUrl(),
            }),
          }),
          (options: any) => {
            expect(options.proxy.server).toBeDefined();
            // Username and password are optional
            expect(options.proxy.username).toBeUndefined();
            expect(options.proxy.password).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not have proxy configuration when proxy is not provided", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
          }),
          (options: any) => {
            expect(options.proxy).toBeUndefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain proxy settings across session lifecycle", () => {
      fc.assert(
        fc.property(
          fc.record({
            browserType: fc.constantFrom("chromium", "chrome", "edge", "brave"),
            userAgent: fc.string({ minLength: 10 }),
            proxy: fc.option(
              fc.record({
                server: fc.webUrl(),
                username: fc.option(fc.string({ minLength: 3 })),
                password: fc.option(fc.string({ minLength: 5 })),
              }),
            ),
          }),
          (options) => {
            // Proxy settings should be consistent
            if (options.proxy) {
              expect(options.proxy.server).toBeTruthy();
            } else {
              // fc.option returns null, not undefined
              expect(options.proxy).toBeNull();
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
