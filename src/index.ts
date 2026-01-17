/**
 * Main entry point for BCA Mutation Checker
 */

import { loadConfig } from "./config";
import { Logger } from "./logging";
import { Scheduler } from "./scheduler";
import { Config } from "./types/config";

/**
 * Main application class
 */
export class Application {
  private logger: Logger;
  private scheduler?: Scheduler;
  private configPath: string;
  private config?: Config;

  constructor(configPath: string = "./config/config.json") {
    this.configPath = configPath;
    this.logger = new Logger("Application", { level: "info" });
  }

  /**
   * Start the application
   */
  async start(): Promise<void> {
    try {
      this.logger.info("Starting BCA Mutation Checker");

      // Load configuration
      this.config = loadConfig(this.configPath);
      this.logger.info("Configuration loaded successfully");

      // Update logger level from config
      this.logger.setLevel(this.config.logging.level);

      // Create scheduler with system config
      this.scheduler = new Scheduler(
        { interval: this.config.interval },
        this.config,
        this.logger,
      );

      // Setup graceful shutdown
      this.setupGracefulShutdown();

      // Start scheduler
      this.scheduler.start();

      this.logger.info("BCA Mutation Checker started successfully", {
        interval: this.config.interval,
        intervalMinutes: this.config.interval / 60000,
        browsers: this.config.browsers,
        proxyEnabled: this.config.proxy?.enabled || false,
        webhookConfigured: !!this.config.webhook?.url,
      });
    } catch (error) {
      this.logger.error("Failed to start application", { error });
      process.exit(1);
    }
  }

  /**
   * Stop the application
   */
  async stop(): Promise<void> {
    this.logger.info("Stopping BCA Mutation Checker");

    if (this.scheduler) {
      this.scheduler.stop();
    }

    this.logger.info("BCA Mutation Checker stopped");
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      this.logger.info(`Received ${signal}, shutting down gracefully`);
      await this.stop();
      process.exit(0);
    };

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(): {
  configPath?: string;
  help?: boolean;
  version?: boolean;
} {
  const args = process.argv.slice(2);
  const result: { configPath?: string; help?: boolean; version?: boolean } = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--help" || arg === "-h") {
      result.help = true;
    } else if (arg === "--version" || arg === "-v") {
      result.version = true;
    } else if (arg === "--config" || arg === "-c") {
      result.configPath = args[++i];
    }
  }

  return result;
}

/**
 * Show help message
 */
function showHelp(): void {
  console.log(`
BCA Mutation Checker - Automated BCA transaction monitoring

Usage:
  npm start [options]

Options:
  --config, -c <path>   Path to configuration file (default: ./config/config.json)
  --help, -h            Show this help message
  --version, -v         Show version information

Examples:
  npm start
  npm start --config ./my-config.json
  npm start --help

Configuration:
  Create a config.json file with the following structure:
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

For more information, see README.md
`);
}

/**
 * Show version information
 */
function showVersion(): void {
  const packageJson = require("../package.json");
  console.log(`BCA Mutation Checker v${packageJson.version}`);
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  const args = parseArgs();

  if (args.help) {
    showHelp();
    process.exit(0);
  }

  if (args.version) {
    showVersion();
    process.exit(0);
  }

  const configPath = args.configPath || "./config/config.json";
  const app = new Application(configPath);

  await app.start();
}

// Run main if this is the entry point
if (require.main === module) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
