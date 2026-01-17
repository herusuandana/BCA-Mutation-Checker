import * as fc from "fast-check";
import { ProxyRotator } from "../src/rotation/proxy-rotator";
import { ProxyConfig } from "../src/types/config";

// Feature: bca-mutation-checker, Property 9: Proxy Rotation
// Validates: Requirements 5.2

describe("Proxy Rotation Property Tests", () => {
  describe("Property 9: Proxy Rotation", () => {
    it("should use each proxy exactly once in N consecutive calls (round-robin)", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
              username: fc.option(fc.string(), { nil: undefined }),
              password: fc.option(fc.string(), { nil: undefined }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);
            const N = proxies.length;
            const selectedProxies: ProxyConfig[] = [];

            // Get N proxies
            for (let i = 0; i < N; i++) {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                selectedProxies.push(proxy);
              }
            }

            // Should have selected N proxies
            expect(selectedProxies.length).toBe(N);

            // Each proxy should appear exactly once
            const selectedServers = selectedProxies.map((p) => p.server);
            const uniqueServers = new Set(selectedServers);
            expect(uniqueServers.size).toBe(N);

            // All selected proxies should be from the original list
            selectedProxies.forEach((proxy) => {
              const found = proxies.some((p) => p.server === proxy.server);
              expect(found).toBe(true);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain round-robin distribution over multiple cycles", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          fc.integer({ min: 2, max: 5 }),
          (proxies, cycles) => {
            const rotator = new ProxyRotator(proxies);
            const N = proxies.length;
            const allSelections: ProxyConfig[] = [];

            // Get proxies for multiple cycles
            for (let cycle = 0; cycle < cycles; cycle++) {
              for (let i = 0; i < N; i++) {
                const proxy = rotator.getNextProxy();
                if (proxy) {
                  allSelections.push(proxy);
                }
              }
            }

            // Check each cycle individually
            for (let cycle = 0; cycle < cycles; cycle++) {
              const cycleStart = cycle * N;
              const cycleEnd = cycleStart + N;
              const cycleSelections = allSelections.slice(cycleStart, cycleEnd);

              // Each proxy should appear exactly once per cycle
              proxies.forEach((proxy) => {
                const count = cycleSelections.filter(
                  (p) => p.server === proxy.server,
                ).length;
                expect(count).toBe(1);
              });
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return proxies in consistent order across cycles", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);
            const N = proxies.length;

            // Get first cycle
            const firstCycle: string[] = [];
            for (let i = 0; i < N; i++) {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                firstCycle.push(proxy.server);
              }
            }

            // Get second cycle
            const secondCycle: string[] = [];
            for (let i = 0; i < N; i++) {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                secondCycle.push(proxy.server);
              }
            }

            // Both cycles should have the same order
            expect(secondCycle).toEqual(firstCycle);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should skip failed proxies in rotation", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);

            // Mark first proxy as failed
            const firstProxy = rotator.getNextProxy();
            if (firstProxy) {
              rotator.markProxyFailed(firstProxy);
            }

            // Get next N-1 proxies
            const selectedProxies: ProxyConfig[] = [];
            for (let i = 0; i < proxies.length - 1; i++) {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                selectedProxies.push(proxy);
              }
            }

            // None of the selected proxies should be the failed one
            selectedProxies.forEach((proxy) => {
              expect(proxy.server).not.toBe(firstProxy?.server);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return null when all proxies have failed", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);

            // Mark all proxies as failed
            proxies.forEach(() => {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                rotator.markProxyFailed(proxy);
              }
            });

            // Next call should return null
            expect(rotator.getNextProxy()).toBeNull();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should restore failed proxies after reset", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);

            // Mark first proxy as failed
            const firstProxy = rotator.getNextProxy();
            if (firstProxy) {
              rotator.markProxyFailed(firstProxy);
            }

            // Reset failures
            rotator.resetFailures();

            // Reset rotation
            rotator.reset();

            // First proxy should be available again
            const restoredProxy = rotator.getNextProxy();
            expect(restoredProxy?.server).toBe(firstProxy?.server);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should distribute evenly when number of calls is multiple of pool size", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          fc.integer({ min: 1, max: 5 }),
          (proxies, multiplier) => {
            const rotator = new ProxyRotator(proxies);
            const totalCalls = proxies.length * multiplier;
            const counts = new Map<string, number>();

            // Initialize counts
            proxies.forEach((proxy) => counts.set(proxy.server, 0));

            // Make calls
            for (let i = 0; i < totalCalls; i++) {
              const proxy = rotator.getNextProxy();
              if (proxy) {
                counts.set(proxy.server, (counts.get(proxy.server) || 0) + 1);
              }
            }

            // Each proxy should be called exactly 'multiplier' times
            proxies.forEach((proxy) => {
              expect(counts.get(proxy.server)).toBe(multiplier);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should wrap around correctly after reaching the end", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              server: fc.string({ minLength: 5 }),
            }),
            { minLength: 2, maxLength: 5 },
          ),
          (proxies) => {
            const rotator = new ProxyRotator(proxies);
            const N = proxies.length;

            // Get first proxy
            const firstProxy = rotator.getNextProxy();

            // Get N-1 more proxies to complete the cycle
            for (let i = 1; i < N; i++) {
              rotator.getNextProxy();
            }

            // Next proxy should be the same as the first
            const wrappedProxy = rotator.getNextProxy();
            expect(wrappedProxy?.server).toBe(firstProxy?.server);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle empty proxy list", () => {
      const rotator = new ProxyRotator([]);
      expect(rotator.getNextProxy()).toBeNull();
    });

    it("should handle single proxy correctly", () => {
      fc.assert(
        fc.property(
          fc.record({
            server: fc.string({ minLength: 5 }),
          }),
          fc.integer({ min: 1, max: 10 }),
          (proxy, calls) => {
            const rotator = new ProxyRotator([proxy]);

            // All calls should return the same proxy
            for (let i = 0; i < calls; i++) {
              const selected = rotator.getNextProxy();
              expect(selected?.server).toBe(proxy.server);
            }
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
