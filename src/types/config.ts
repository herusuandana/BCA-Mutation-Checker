/**
 * Browser types supported by the system
 */
export type BrowserType = "chromium" | "chrome" | "edge" | "brave";

/**
 * Log levels for the logging system
 */
export type LogLevel = "debug" | "info" | "warning" | "error";

/**
 * User credentials for BCA authentication
 */
export interface Credentials {
  username: string;
  password: string;
}

/**
 * Proxy server configuration
 */
export interface ProxyConfig {
  server: string; // host:port format
  username?: string;
  password?: string;
}

/**
 * Proxy settings including enabled state and server list
 */
export interface ProxySettings {
  enabled: boolean;
  servers: ProxyConfig[];
}

/**
 * Webhook configuration for mutation data delivery
 */
export interface WebhookSettings {
  url: string;
  retryAttempts?: number;
}

/**
 * Logging configuration
 */
export interface LoggingSettings {
  level: LogLevel;
  outputPath?: string;
}

/**
 * Complete system configuration
 */
export interface Config {
  credentials: Credentials;
  interval: number; // milliseconds
  browsers: BrowserType[];
  userAgents?: string[];
  proxy?: ProxySettings;
  webhook?: WebhookSettings;
  logging: LoggingSettings;
}

/**
 * Validation error details
 */
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

/**
 * Result of configuration validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}
