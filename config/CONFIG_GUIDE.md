# Configuration Guide

This guide explains all configuration options for the BCA Mutation Checker.

## Quick Start

1. Copy the example configuration:

   ```bash
   cp config/config.example.json config/config.json
   ```

2. Edit `config/config.json` with your settings

3. Start the checker:
   ```bash
   npm start
   ```

## Configuration Structure

```json
{
  "credentials": { ... },
  "interval": 300000,
  "browsers": [ ... ],
  "userAgents": [ ... ],
  "proxy": { ... },
  "webhook": { ... },
  "logging": { ... }
}
```

## Required Fields

### credentials (object, required)

Your BCA online banking credentials.

```json
{
  "credentials": {
    "username": "your-bca-username",
    "password": "your-bca-password"
  }
}
```

- **username** (string, required): Your BCA username/user ID
- **password** (string, required): Your BCA password

**Security Notes:**

- Never commit this file to version control
- Use environment variables in production
- Credentials are automatically sanitized in logs

### interval (number, required)

Check interval in milliseconds.

```json
{
  "interval": 300000
}
```

- **Minimum**: 300000 (5 minutes)
- **Recommended**: 300000-600000 (5-10 minutes)
- **Example values**:
  - 300000 = 5 minutes
  - 600000 = 10 minutes
  - 900000 = 15 minutes
  - 1800000 = 30 minutes
  - 3600000 = 1 hour

**Notes:**

- Values below 300000 will cause an error
- Shorter intervals may trigger rate limiting
- Longer intervals reduce server load

### browsers (array, required)

List of browsers to rotate through.

```json
{
  "browsers": ["chromium", "chrome", "edge", "brave"]
}
```

**Supported browsers:**

- `"chromium"` - Chromium (always available)
- `"chrome"` - Google Chrome (requires installation)
- `"edge"` - Microsoft Edge (requires installation)
- `"brave"` - Brave Browser (requires installation)

**Installation:**

```bash
# Install all browsers
npx playwright install chromium chrome msedge

# Or install specific browsers
npx playwright install chromium
npx playwright install chrome
npx playwright install msedge
```

**Rotation behavior:**

- Round-robin: cycles through browsers in order
- Example: [chromium, chrome, edge] → chromium → chrome → edge → chromium → ...
- Fallback: if a browser fails, tries the next one

**Recommendations:**

- Use at least 2 browsers for better rotation
- Chromium is the most stable and lightweight
- Chrome and Edge provide better compatibility

### logging.level (string, required)

Log verbosity level.

```json
{
  "logging": {
    "level": "info"
  }
}
```

**Available levels:**

- `"debug"` - Detailed execution flow, selector queries, raw data
- `"info"` - Check start/completion, successful operations, rotation events
- `"warning"` - Recoverable errors, fallback activations, retry attempts
- `"error"` - Failed operations, critical errors, validation failures

**Recommendations:**

- Development: `"debug"` or `"info"`
- Production: `"info"` or `"warning"`
- Troubleshooting: `"debug"`

## Optional Fields

### userAgents (array, optional)

Custom user agent strings for rotation.

```json
{
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ]
}
```

**Behavior:**

- If provided: rotates through custom user agents
- If empty/omitted: uses browser-specific defaults
- Rotation: round-robin across all user agents

**Default user agents (when not specified):**

- Chromium: Latest Chromium user agent
- Chrome: Latest Chrome user agent
- Edge: Latest Edge user agent
- Brave: Latest Brave user agent (Chrome-based)

**Recommendations:**

- Use recent user agent strings (2023-2024)
- Match user agents to your browser list
- Include different OS variants (Windows, Mac, Linux)
- Update periodically to stay current

**Example user agents:**

```json
{
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ]
}
```

### proxy (object, optional)

Proxy server configuration with rotation support.

```json
{
  "proxy": {
    "enabled": true,
    "servers": [
      {
        "server": "proxy1.example.com:8080",
        "username": "proxy-user",
        "password": "proxy-pass"
      },
      {
        "server": "proxy2.example.com:8080"
      },
      {
        "server": "192.168.1.100:3128"
      }
    ]
  }
}
```

**Fields:**

- **enabled** (boolean, required): Enable/disable proxy rotation
- **servers** (array, required if enabled): List of proxy servers
  - **server** (string, required): Proxy address in `host:port` format
  - **username** (string, optional): Proxy authentication username
  - **password** (string, optional): Proxy authentication password

**Rotation behavior:**

- Round-robin: cycles through proxies in order
- Failure tracking: failed proxies are skipped
- Reset: failures are reset after all proxies fail

**Use cases:**

- Hide your IP address
- Bypass rate limiting
- Access from different locations
- Load balancing across proxies

**Recommendations:**

- Use reliable proxy providers
- Test proxies before adding to config
- Include at least 2-3 proxies for rotation
- Monitor proxy performance in logs

**Disable proxies:**

```json
{
  "proxy": {
    "enabled": false,
    "servers": []
  }
}
```

### webhook (object, optional)

Webhook endpoint for real-time mutation notifications.

```json
{
  "webhook": {
    "url": "https://your-webhook-endpoint.com/mutations",
    "retryAttempts": 3
  }
}
```

**Fields:**

- **url** (string, required if webhook is configured): Webhook endpoint URL
- **retryAttempts** (number, optional): Number of retry attempts (default: 3)

**Payload format:**

```json
{
  "timestamp": "2026-01-17T10:00:00.000Z",
  "account": "username",
  "mutations": [
    {
      "date": "2026-01-17T00:00:00.000Z",
      "description": "TRANSFER FROM ACCOUNT",
      "amount": 1000000,
      "type": "credit",
      "balance": 5000000
    }
  ]
}
```

**Retry logic:**

- Uses exponential backoff: 1s, 2s, 4s, 8s, ...
- Logs errors after exhausting retries
- Continues operation even if webhook fails

**Recommendations:**

- Use HTTPS endpoints for security
- Implement webhook authentication on your server
- Handle duplicate notifications (same mutations may be sent multiple times)
- Return 2xx status code for successful delivery

**Disable webhook:**

```json
{
  "webhook": null
}
```

Or omit the field entirely.

## Configuration Examples

### Minimal Configuration

```json
{
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "info"
  }
}
```

### Production Configuration

```json
{
  "credentials": {
    "username": "your-username",
    "password": "your-password"
  },
  "interval": 600000,
  "browsers": ["chromium", "chrome", "edge"],
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
  ],
  "proxy": {
    "enabled": true,
    "servers": [
      {
        "server": "proxy1.example.com:8080",
        "username": "user1",
        "password": "pass1"
      },
      {
        "server": "proxy2.example.com:8080",
        "username": "user2",
        "password": "pass2"
      }
    ]
  },
  "webhook": {
    "url": "https://api.example.com/bca-mutations",
    "retryAttempts": 5
  },
  "logging": {
    "level": "warning"
  }
}
```

### Development Configuration

```json
{
  "credentials": {
    "username": "test-username",
    "password": "test-password"
  },
  "interval": 300000,
  "browsers": ["chromium"],
  "logging": {
    "level": "debug"
  }
}
```

## Environment Variables

You can use environment variables for sensitive data:

```bash
# Set environment variables
export BCA_USERNAME="your-username"
export BCA_PASSWORD="your-password"
export WEBHOOK_URL="https://your-webhook.com/mutations"
```

Then reference them in your application code (requires modification).

## Validation

The system validates your configuration on startup:

- **Required fields**: Must be present
- **Data types**: Must match expected types
- **Value ranges**: Must be within valid ranges
- **Browser availability**: Warns if browsers are not installed

**Common validation errors:**

1. **Missing required field**

   ```
   Error: Missing required field: credentials.username
   ```

   Solution: Add the missing field to config.json

2. **Invalid interval**

   ```
   Error: Interval must be at least 300000ms (5 minutes)
   ```

   Solution: Increase interval to at least 300000

3. **Invalid browser**

   ```
   Error: Unsupported browser type: firefox
   ```

   Solution: Use supported browsers: chromium, chrome, edge, brave

4. **Invalid log level**
   ```
   Error: Invalid log level: trace
   ```
   Solution: Use valid levels: debug, info, warning, error

## Security Best Practices

1. **Never commit config.json**
   - Add to .gitignore (already included)
   - Use config.example.json as template

2. **Protect credentials**
   - Use environment variables in production
   - Encrypt config file if storing on disk
   - Rotate passwords regularly

3. **Secure webhook endpoint**
   - Use HTTPS only
   - Implement authentication
   - Validate incoming requests
   - Rate limit requests

4. **Monitor logs**
   - Review logs regularly
   - Check for authentication failures
   - Monitor proxy failures
   - Watch for unusual patterns

5. **Update regularly**
   - Keep dependencies updated
   - Update user agents periodically
   - Review and update proxy list
   - Check for security advisories

## Troubleshooting

### Configuration not loading

- Check JSON syntax (use a JSON validator)
- Verify file path is correct
- Check file permissions
- Look for error messages in logs

### Browser not found

- Install missing browsers: `npx playwright install <browser>`
- Check browser name spelling
- Verify Playwright installation

### Proxy connection fails

- Test proxy connectivity manually
- Verify proxy credentials
- Check proxy server status
- Review proxy logs

### Webhook not receiving data

- Verify webhook URL is accessible
- Check webhook server logs
- Test webhook endpoint manually
- Review retry attempts in logs

## Support

For configuration help:

1. Check this guide
2. Review example configurations
3. Check logs for error messages
4. Open an issue on the repository
