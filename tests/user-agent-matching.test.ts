import * as fc from "fast-check";
import { UserAgentRotator } from "../src/rotation/user-agent-rotator";
import { BrowserType } from "../src/types/config";

// Feature: bca-mutation-checker, Property 7: User Agent Browser Matching
// Validates: Requirements 4.3

describe("User Agent Browser Matching Property Tests", () => {
  const validBrowsers: BrowserType[] = ["chromium", "chrome", "edge", "brave"];

  describe("Property 7: User Agent Browser Matching", () => {
    it("should return user agent containing appropriate identifiers for browser type", () => {
      fc.assert(
        fc.property(fc.constantFrom(...validBrowsers), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // User agent should match the browser type
          expect(rotator.matchesBrowserType(ua, browserType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("should have Chrome identifier for chromium browser", () => {
      fc.assert(
        fc.property(fc.constant("chromium" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // Chromium UA should contain 'chrome'
          expect(ua.toLowerCase()).toContain("chrome");
        }),
        { numRuns: 100 },
      );
    });

    it("should have Chrome identifier for chrome browser", () => {
      fc.assert(
        fc.property(fc.constant("chrome" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // Chrome UA should contain 'chrome'
          expect(ua.toLowerCase()).toContain("chrome");
          // But not Edge
          expect(ua.toLowerCase()).not.toContain("edg");
        }),
        { numRuns: 100 },
      );
    });

    it("should have Edge identifier for edge browser", () => {
      fc.assert(
        fc.property(fc.constant("edge" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // Edge UA should contain 'edg'
          expect(ua.toLowerCase()).toContain("edg");
        }),
        { numRuns: 100 },
      );
    });

    it("should have Chrome identifier for brave browser", () => {
      fc.assert(
        fc.property(fc.constant("brave" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // Brave uses Chrome UA
          expect(ua.toLowerCase()).toContain("chrome");
        }),
        { numRuns: 100 },
      );
    });

    it("should correctly identify Chrome user agents", () => {
      fc.assert(
        fc.property(fc.constant("chrome" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();

          // Chrome UAs should match chrome
          const chromeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
          expect(rotator.matchesBrowserType(chromeUA, browserType)).toBe(true);

          // Edge UAs should not match chrome
          const edgeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
          expect(rotator.matchesBrowserType(edgeUA, browserType)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("should correctly identify Edge user agents", () => {
      fc.assert(
        fc.property(fc.constant("edge" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();

          // Edge UAs should match edge
          const edgeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0";
          expect(rotator.matchesBrowserType(edgeUA, browserType)).toBe(true);

          // Chrome UAs should not match edge
          const chromeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
          expect(rotator.matchesBrowserType(chromeUA, browserType)).toBe(false);
        }),
        { numRuns: 100 },
      );
    });

    it("should correctly identify Chromium user agents", () => {
      fc.assert(
        fc.property(fc.constant("chromium" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();

          // Chrome-based UAs should match chromium
          const chromeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
          expect(rotator.matchesBrowserType(chromeUA, browserType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("should correctly identify Brave user agents", () => {
      fc.assert(
        fc.property(fc.constant("brave" as BrowserType), (browserType) => {
          const rotator = new UserAgentRotator();

          // Brave uses Chrome UA, so Chrome UAs should match
          const chromeUA =
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
          expect(rotator.matchesBrowserType(chromeUA, browserType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("should match default user agents to their browser types", () => {
      fc.assert(
        fc.property(fc.constantFrom(...validBrowsers), (browserType) => {
          const rotator = new UserAgentRotator();
          const defaultUA = rotator.getDefaultUserAgent(browserType);

          // Default UA for a browser should match that browser type
          expect(rotator.matchesBrowserType(defaultUA, browserType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });

    it("should handle case-insensitive matching", () => {
      fc.assert(
        fc.property(fc.constantFrom(...validBrowsers), (browserType) => {
          const rotator = new UserAgentRotator();
          const ua = rotator.getDefaultUserAgent(browserType);

          // Convert to different cases and test
          const upperUA = ua.toUpperCase();
          const lowerUA = ua.toLowerCase();

          // Should still match regardless of case
          expect(rotator.matchesBrowserType(upperUA, browserType)).toBe(true);
          expect(rotator.matchesBrowserType(lowerUA, browserType)).toBe(true);
        }),
        { numRuns: 100 },
      );
    });
  });
});
