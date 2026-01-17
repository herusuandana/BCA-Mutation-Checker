import * as fc from "fast-check";
import { UserAgentRotator } from "../src/rotation/user-agent-rotator";
import { BrowserType } from "../src/types/config";

// Feature: bca-mutation-checker, Property 6: User Agent Rotation
// Validates: Requirements 4.2, 4.4

describe("User Agent Rotation Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];

  describe("Property 6: User Agent Rotation", () => {
    it("should use different user agents for consecutive sessions when multiple are configured", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 20 }), {
            minLength: 2,
            maxLength: 10,
          }),
          fc.constantFrom(...validBrowsers),
          (userAgents, browserType) => {
            const rotator = new UserAgentRotator(userAgents);

            // Get two consecutive user agents
            const first = rotator.getNextUserAgent(browserType);
            const second = rotator.getNextUserAgent(browserType);

            // They should be different (unless we only have 1 UA, but we have minLength: 2)
            if (userAgents.length > 1) {
              expect(first).not.toBe(second);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should not reuse the same user agent consecutively when multiple options exist", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 20 }), {
            minLength: 3,
            maxLength: 10,
          }),
          fc.constantFrom(...validBrowsers),
          fc.integer({ min: 2, max: 10 }),
          (userAgents, browserType, calls) => {
            const rotator = new UserAgentRotator(userAgents);
            let previousUA: string | null = null;

            for (let i = 0; i < calls; i++) {
              const currentUA = rotator.getNextUserAgent(browserType);

              if (previousUA !== null && userAgents.length > 1) {
                // Current should be different from previous
                // (unless we've cycled through all and come back, but with 3+ UAs this is unlikely in few calls)
                if (i < userAgents.length) {
                  expect(currentUA).not.toBe(previousUA);
                }
              }

              previousUA = currentUA;
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should rotate through all user agents in round-robin fashion", () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(fc.string({ minLength: 20 }), {
            minLength: 1,
            maxLength: 10,
          }),
          fc.constantFrom(...validBrowsers),
          (userAgents, browserType) => {
            const rotator = new UserAgentRotator(userAgents);
            const N = userAgents.length;
            const selected: string[] = [];

            // Get N user agents
            for (let i = 0; i < N; i++) {
              selected.push(rotator.getNextUserAgent(browserType));
            }

            // All selected should be from the original list
            selected.forEach((ua) => {
              expect(userAgents).toContain(ua);
            });

            // Each user agent should appear exactly once
            const uniqueSelected = new Set(selected);
            expect(uniqueSelected.size).toBe(N);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain consistent rotation order across cycles", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 20 }), {
            minLength: 1,
            maxLength: 5,
          }),
          fc.constantFrom(...validBrowsers),
          (userAgents, browserType) => {
            const rotator = new UserAgentRotator(userAgents);
            const N = userAgents.length;

            // Get first cycle
            const firstCycle: string[] = [];
            for (let i = 0; i < N; i++) {
              firstCycle.push(rotator.getNextUserAgent(browserType));
            }

            // Get second cycle
            const secondCycle: string[] = [];
            for (let i = 0; i < N; i++) {
              secondCycle.push(rotator.getNextUserAgent(browserType));
            }

            // Both cycles should have the same order
            expect(secondCycle).toEqual(firstCycle);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle single user agent correctly", () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 20 }),
          fc.constantFrom(...validBrowsers),
          fc.integer({ min: 1, max: 10 }),
          (userAgent, browserType, calls) => {
            const rotator = new UserAgentRotator([userAgent]);

            // All calls should return the same user agent
            for (let i = 0; i < calls; i++) {
              expect(rotator.getNextUserAgent(browserType)).toBe(userAgent);
            }
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should use default user agent when no custom agents configured", () => {
      fc.assert(
        fc.property(fc.constantFrom(...validBrowsers), (browserType) => {
          const rotator = new UserAgentRotator();

          const ua = rotator.getNextUserAgent(browserType);

          // Should return a non-empty string
          expect(ua).toBeTruthy();
          expect(typeof ua).toBe("string");
          expect(ua.length).toBeGreaterThan(0);
        }),
        { numRuns: 100 },
      );
    });

    it("should distribute evenly over multiple cycles", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 20 }), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.constantFrom(...validBrowsers),
          fc.integer({ min: 2, max: 4 }),
          (userAgents, browserType, cycles) => {
            const rotator = new UserAgentRotator(userAgents);
            const N = userAgents.length;
            const counts = new Map<string, number>();

            // Initialize counts
            userAgents.forEach((ua) => counts.set(ua, 0));

            // Make calls for multiple cycles
            for (let i = 0; i < N * cycles; i++) {
              const ua = rotator.getNextUserAgent(browserType);
              counts.set(ua, (counts.get(ua) || 0) + 1);
            }

            // Each user agent should be used exactly 'cycles' times
            userAgents.forEach((ua) => {
              expect(counts.get(ua)).toBe(cycles);
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should wrap around correctly after reaching the end", () => {
      fc.assert(
        fc.property(
          fc.array(fc.string({ minLength: 20 }), {
            minLength: 2,
            maxLength: 5,
          }),
          fc.constantFrom(...validBrowsers),
          (userAgents, browserType) => {
            const rotator = new UserAgentRotator(userAgents);
            const N = userAgents.length;

            // Get first user agent
            const firstUA = rotator.getNextUserAgent(browserType);

            // Get N-1 more to complete the cycle
            for (let i = 1; i < N; i++) {
              rotator.getNextUserAgent(browserType);
            }

            // Next should be the same as first
            const wrappedUA = rotator.getNextUserAgent(browserType);
            expect(wrappedUA).toBe(firstUA);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
