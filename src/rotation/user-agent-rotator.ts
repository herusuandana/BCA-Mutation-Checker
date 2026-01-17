import { BrowserType } from "../types/config";
import { DEFAULT_USER_AGENTS } from "../config/defaults";

/**
 * User agent rotator that manages round-robin rotation of user agent strings
 */
export class UserAgentRotator {
  private userAgents: string[];
  private currentIndex: number = 0;

  /**
   * Create a new user agent rotator
   * @param userAgents - Array of user agent strings to rotate through (optional)
   */
  constructor(userAgents?: string[]) {
    this.userAgents =
      userAgents && userAgents.length > 0 ? [...userAgents] : [];
  }

  /**
   * Get the next user agent in rotation
   * If custom user agents are configured, rotates through them
   * Otherwise, returns default user agent for the browser type
   * @param browserType - Browser type to get user agent for
   * @returns User agent string
   */
  getNextUserAgent(browserType: BrowserType): string {
    if (this.userAgents.length > 0) {
      const userAgent = this.userAgents[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.userAgents.length;
      return userAgent;
    }

    return this.getDefaultUserAgent(browserType);
  }

  /**
   * Get default user agent for a browser type
   * @param browserType - Browser type
   * @returns Default user agent string for the browser
   */
  getDefaultUserAgent(browserType: BrowserType): string {
    const defaultAgents = DEFAULT_USER_AGENTS[browserType];
    if (!defaultAgents || defaultAgents.length === 0) {
      // Fallback to chromium if browser type not found
      return DEFAULT_USER_AGENTS.chromium[0];
    }
    return defaultAgents[0];
  }

  /**
   * Check if user agent string matches browser type
   * @param userAgent - User agent string to check
   * @param browserType - Browser type to match against
   * @returns True if user agent contains appropriate identifiers for browser type
   */
  matchesBrowserType(userAgent: string, browserType: BrowserType): boolean {
    const lowerUA = userAgent.toLowerCase();

    switch (browserType) {
      case "chrome":
        return lowerUA.includes("chrome") && !lowerUA.includes("edg");
      case "edge":
        return lowerUA.includes("edg");
      case "brave":
        return lowerUA.includes("chrome"); // Brave uses Chrome UA
      case "chromium":
        return lowerUA.includes("chrome");
      default:
        return false;
    }
  }

  /**
   * Reset rotation to the beginning
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Get the number of user agents in the pool
   * @returns Number of user agents (0 if using defaults)
   */
  size(): number {
    return this.userAgents.length;
  }

  /**
   * Check if using custom user agents
   * @returns True if custom user agents are configured
   */
  hasCustomUserAgents(): boolean {
    return this.userAgents.length > 0;
  }
}
