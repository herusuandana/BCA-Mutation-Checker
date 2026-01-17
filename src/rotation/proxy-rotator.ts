import { ProxyConfig } from "../types/config";

/**
 * Proxy rotator that manages round-robin rotation with failure tracking
 */
export class ProxyRotator {
  private proxies: ProxyConfig[];
  private currentIndex: number = 0;
  private failedProxies: Set<string>;

  /**
   * Create a new proxy rotator
   * @param proxies - Array of proxy configurations to rotate through
   */
  constructor(proxies: ProxyConfig[]) {
    this.proxies = proxies ? [...proxies] : [];
    this.failedProxies = new Set();
  }

  /**
   * Get the next proxy in rotation (round-robin)
   * Skips proxies that have been marked as failed
   * @returns Next proxy configuration or null if no proxies available
   */
  getNextProxy(): ProxyConfig | null {
    if (this.proxies.length === 0) {
      return null;
    }

    // Get list of available (non-failed) proxies
    const availableProxies = this.proxies.filter(
      (proxy) => !this.failedProxies.has(this.getProxyKey(proxy)),
    );

    if (availableProxies.length === 0) {
      // All proxies have failed, return null
      return null;
    }

    // Find next available proxy starting from current index
    let attempts = 0;
    while (attempts < this.proxies.length) {
      const proxy = this.proxies[this.currentIndex];
      this.currentIndex = (this.currentIndex + 1) % this.proxies.length;

      if (!this.failedProxies.has(this.getProxyKey(proxy))) {
        return proxy;
      }

      attempts++;
    }

    return null;
  }

  /**
   * Mark a proxy as failed
   * Failed proxies will be skipped in rotation until reset
   * @param proxy - Proxy configuration to mark as failed
   */
  markProxyFailed(proxy: ProxyConfig): void {
    this.failedProxies.add(this.getProxyKey(proxy));
  }

  /**
   * Reset failure tracking
   * All proxies will be available for rotation again
   */
  resetFailures(): void {
    this.failedProxies.clear();
  }

  /**
   * Reset rotation to the beginning
   */
  reset(): void {
    this.currentIndex = 0;
  }

  /**
   * Get the number of proxies in the pool
   * @returns Number of proxies
   */
  size(): number {
    return this.proxies.length;
  }

  /**
   * Get the number of available (non-failed) proxies
   * @returns Number of available proxies
   */
  availableCount(): number {
    return this.proxies.filter(
      (proxy) => !this.failedProxies.has(this.getProxyKey(proxy)),
    ).length;
  }

  /**
   * Check if a proxy has been marked as failed
   * @param proxy - Proxy configuration to check
   * @returns True if proxy is marked as failed
   */
  isProxyFailed(proxy: ProxyConfig): boolean {
    return this.failedProxies.has(this.getProxyKey(proxy));
  }

  /**
   * Get unique key for a proxy configuration
   * @param proxy - Proxy configuration
   * @returns Unique key string
   */
  private getProxyKey(proxy: ProxyConfig): string {
    return `${proxy.server}:${proxy.username || ""}`;
  }

  /**
   * Get list of all proxies
   * @returns Copy of proxies array
   */
  getProxies(): ProxyConfig[] {
    return [...this.proxies];
  }
}
