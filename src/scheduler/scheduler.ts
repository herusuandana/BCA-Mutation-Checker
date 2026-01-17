/**
 * Scheduler for interval-based mutation checks
 */

import { Logger } from "../logging/logger";
import { SchedulerConfig, CheckResult, IScheduler } from "./types";
import { Config } from "../types/config";
import { SessionManager } from "../session/session-manager";
import { BrowserPool } from "../rotation/browser-pool";
import { UserAgentRotator } from "../rotation/user-agent-rotator";
import { ProxyRotator } from "../rotation/proxy-rotator";
import { MutationScraper } from "../scraper/mutation-scraper";
import { DataParser } from "../scraper/data-parser";
import { WebhookClient } from "../webhook/webhook-client";
import { ErrorHandler } from "../error/error-handler";
import { ErrorContext } from "../error/types";

export class Scheduler implements IScheduler {
  private config: SchedulerConfig;
  private logger: Logger;
  private timerId: NodeJS.Timeout | null = null;
  private checkInProgress: boolean = false;
  private stopped: boolean = false;

  // Component instances
  private systemConfig: Config;
  private sessionManager: SessionManager;
  private browserPool: BrowserPool;
  private userAgentRotator: UserAgentRotator;
  private proxyRotator: ProxyRotator | null = null;
  private dataParser: DataParser;
  private webhookClient: WebhookClient | null = null;
  private errorHandler: ErrorHandler;

  /**
   * Minimum interval: 5 minutes (300000 ms)
   */
  private static readonly MIN_INTERVAL = 300000;

  constructor(config: SchedulerConfig, systemConfig: Config, logger: Logger) {
    // Validate minimum interval
    const minInterval = config.minInterval || Scheduler.MIN_INTERVAL;
    if (config.interval < minInterval) {
      throw new Error(
        `Interval must be at least ${minInterval}ms (${minInterval / 60000} minutes)`,
      );
    }

    this.config = config;
    this.systemConfig = systemConfig;
    this.logger = logger;

    // Initialize components
    this.sessionManager = new SessionManager(logger);
    this.browserPool = new BrowserPool(systemConfig.browsers);
    this.userAgentRotator = new UserAgentRotator(systemConfig.userAgents);
    this.dataParser = new DataParser(logger);
    this.errorHandler = new ErrorHandler(logger);

    // Initialize proxy rotator if enabled
    if (systemConfig.proxy?.enabled && systemConfig.proxy.servers.length > 0) {
      this.proxyRotator = new ProxyRotator(systemConfig.proxy.servers);
    }

    // Initialize webhook client if configured
    if (systemConfig.webhook?.url) {
      this.webhookClient = new WebhookClient(
        {
          url: systemConfig.webhook.url,
          retryAttempts: systemConfig.webhook.retryAttempts,
        },
        logger,
      );
    }
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.timerId) {
      this.logger.warning("Scheduler already running");
      return;
    }

    this.stopped = false;
    this.logger.info("Starting scheduler", {
      interval: this.config.interval,
      intervalMinutes: this.config.interval / 60000,
    });

    // Execute first check immediately
    this.scheduleNextCheck(0);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.timerId) {
      this.logger.warning("Scheduler not running");
      return;
    }

    this.logger.info("Stopping scheduler");
    this.stopped = true;

    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  /**
   * Check if scheduler is running
   */
  isRunning(): boolean {
    return this.timerId !== null || this.checkInProgress;
  }

  /**
   * Execute a mutation check
   * This is a placeholder that will be overridden or extended
   */
  async executeCheck(): Promise<CheckResult> {
    // Check for concurrent execution
    if (this.checkInProgress) {
      this.logger.warning("Check already in progress, skipping");
      return {
        success: false,
        timestamp: new Date(),
        error: new Error("Check already in progress"),
      };
    }

    this.checkInProgress = true;
    const startTime = new Date();

    try {
      this.logger.info("Starting mutation check");

      // Placeholder for actual check logic
      // This will be implemented in the main integration
      await this.performCheck();

      const result: CheckResult = {
        success: true,
        timestamp: startTime,
      };

      this.logger.info("Mutation check completed successfully");
      return result;
    } catch (error) {
      this.logger.error("Mutation check failed", { error });
      return {
        success: false,
        timestamp: startTime,
        error: error as Error,
      };
    } finally {
      this.checkInProgress = false;
    }
  }

  /**
   * Perform the actual check - integrates all components
   */
  protected async performCheck(): Promise<void> {
    let session: any = null;
    const maxAttempts = 3;

    try {
      // Get next browser and rotation settings
      const browserType = this.browserPool.getNextBrowser();
      const userAgent = this.userAgentRotator.getNextUserAgent(browserType);
      const proxy = this.proxyRotator?.getNextProxy() || null;

      this.logger.info("Starting mutation check", {
        browserType,
        hasProxy: !!proxy,
      });

      // Create session
      session = await this.sessionManager.createSession({
        browserType,
        userAgent,
        proxy: proxy || undefined,
        headless: true,
      });

      // Login
      await this.sessionManager.login(session, this.systemConfig.credentials);

      // Create scraper and navigate to mutation page
      const scraper = new MutationScraper(session.page, this.logger);
      await scraper.navigateToMutationPage();

      // Scrape mutations
      const rawMutations = await scraper.scrape();

      // Parse mutations
      const mutations = this.dataParser.parseAll(rawMutations);

      this.logger.info("Mutations retrieved", {
        count: mutations.length,
      });

      // Send to webhook if configured
      if (this.webhookClient && mutations.length > 0) {
        try {
          await this.webhookClient.send(
            mutations,
            this.systemConfig.credentials.username,
          );
        } catch (error) {
          // Handle webhook error but don't fail the check
          const errorContext: ErrorContext = {
            operation: "webhook-delivery",
            attempt: 1,
            maxAttempts: this.systemConfig.webhook?.retryAttempts || 3,
            timestamp: new Date(),
          };
          this.errorHandler.handleError(error as Error, errorContext);
        }
      }

      // Logout
      await this.sessionManager.logout(session);
    } catch (error) {
      // Handle error with error handler
      const errorContext: ErrorContext = {
        operation: "mutation-check",
        attempt: 1,
        maxAttempts,
        timestamp: new Date(),
      };

      const action = this.errorHandler.handleError(
        error as Error,
        errorContext,
      );

      // Mark proxy as failed if it was a network error
      if (
        this.proxyRotator &&
        session?.proxy &&
        action.type === "retry" &&
        (error as Error).message.toLowerCase().includes("network")
      ) {
        this.proxyRotator.markProxyFailed({ server: session.proxy });
      }

      // Re-throw for scheduler to handle
      throw error;
    } finally {
      // Always cleanup session
      if (session) {
        await this.sessionManager.closeSession(session);
      }
    }
  }

  /**
   * Schedule the next check
   */
  private scheduleNextCheck(delay: number = this.config.interval): void {
    if (this.stopped) {
      return;
    }

    this.timerId = setTimeout(async () => {
      await this.executeCheck();

      // Schedule next check if not stopped
      if (!this.stopped) {
        this.scheduleNextCheck();
      }
    }, delay);
  }
}
