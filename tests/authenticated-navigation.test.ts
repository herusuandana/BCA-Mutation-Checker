import * as fc from "fast-check";
import { MutationScraper } from "../src/scraper/mutation-scraper";
import { Logger } from "../src/logging/logger";
import { Page } from "playwright";

// Feature: bca-mutation-checker, Property 10: Authenticated Session Navigation
// Validates: Requirements 6.1

describe("Authenticated Session Navigation Property Tests", () => {
  describe("Property 10: Authenticated Session Navigation", () => {
    it("should navigate to mutation page after authentication", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });

          const mockPage = {
            goto: jest.fn().mockResolvedValue(undefined),
            waitForSelector: jest.fn().mockResolvedValue(undefined),
          } as unknown as Page;

          const scraper = new MutationScraper(mockPage, logger);

          await scraper.navigateToMutationPage();

          // Verify navigation occurred
          expect(mockPage.goto).toHaveBeenCalledWith(
            expect.stringContaining("accountstmt.do"),
            expect.any(Object),
          );
        }),
        { numRuns: 100 },
      );
    });

    it("should wait for page load after navigation", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });

          const mockPage = {
            goto: jest.fn().mockResolvedValue(undefined),
            waitForSelector: jest.fn().mockResolvedValue(undefined),
          } as unknown as Page;

          const scraper = new MutationScraper(mockPage, logger);

          await scraper.navigateToMutationPage();

          // Verify goto was called with networkidle wait
          expect(mockPage.goto).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({ waitUntil: "networkidle" }),
          );
        }),
        { numRuns: 100 },
      );
    });

    it("should use correct mutation page URL", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });

          const mockPage = {
            goto: jest.fn().mockResolvedValue(undefined),
            waitForSelector: jest.fn().mockResolvedValue(undefined),
          } as unknown as Page;

          const scraper = new MutationScraper(mockPage, logger);

          await scraper.navigateToMutationPage();

          // Verify correct URL
          const calls = (mockPage.goto as jest.Mock).mock.calls;
          expect(calls[0][0]).toContain("ibank.klikbca.com");
          expect(calls[0][0]).toContain("accountstmt.do");
        }),
        { numRuns: 100 },
      );
    });
  });
});
