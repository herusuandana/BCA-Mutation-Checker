/**
 * Sensitive field names that should be redacted
 */
const SENSITIVE_FIELDS = [
  "password",
  "passwd",
  "pwd",
  "secret",
  "token",
  "apikey",
  "api_key",
  "authorization",
  "credential",
];

/**
 * Redaction placeholder
 */
const REDACTED = "[REDACTED]";

/**
 * Sanitize a string by redacting sensitive information
 * @param text - Text to sanitize
 * @param sensitiveValues - Additional sensitive values to redact
 * @returns Sanitized text
 */
export function sanitizeString(
  text: string,
  sensitiveValues: string[] = [],
): string {
  let sanitized = text;

  // Redact sensitive values
  sensitiveValues.forEach((value) => {
    if (value && value.length > 0 && value.trim().length > 0) {
      // Escape special regex characters
      const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(escapedValue, "gi");
      sanitized = sanitized.replace(regex, REDACTED);
    }
  });

  return sanitized;
}

/**
 * Sanitize an object by redacting sensitive fields
 * @param obj - Object to sanitize
 * @param sensitiveValues - Additional sensitive values to redact
 * @returns Sanitized object (deep copy)
 */
export function sanitizeObject(obj: any, sensitiveValues: string[] = []): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle primitive types
  if (typeof obj !== "object") {
    if (typeof obj === "string") {
      return sanitizeString(obj, sensitiveValues);
    }
    return obj;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, sensitiveValues));
  }

  // Handle objects
  const sanitized: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const lowerKey = key.toLowerCase();

      // Check if this is a sensitive field
      if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
        sanitized[key] = REDACTED;
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        // Recursively sanitize nested objects
        sanitized[key] = sanitizeObject(obj[key], sensitiveValues);
      } else if (typeof obj[key] === "string") {
        // Sanitize string values
        sanitized[key] = sanitizeString(obj[key], sensitiveValues);
      } else {
        // Keep other primitive values as-is
        sanitized[key] = obj[key];
      }
    }
  }

  return sanitized;
}

/**
 * Sanitize log message and context
 * @param message - Log message
 * @param context - Log context
 * @param credentials - Credentials to redact (username, password)
 * @returns Sanitized message and context
 */
export function sanitizeLog(
  message: string,
  context: any,
  credentials?: { username?: string; password?: string },
): { message: string; context: any } {
  const sensitiveValues: string[] = [];

  // Add credentials to sensitive values
  if (credentials) {
    if (credentials.username && credentials.username.trim().length > 0) {
      sensitiveValues.push(credentials.username);
    }
    if (credentials.password && credentials.password.trim().length > 0) {
      sensitiveValues.push(credentials.password);
    }
  }

  return {
    message: sanitizeString(message, sensitiveValues),
    context: sanitizeObject(context, sensitiveValues),
  };
}

/**
 * Check if a string contains sensitive information
 * @param text - Text to check
 * @param sensitiveValues - Sensitive values to check for
 * @returns True if text contains sensitive information
 */
export function containsSensitiveInfo(
  text: string,
  sensitiveValues: string[] = [],
): boolean {
  // Check for sensitive values
  for (const value of sensitiveValues) {
    if (value && value.length > 0 && text.includes(value)) {
      return true;
    }
  }

  return false;
}
