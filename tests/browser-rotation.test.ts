import * as fc from "fast-check";
import { BrowserPool } from "../src/rotation/browser-pool";
import { BrowserType } from "../src/types/config";

// Feature: bca-mutation-checker, Property 4: Browser Rotation
// Validates: Requirements 3.1, 3.4

describe("Browser Rotation Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];

  describe("Property 4: Browser Rotation", () => {
    it("should use each browser exactly once in N consecutive calls (round-robin)", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 1,
            maxLength: 4,
          }),
          (browsers) => {
            const pool = new BrowserPool(browsers);
            const N = browsers.length;
            const selectedBrowsers: BrowserType[] = [];

            // Get N browsers
            for (let i = 0; i < N; i++) {
              selectedBrowsers.push(pool.getNextBrowser());
            }

            // Each browser should appear exactly once
            const uniqueBrowsers = new Set(selectedBrowsers);
            expect(uniqueBrowsers.size).toBe(N);

            // All selected browsers should be from the original list
            selectedBrowsers.forEach((browser) => {
              expect(browsers).toContain(browser);
            });

            // Each browser from the original list should appear exactly once
            browsers.forEach((browser) => {
              const count = selectedBrowsers.filter(
                (b) => b === browser,
              ).length;
              expect(count).toBe(1);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain round-robin distribution over multiple cycles", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 1,
            maxLength: 4,
          }),
          fc.integer({ min: 2, max: 5 }),
          (browsers, cycles) => {
            const pool = new BrowserPool(browsers);
            const N = browsers.length;
            const allSelections: BrowserType[] = [];

            // Get browsers for multiple cycles
            for (let cycle = 0; cycle < cycles; cycle++) {
              for (let i = 0; i < N; i++) {
                allSelections.push(pool.getNextBrowser());
              }
            }

            // Check each cycle individually
            for (let cycle = 0; cycle < cycles; cycle++) {
              const cycleStart = cycle * N;
              const cycleEnd = cycleStart + N;
              const cycleSelections = allSelections.slice(cycleStart, cycleEnd);

              // Each browser should appear exactly once per cycle
              browsers.forEach((browser) => {
                const count = cycleSelections.filter(
                  (b) => b === browser,
                ).length;
                expect(count).toBe(1);
              });
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should return browsers in consistent order across cycles", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 1,
            maxLength: 4,
          }),
          (browsers) => {
            const pool = new BrowserPool(browsers);
            const N = browsers.length;

            // Get first cycle
            const firstCycle: BrowserType[] = [];
            for (let i = 0; i < N; i++) {
              firstCycle.push(pool.getNextBrowser());
            }

            // Get second cycle
            const secondCycle: BrowserType[] = [];
            for (let i = 0; i < N; i++) {
              secondCycle.push(pool.getNextBrowser());
            }

            // Both cycles should have the same order
            expect(secondCycle).toEqual(firstCycle);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle single browser correctly", () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...validBrowsers),
          fc.integer({ min: 1, max: 10 }),
          (browser, calls) => {
            const pool = new BrowserPool([browser]);

            // All calls should return the same browser
            for (let i = 0; i < calls; i++) {
              expect(pool.getNextBrowser()).toBe(browser);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should distribute evenly when number of calls is multiple of pool size", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 2,
            maxLength: 4,
          }),
          fc.integer({ min: 1, max: 5 }),
          (browsers, multiplier) => {
            const pool = new BrowserPool(browsers);
            const totalCalls = browsers.length * multiplier;
            const counts = new Map<BrowserType, number>();

            // Initialize counts
            browsers.forEach((browser) => counts.set(browser, 0));

            // Make calls
            for (let i = 0; i < totalCalls; i++) {
              const browser = pool.getNextBrowser();
              counts.set(browser, (counts.get(browser) || 0) + 1);
            }

            // Each browser should be called exactly 'multiplier' times
            browsers.forEach((browser) => {
              expect(counts.get(browser)).toBe(multiplier);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not skip any browser in rotation", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 2,
            maxLength: 4,
          }),
          (browsers) => {
            const pool = new BrowserPool(browsers);
            const N = browsers.length;
            const seen = new Set<BrowserType>();

            // Get N browsers
            for (let i = 0; i < N; i++) {
              seen.add(pool.getNextBrowser());
            }

            // All browsers should have been seen
            expect(seen.size).toBe(N);
            browsers.forEach((browser) => {
              expect(seen.has(browser)).toBe(true);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should wrap around correctly after reaching the end", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.constantFrom(...validBrowsers), {
            minLength: 2,
            maxLength: 4,
          }),
          (browsers) => {
            const pool = new BrowserPool(browsers);
            const N = browsers.length;

            // Get first browser
            const firstBrowser = pool.getNextBrowser();

            // Get N-1 more browsers to complete the cycle
            for (let i = 1; i < N; i++) {
              pool.getNextBrowser();
            }

            // Next browser should be the same as the first
            const wrappedBrowser = pool.getNextBrowser();
            expect(wrappedBrowser).toBe(firstBrowser);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
