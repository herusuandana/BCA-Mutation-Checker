import { Config, ProxySettings } from "../types/config";

/**
 * Default user agents for each browser type
 */
export const DEFAULT_USER_AGENTS = {
  chromium: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ],
  chrome: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ],
  edge: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
  ],
  brave: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ],
};

/**
 * Default proxy settings (disabled)
 */
export const DEFAULT_PROXY_SETTINGS: ProxySettings = {
  enabled: false,
  servers: [],
};

/**
 * Default webhook retry attempts
 */
export const DEFAULT_WEBHOOK_RETRY_ATTEMPTS = 3;

/**
 * Apply default values to configuration
 * @param config - Partial configuration object
 * @returns Complete configuration with defaults applied
 */
export function applyDefaults(config: Partial<Config>): Config {
  const result: Config = {
    credentials: config.credentials!,
    interval: config.interval!,
    browsers: config.browsers!,
    logging: config.logging!,
    userAgents: config.userAgents || [],
    proxy: config.proxy || { ...DEFAULT_PROXY_SETTINGS },
    webhook: config.webhook
      ? {
          url: config.webhook.url,
          retryAttempts:
            config.webhook.retryAttempts ?? DEFAULT_WEBHOOK_RETRY_ATTEMPTS,
        }
      : undefined,
  };

  // Ensure proxy has default structure if provided
  if (result.proxy) {
    result.proxy = {
      enabled: result.proxy.enabled ?? DEFAULT_PROXY_SETTINGS.enabled,
      servers: result.proxy.servers || DEFAULT_PROXY_SETTINGS.servers,
    };
  }

  return result;
}
