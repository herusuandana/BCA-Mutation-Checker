# BCA Mutation Checker

Automated BCA (Bank Central Asia) account mutation checker with browser rotation, user agent switching, proxy support, and webhook integration. Built with TypeScript and Playwright for reliable, resource-efficient operation.

## Features

- ✅ **Automated Login & Logout** - Secure authentication with BCA portal
- ✅ **Browser Rotation** - Round-robin rotation across Chromium, Chrome, Edge, and Brave
- ✅ **User Agent Rotation** - Automatic user agent switching for each browser type
- ✅ **Proxy Support** - Optional proxy rotation with failure tracking
- ✅ **Webhook Integration** - Real-time mutation notifications with retry logic
- ✅ **Interval-based Checking** - Configurable check intervals (minimum 5 minutes)
- ✅ **Concurrent Check Prevention** - Prevents overlapping checks
- ✅ **Error Recovery** - Automatic error handling and recovery
- ✅ **Resource Cleanup** - Proper browser session management
- ✅ **Comprehensive Logging** - Multi-level logging with credential sanitization
- ✅ **Property-based Testing** - 154 tests with 100+ iterations each
- ✅ **Cross-platform** - Works on Linux and Windows

## Requirements

- **Node.js** v16 or higher
- **npm** or **yarn**
- **Playwright** (installed automatically)

## Installation

### 1. Clone or Download

```bash
git clone <repository-url>
cd bca-mutation-checker
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Install Playwright Browsers

```bash
npx playwright install chromium
```

Optional browsers (for rotation):

```bash
npx playwright install chrome msedge
```

### 4. Build the Project

```bash
npm run build
```

## Configuration

### Create Configuration File

Copy the example configuration:

```bash
cp config/config.example.json config/config.json
```

### Configuration Format

Edit `config/config.json` with your settings:

```json
{
  "credentials": {
    "username": "your-bca-username",
    "password": "your-bca-password"
  },
  "interval": 300000,
  "browsers": ["chromium", "chrome", "edge"],
  "userAgents": [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
  ],
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
      }
    ]
  },
  "webhook": {
    "url": "https://your-webhook-endpoint.com/mutations",
    "retryAttempts": 3
  },
  "logging": {
    "level": "info"
  }
}
```

### Configuration Options

#### Required Fields

- **credentials.username** (string): Your BCA username
- **credentials.password** (string): Your BCA password
- **interval** (number): Check interval in milliseconds (minimum: 300000 = 5 minutes)
- **browsers** (array): List of browsers to rotate through
  - Supported: `"chromium"`, `"chrome"`, `"edge"`, `"brave"`
- **logging.level** (string): Log level
  - Options: `"debug"`, `"info"`, `"warning"`, `"error"`

#### Optional Fields

- **userAgents** (array): Custom user agent strings for rotation
  - If not provided, uses browser-specific defaults
- **proxy.enabled** (boolean): Enable proxy rotation
- **proxy.servers** (array): List of proxy servers
  - **server** (string): Proxy address in `host:port` format
  - **username** (string, optional): Proxy authentication username
  - **password** (string, optional): Proxy authentication password
- **webhook.url** (string): Webhook endpoint URL
- **webhook.retryAttempts** (number): Number of retry attempts (default: 3)

## Usage

### Start the Checker

```bash
npm start
```

### With Custom Config Path

```bash
npm start -- --config /path/to/config.json
```

### Show Help

```bash
npm start -- --help
```

### Show Version

```bash
npm start -- --version
```

### Development Mode

```bash
npm run dev
```

## How It Works

1. **Initialization**
   - Loads configuration from file
   - Initializes logger with configured level
   - Creates scheduler with interval settings

2. **Check Cycle**
   - Selects next browser from rotation pool
   - Selects next user agent (custom or browser-specific default)
   - Selects next proxy (if enabled)
   - Launches browser with selected settings
   - Logs into BCA portal
   - Navigates to mutation/transaction page
   - Scrapes transaction data from HTML table
   - Parses raw data into structured format
   - Sends to webhook (if configured)
   - Logs out from BCA portal
   - Closes browser and cleans up resources

3. **Error Handling**
   - Categorizes errors (auth, network, browser, parsing, webhook, config)
   - Determines recovery action (retry, skip, fallback, fatal)
   - Logs errors with context
   - Marks failed proxies for skipping
   - Continues operation for recoverable errors

4. **Scheduling**
   - Waits for configured interval
   - Prevents concurrent checks
   - Repeats cycle until stopped

## Testing

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test -- tests/config-validation.test.ts
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Test Coverage

The project includes 154 comprehensive tests:

- **Configuration Tests** (25 tests)
  - Validation, defaults, field support
- **Rotation Tests** (36 tests)
  - Browser, user agent, and proxy rotation
- **Logging Tests** (30 tests)
  - Credential security, error structure, log levels
- **Session Tests** (18 tests)
  - Authentication, cleanup, headless mode, proxy routing
- **Scraper Tests** (19 tests)
  - Navigation, data completeness, data structure
- **Webhook Tests** (12 tests)
  - Delivery, HTTP method, payload structure
- **Error Handling Tests** (7 tests)
  - Error recovery and categorization
- **Scheduler Tests** (7 tests)
  - Concurrent check prevention, interval enforcement

All tests use property-based testing with fast-check (100+ iterations per test).

## Logging

### Log Levels

- **debug**: Detailed execution flow, selector queries, raw data
- **info**: Check start/completion, successful operations, rotation events
- **warning**: Recoverable errors, fallback activations, retry attempts
- **error**: Failed operations, critical errors, validation failures

### Log Format

```
[2026-01-17T10:00:00.000Z] [INFO] [Component] Message {"context":"data"}
```

### Credential Sanitization

All logs automatically sanitize sensitive data:

- Passwords are replaced with `[REDACTED]`
- Usernames are replaced with `[REDACTED]`
- Proxy credentials are sanitized

## Webhook Integration

### Payload Format

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

### Retry Logic

- Uses exponential backoff (1s, 2s, 4s, 8s, ...)
- Configurable retry attempts (default: 3)
- Logs errors after exhausting retries
- Continues operation even if webhook fails

## Troubleshooting

### Browser Launch Fails

```bash
# Reinstall Playwright browsers
npx playwright install chromium
```

### Authentication Fails

- Verify credentials in config.json
- Check if BCA portal is accessible
- Try with different browser type
- Check proxy settings if enabled

### Concurrent Check Warning

This is normal - the system prevents overlapping checks. Wait for the current check to complete.

### Proxy Connection Fails

- Verify proxy server address and credentials
- Check if proxy is accessible
- Failed proxies are automatically skipped in rotation

## Security Considerations

- **Never commit** `config/config.json` to version control
- Store credentials securely (use environment variables in production)
- Use HTTPS for webhook endpoints
- Enable credential sanitization in logs (enabled by default)
- Run in headless mode for production (enabled by default)

## Performance

- **Memory**: ~100-200MB per browser instance
- **CPU**: Low usage during waiting, moderate during scraping
- **Network**: Minimal bandwidth usage
- **Disk**: Logs grow over time (implement log rotation if needed)

## Supported Node.js Versions

Tested and verified on:

- Node.js v16.x
- Node.js v18.x (LTS)
- Node.js v20.x (LTS)
- Node.js v21.x
- Node.js v22.x
- Node.js v23.x
- Node.js v24.x

## Project Structure

```
bca-mutation-checker/
├── config/
│   ├── config.example.json    # Example configuration
│   └── config.json             # Your configuration (gitignored)
├── src/
│   ├── config/                 # Configuration loader and validator
│   ├── error/                  # Error handling system
│   ├── logging/                # Logging system with sanitization
│   ├── rotation/               # Browser, UA, and proxy rotation
│   ├── scheduler/              # Interval-based scheduler
│   ├── scraper/                # Mutation scraper and parser
│   ├── session/                # Browser session management
│   ├── types/                  # TypeScript type definitions
│   ├── webhook/                # Webhook client
│   └── index.ts                # Main entry point
├── tests/                      # Comprehensive test suite
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass (`npm test`)
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This tool is for educational and personal use only. Use responsibly and in accordance with BCA's terms of service. The authors are not responsible for any misuse or violations.

## Support

For issues, questions, or feature requests, please open an issue on the repository.
