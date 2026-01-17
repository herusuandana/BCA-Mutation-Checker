import * as fc from "fast-check";
import { SessionManager } from "../src/session/session-manager";
import { Logger } from "../src/logging/logger";
import { Page, Browser } from "playwright";

// Feature: bca-mutation-checker, Property 2: Session Cleanup
// Validates: Requirements 2.2, 9.1

describe("Session Cleanup Property Tests", () => {
  describe("Property 2: Session Cleanup", () => {
    it("should close browser after session completion", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });
          const sessionManager = new SessionManager(logger);

          const mockPage = {
            close: jest.fn().mockResolvedValue(undefined),
          } as unknown as Page;

          const mockBrowser = {
            close: jest.fn().mockResolvedValue(undefined),
          } as unknown as Browser;

          const session = {
            browser: mockBrowser,
            page: mockPage,
            browserType: "chromium",
            userAgent: "test-agent",
            proxy: null,
          };

          await sessionManager.closeSession(session);

          // Verify browser was closed
          expect(mockBrowser.close).toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });

    it("should close page before closing browser", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });
          const sessionManager = new SessionManager(logger);

          const callOrder: string[] = [];

          const mockPage = {
            close: jest.fn().mockImplementation(() => {
              callOrder.push("page");
              return Promise.resolve();
            }),
          } as unknown as Page;

          const mockBrowser = {
            close: jest.fn().mockImplementation(() => {
              callOrder.push("browser");
              return Promise.resolve();
            }),
          } as unknown as Browser;

          const session = {
            browser: mockBrowser,
            page: mockPage,
            browserType: "chromium",
            userAgent: "test-agent",
            proxy: null,
          };

          await sessionManager.closeSession(session);

          // Verify page was closed before browser
          expect(callOrder).toEqual(["page", "browser"]);
        }),
        { numRuns: 100 },
      );
    });

    it("should cleanup even if page close fails", async () => {
      await fc.assert(
        fc.asyncProperty(fc.constant(null), async () => {
          const logger = new Logger("test", { level: "error" });
          const sessionManager = new SessionManager(logger);

          const mockPage = {
            close: jest.fn().mockRejectedValue(new Error("Page close failed")),
          } as unknown as Page;

          const mockBrowser = {
            close: jest.fn().mockResolvedValue(undefined),
          } as unknown as Browser;

          const session = {
            browser: mockBrowser,
            page: mockPage,
            browserType: "chromium",
            userAgent: "test-agent",
            proxy: null,
          };

          // Should not throw
          await expect(
            sessionManager.closeSession(session),
          ).resolves.not.toThrow();

          // Browser close should still be attempted
          expect(mockBrowser.close).toHaveBeenCalled();
        }),
        { numRuns: 100 },
      );
    });

    it("should attempt cleanup for all sessions", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.constant(null), { minLength: 1, maxLength: 5 }),
          async (sessions) => {
            const logger = new Logger("test", { level: "error" });
            const sessionManager = new SessionManager(logger);

            const closeCalls: number[] = [];

            for (let i = 0; i < sessions.length; i++) {
              const mockPage = {
                close: jest.fn().mockImplementation(() => {
                  closeCalls.push(i);
                  return Promise.resolve();
                }),
              } as unknown as Page;

              const mockBrowser = {
                close: jest.fn().mockResolvedValue(undefined),
              } as unknown as Browser;

              const session = {
                browser: mockBrowser,
                page: mockPage,
                browserType: "chromium",
                userAgent: "test-agent",
                proxy: null,
              };

              await sessionManager.closeSession(session);
            }

            // Verify all sessions were cleaned up
            expect(closeCalls.length).toBe(sessions.length);
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
