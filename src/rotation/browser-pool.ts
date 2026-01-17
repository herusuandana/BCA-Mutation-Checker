import { BrowserType } from "../types/config";

/**
 * Browser pool that manages round-robin rotation of browser types
 */
export class BrowserPool {
  private browsers: BrowserType[];
  private currentIndex: number = 0;

  /**
   * Create a new browser pool
   * @param browsers - Array of browser types to rotate through
   * @throws Error if browsers array is empty
   */
  constructor(browsers: BrowserType[]) {
    if (!browsers || browsers.length === 0) {
      throw new Error("Browser pool must have at least one browser");
    }
    this.browsers = [...browsers]; // Create a copy to avoid external mutations
  }

  /**
   * Get the next browser in rotation (round-robin)
   * @returns Next browser type
   */
  getNextBrowser(): BrowserType {
    const browser = this.browsers[this.currentIndex];
    this.currentIndex = (this.currentIndex + 1) % this.browsers.length;
    return browser;
  }

  /**
   * Get current rotation position
   * @returns Current index in the rotation
   */
  getCurrentIndex(): number {
    return this.currentIndex;
  }

  /**
   * Reset rotation to the beginning
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Get the list of browsers in the pool
   * @returns Copy of browsers array
   */
  getBrowsers(): BrowserType[] {
    return [...this.browsers];
  }

  /**
   * Get the number of browsers in the pool
   * @returns Number of browsers
   */
  size(): number {
    return this.browsers.length;
  }
}
