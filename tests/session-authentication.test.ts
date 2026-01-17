import * as fc from "fast-check";
import { SessionManager } from "../src/session/session-manager";
import { Logger } from "../src/logging/logger";
import { Page, Browser } from "playwright";

// Feature: bca-mutation-checker, Property 1: Session Authentication
// Validates: Requirements 2.1

describe("Session Authentication Property Tests", () => {
  describe("Property 1: Session Authentication", () => {
    it("should authenticate before accessing protected pages", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5, maxLength: 20 }),
          fc.string({ minLength: 8, maxLength: 20 }),
          async (username, password) => {
            const logger = new Logger("test", { level: "error" });
            const sessionManager = new SessionManager(logger);

            // Mock page and browser
            const mockPage = {
              goto: jest.fn().mockResolvedValue(undefined),
              fill: jest.fn().mockResolvedValue(undefined),
              click: jest.fn().mockResolvedValue(undefined),
              waitForLoadState: jest.fn().mockResolvedValue(undefined),
              url: jest
                .fn()
                .mockReturnValue(
                  "https://ibank.klikbca.com/authentication.do?value(actions)=menu",
                ),
              close: jest.fn().mockResolvedValue(undefined),
            } as unknown as Page;

            const mockBrowser = {
              newContext: jest.fn().mockResolvedValue({
                newPage: jest.fn().mockResolvedValue(mockPage),
              }),
              close: jest.fn().mockResolvedValue(undefined),
            } as unknown as Browser;

            // Create session
            const session = {
              browser: mockBrowser,
              page: mockPage,
              browserType: "chromium",
              userAgent: "test-agent",
              proxy: null,
            };

            // Perform login
            await sessionManager.login(session, { username, password });

            // Verify authentication occurred
            expect(mockPage.goto).toHaveBeenCalledWith(
              expect.stringContaining("ibank.klikbca.com"),
              expect.any(Object),
            );
            expect(mockPage.fill).toHaveBeenCalledTimes(2);
            expect(mockPage.click).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should navigate to login page before filling credentials", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 8 }),
          async (username, password) => {
            const logger = new Logger("test", { level: "error" });
            const sessionManager = new SessionManager(logger);

            const callOrder: string[] = [];

            const mockPage = {
              goto: jest.fn().mockImplementation(() => {
                callOrder.push("goto");
                return Promise.resolve();
              }),
              fill: jest.fn().mockImplementation(() => {
                callOrder.push("fill");
                return Promise.resolve();
              }),
              click: jest.fn().mockImplementation(() => {
                callOrder.push("click");
                return Promise.resolve();
              }),
              waitForLoadState: jest.fn().mockResolvedValue(undefined),
              url: jest
                .fn()
                .mockReturnValue(
                  "https://ibank.klikbca.com/authentication.do?value(actions)=menu",
                ),
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

            await sessionManager.login(session, { username, password });

            // Verify goto was called before fill
            expect(callOrder[0]).toBe("goto");
            expect(callOrder.indexOf("goto")).toBeLessThan(
              callOrder.indexOf("fill"),
            );
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should wait for page load after login submission", async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.string({ minLength: 5 }),
          fc.string({ minLength: 8 }),
          async (username, password) => {
            const logger = new Logger("test", { level: "error" });
            const sessionManager = new SessionManager(logger);

            const mockPage = {
              goto: jest.fn().mockResolvedValue(undefined),
              fill: jest.fn().mockResolvedValue(undefined),
              click: jest.fn().mockResolvedValue(undefined),
              waitForLoadState: jest.fn().mockResolvedValue(undefined),
              url: jest
                .fn()
                .mockReturnValue(
                  "https://ibank.klikbca.com/authentication.do?value(actions)=menu",
                ),
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

            await sessionManager.login(session, { username, password });

            // Verify waitForLoadState was called
            expect(mockPage.waitForLoadState).toHaveBeenCalled();
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
