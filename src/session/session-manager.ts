/**
 * Browser session manager
 * Handles browser launch, login, logout, and cleanup
 */

import { chromium, firefox, webkit, Browser } from "playwright";
import {
  BrowserSession,
  SessionOptions,
  LoginCredentials,
  ISessionManager,
} from "./types";
import { Logger } from "../logging/logger";

/**
 * BCA Portal URLs
 */
const BCA_LOGIN_URL = "https://ibank.klikbca.com";
const BCA_LOGOUT_URL =
  "https://ibank.klikbca.com/authentication.do?value(actions)=logout";

export class SessionManager implements ISessionManager {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Create a new browser session
   */
  async createSession(options: SessionOptions): Promise<BrowserSession> {
    this.logger.debug("Creating browser session", {
      browserType: options.browserType,
      headless: options.headless ?? true,
      hasProxy: !!options.proxy,
    });

    try {
      const browser = await this.launchBrowser(options);
      const context = await browser.newContext({
        userAgent: options.userAgent,
        proxy: options.proxy,
      });
      const page = await context.newPage();

      this.logger.info("Browser session created", {
        browserType: options.browserType,
      });

      return {
        browser,
        page,
        browserType: options.browserType,
        userAgent: options.userAgent,
        proxy: options.proxy?.server ?? null,
      };
    } catch (error) {
      this.logger.error("Failed to create browser session", {
        browserType: options.browserType,
        error,
      });
      throw error;
    }
  }

  /**
   * Launch browser based on type
   */
  private async launchBrowser(options: SessionOptions): Promise<Browser> {
    const launchOptions = {
      headless: options.headless ?? true,
    };

    switch (options.browserType.toLowerCase()) {
      case "chromium":
        return await chromium.launch(launchOptions);
      case "chrome":
        return await chromium.launch({
          ...launchOptions,
          channel: "chrome",
        });
      case "edge":
        return await chromium.launch({
          ...launchOptions,
          channel: "msedge",
        });
      case "brave":
        return await chromium.launch({
          ...launchOptions,
          channel: "brave" as any,
        });
      case "firefox":
        return await firefox.launch(launchOptions);
      case "webkit":
        return await webkit.launch(launchOptions);
      default:
        throw new Error(`Unsupported browser type: ${options.browserType}`);
    }
  }

  /**
   * Login to BCA portal
   */
  async login(
    session: BrowserSession,
    credentials: LoginCredentials,
  ): Promise<void> {
    this.logger.debug("Starting login process");

    try {
      // Navigate to login page
      await session.page.goto(BCA_LOGIN_URL, {
        waitUntil: "domcontentloaded",
        timeout: 30000,
      });

      // Wait for login form to be ready
      await session.page.waitForSelector('input[name="txt_user_id"]', {
        timeout: 10000,
        state: "visible",
      });

      // Fill username using specific name selector
      await session.page.fill(
        'input[name="txt_user_id"]',
        credentials.username,
      );

      // Fill password using specific name selector
      await session.page.fill('input[name="txt_pswd"]', credentials.password);

      // Click login button
      await session.page.click('input[type="Submit"][value="LOGIN"]');

      // Wait for navigation after login
      await session.page.waitForLoadState("networkidle", { timeout: 30000 });

      // Check if login was successful
      const url = session.page.url();
      if (
        url.includes("authentication.do") &&
        url.includes("value(actions)=menu")
      ) {
        this.logger.info("Login successful");
      } else {
        throw new Error("Login failed: unexpected page after login");
      }
    } catch (error) {
      this.logger.error("Login failed", { error });
      throw error;
    }
  }

  /**
   * Logout from BCA portal
   */
  async logout(session: BrowserSession): Promise<void> {
    this.logger.debug("Starting logout process");

    try {
      await session.page.goto(BCA_LOGOUT_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      this.logger.info("Logout successful");
    } catch (error) {
      this.logger.error("Logout failed", { error });
      // Don't throw - logout failure shouldn't prevent cleanup
    }
  }

  /**
   * Close browser session and cleanup resources
   */
  async closeSession(session: BrowserSession): Promise<void> {
    this.logger.debug("Closing browser session");

    try {
      await session.page.close();
    } catch (error) {
      this.logger.error("Failed to close page", { error });
    }

    try {
      await session.browser.close();
      this.logger.info("Browser session closed");
    } catch (error) {
      this.logger.error("Failed to close browser", { error });
    }
  }
}
