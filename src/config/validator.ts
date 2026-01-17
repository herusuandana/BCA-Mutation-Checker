import {
  ValidationResult,
  ValidationError,
  BrowserType,
  LogLevel,
} from "../types/config";

/**
 * Valid browser types
 */
const VALID_BROWSERS: BrowserType[] = ["chromium", "chrome", "edge", "brave"];

/**
 * Valid log levels
 */
const VALID_LOG_LEVELS: LogLevel[] = ["debug", "info", "warning", "error"];

/**
 * Minimum interval in milliseconds (5 minutes)
 */
const MIN_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Validate configuration object
 * @param config - Configuration to validate
 * @returns Validation result with errors if any
 */
export function validateConfig(config: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if config is an object
  if (!config || typeof config !== "object") {
    return {
      valid: false,
      errors: [{ field: "config", message: "Configuration must be an object" }],
    };
  }

  // Validate credentials
  if (!config.credentials) {
    errors.push({
      field: "credentials",
      message: "Credentials are required",
    });
  } else {
    if (typeof config.credentials !== "object") {
      errors.push({
        field: "credentials",
        message: "Credentials must be an object",
      });
    } else {
      if (
        !config.credentials.username ||
        typeof config.credentials.username !== "string"
      ) {
        errors.push({
          field: "credentials.username",
          message: "Username is required and must be a string",
          value: config.credentials.username,
        });
      }
      if (
        !config.credentials.password ||
        typeof config.credentials.password !== "string"
      ) {
        errors.push({
          field: "credentials.password",
          message: "Password is required and must be a string",
          value: config.credentials.password,
        });
      }
    }
  }

  // Validate interval
  if (config.interval === undefined || config.interval === null) {
    errors.push({
      field: "interval",
      message: "Interval is required",
    });
  } else if (typeof config.interval !== "number") {
    errors.push({
      field: "interval",
      message: "Interval must be a number",
      value: config.interval,
    });
  } else if (config.interval < MIN_INTERVAL) {
    errors.push({
      field: "interval",
      message: `Interval must be at least ${MIN_INTERVAL}ms (5 minutes)`,
      value: config.interval,
    });
  }

  // Validate browsers
  if (!config.browsers) {
    errors.push({
      field: "browsers",
      message: "Browsers array is required",
    });
  } else if (!Array.isArray(config.browsers)) {
    errors.push({
      field: "browsers",
      message: "Browsers must be an array",
      value: config.browsers,
    });
  } else if (config.browsers.length === 0) {
    errors.push({
      field: "browsers",
      message: "At least one browser must be configured",
      value: config.browsers,
    });
  } else {
    config.browsers.forEach((browser: any, index: number) => {
      if (!VALID_BROWSERS.includes(browser)) {
        errors.push({
          field: `browsers[${index}]`,
          message: `Invalid browser type. Must be one of: ${VALID_BROWSERS.join(", ")}`,
          value: browser,
        });
      }
    });
  }

  // Validate userAgents (optional)
  if (config.userAgents !== undefined) {
    if (!Array.isArray(config.userAgents)) {
      errors.push({
        field: "userAgents",
        message: "User agents must be an array",
        value: config.userAgents,
      });
    } else {
      config.userAgents.forEach((ua: any, index: number) => {
        if (typeof ua !== "string") {
          errors.push({
            field: `userAgents[${index}]`,
            message: "User agent must be a string",
            value: ua,
          });
        }
      });
    }
  }

  // Validate proxy (optional)
  if (config.proxy !== undefined) {
    if (typeof config.proxy !== "object") {
      errors.push({
        field: "proxy",
        message: "Proxy must be an object",
        value: config.proxy,
      });
    } else {
      if (typeof config.proxy.enabled !== "boolean") {
        errors.push({
          field: "proxy.enabled",
          message: "Proxy enabled must be a boolean",
          value: config.proxy.enabled,
        });
      }
      if (!Array.isArray(config.proxy.servers)) {
        errors.push({
          field: "proxy.servers",
          message: "Proxy servers must be an array",
          value: config.proxy.servers,
        });
      } else {
        config.proxy.servers.forEach((server: any, index: number) => {
          if (typeof server !== "object") {
            errors.push({
              field: `proxy.servers[${index}]`,
              message: "Proxy server must be an object",
              value: server,
            });
          } else {
            if (!server.server || typeof server.server !== "string") {
              errors.push({
                field: `proxy.servers[${index}].server`,
                message:
                  "Proxy server address is required and must be a string",
                value: server.server,
              });
            }
            if (
              server.username !== undefined &&
              typeof server.username !== "string"
            ) {
              errors.push({
                field: `proxy.servers[${index}].username`,
                message: "Proxy username must be a string",
                value: server.username,
              });
            }
            if (
              server.password !== undefined &&
              typeof server.password !== "string"
            ) {
              errors.push({
                field: `proxy.servers[${index}].password`,
                message: "Proxy password must be a string",
                value: server.password,
              });
            }
          }
        });
      }
    }
  }

  // Validate webhook (optional)
  if (config.webhook !== undefined) {
    if (typeof config.webhook !== "object") {
      errors.push({
        field: "webhook",
        message: "Webhook must be an object",
        value: config.webhook,
      });
    } else {
      if (!config.webhook.url || typeof config.webhook.url !== "string") {
        errors.push({
          field: "webhook.url",
          message: "Webhook URL is required and must be a string",
          value: config.webhook.url,
        });
      }
      if (config.webhook.retryAttempts !== undefined) {
        if (typeof config.webhook.retryAttempts !== "number") {
          errors.push({
            field: "webhook.retryAttempts",
            message: "Webhook retry attempts must be a number",
            value: config.webhook.retryAttempts,
          });
        } else if (config.webhook.retryAttempts < 0) {
          errors.push({
            field: "webhook.retryAttempts",
            message: "Webhook retry attempts must be non-negative",
            value: config.webhook.retryAttempts,
          });
        }
      }
    }
  }

  // Validate logging
  if (!config.logging) {
    errors.push({
      field: "logging",
      message: "Logging configuration is required",
    });
  } else if (typeof config.logging !== "object") {
    errors.push({
      field: "logging",
      message: "Logging must be an object",
      value: config.logging,
    });
  } else {
    if (!config.logging.level) {
      errors.push({
        field: "logging.level",
        message: "Logging level is required",
      });
    } else if (!VALID_LOG_LEVELS.includes(config.logging.level)) {
      errors.push({
        field: "logging.level",
        message: `Invalid log level. Must be one of: ${VALID_LOG_LEVELS.join(", ")}`,
        value: config.logging.level,
      });
    }
    if (
      config.logging.outputPath !== undefined &&
      typeof config.logging.outputPath !== "string"
    ) {
      errors.push({
        field: "logging.outputPath",
        message: "Logging output path must be a string",
        value: config.logging.outputPath,
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
