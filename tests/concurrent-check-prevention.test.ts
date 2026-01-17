/**
 * Property test: Concurrent Check Prevention
 * Property 16: For any attempt to start a new check while a previous check is still running,
 * the new check should be skipped or queued.
 * Validates: Requirements 8.3
 */

import * as fc from "fast-check";
import { Scheduler } from "../src/scheduler/scheduler";
import { Logger } from "../src/logging/logger";
import { Config } from "../src/types/config";

describe("Property 16: Concurrent Check Prevention", () => {
  let logger: Logger;
  let mockConfig: Config;

  beforeEach(() => {
    logger = new Logger("test", { level: "info" });

    // Create minimal mock config for testing
    mockConfig = {
      credentials: {
        username: "test-user",
        password: "test-pass",
      },
      interval: 300000,
      browsers: ["chromium"],
      logging: {
        level: "info",
      },
    };
  });

  test("should prevent concurrent check execution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 600000 }), // 5-10 minutes
        async (interval) => {
          const scheduler = new Scheduler({ interval }, mockConfig, logger);

          // Mock performCheck to simulate quick execution
          (scheduler as any).performCheck = jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
          });

          // Start two checks concurrently
          const check1Promise = scheduler.executeCheck();
          const check2Promise = scheduler.executeCheck();

          const [result1, result2] = await Promise.all([
            check1Promise,
            check2Promise,
          ]);

          // One should succeed, one should be skipped
          const successCount = [result1, result2].filter(
            (r) => r.success,
          ).length;
          const skippedCount = [result1, result2].filter(
            (r) =>
              !r.success &&
              r.error?.message.includes("Check already in progress"),
          ).length;

          expect(successCount).toBe(1);
          expect(skippedCount).toBe(1);
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  test("should allow sequential check execution", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 600000 }),
        async (interval) => {
          const scheduler = new Scheduler({ interval }, mockConfig, logger);

          // Mock performCheck to simulate quick execution
          (scheduler as any).performCheck = jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
          });

          // Execute checks sequentially
          const result1 = await scheduler.executeCheck();
          const result2 = await scheduler.executeCheck();

          // Both should succeed
          expect(result1.success).toBe(true);
          expect(result2.success).toBe(true);
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  test("should report running state correctly during check", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 600000 }),
        async (interval) => {
          const scheduler = new Scheduler({ interval }, mockConfig, logger);

          // Mock performCheck to simulate longer execution
          (scheduler as any).performCheck = jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
          });

          // Before check
          const runningBefore = scheduler.isRunning();

          // Start check (don't await)
          const checkPromise = scheduler.executeCheck();

          // During check (small delay to ensure check has started)
          await new Promise((resolve) => setTimeout(resolve, 10));
          const runningDuring = scheduler.isRunning();

          // Wait for check to complete
          await checkPromise;

          // After check
          const runningAfter = scheduler.isRunning();

          expect(runningBefore).toBe(false);
          expect(runningDuring).toBe(true);
          expect(runningAfter).toBe(false);
        },
      ),
      { numRuns: 10 }, // Reduced runs due to timing sensitivity
    );
  }, 30000);

  test("should skip concurrent checks regardless of timing", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 600000 }),
        fc.integer({ min: 2, max: 5 }),
        async (interval, concurrentCount) => {
          const scheduler = new Scheduler({ interval }, mockConfig, logger);

          // Mock performCheck to simulate execution
          (scheduler as any).performCheck = jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
          });

          // Start multiple checks concurrently
          const promises = Array.from({ length: concurrentCount }, () =>
            scheduler.executeCheck(),
          );

          const results = await Promise.all(promises);

          // Only one should succeed
          const successCount = results.filter((r) => r.success).length;
          expect(successCount).toBe(1);

          // Others should be skipped
          const skippedCount = results.filter(
            (r) =>
              !r.success &&
              r.error?.message.includes("Check already in progress"),
          ).length;
          expect(skippedCount).toBe(concurrentCount - 1);
        },
      ),
      { numRuns: 20 },
    );
  }, 30000);

  test("should enforce minimum interval", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 1000, max: 299999 }), // Below minimum
        async (interval) => {
          // Should throw error for interval below minimum
          expect(() => {
            new Scheduler({ interval }, mockConfig, logger);
          }).toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should accept intervals at or above minimum", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 3600000 }), // 5-60 minutes
        async (interval) => {
          // Should not throw for valid intervals
          expect(() => {
            new Scheduler({ interval }, mockConfig, logger);
          }).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should start and stop scheduler correctly", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 300000, max: 600000 }),
        async (interval) => {
          const scheduler = new Scheduler({ interval }, mockConfig, logger);

          // Mock performCheck
          (scheduler as any).performCheck = jest.fn(async () => {
            await new Promise((resolve) => setTimeout(resolve, 50));
          });

          // Start scheduler
          scheduler.start();
          expect(scheduler.isRunning()).toBe(true);

          // Stop scheduler
          scheduler.stop();

          // Wait a bit for cleanup
          await new Promise((resolve) => setTimeout(resolve, 50));

          expect(scheduler.isRunning()).toBe(false);
        },
      ),
      { numRuns: 10 },
    );
  }, 30000);
});
