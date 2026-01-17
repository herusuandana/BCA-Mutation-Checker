/**
 * Browser session types and interfaces
 */

import { Browser, Page } from "playwright";

/**
 * Browser session state
 */
export interface BrowserSession {
  browser: Browser;
  page: Page;
  browserType: string;
  userAgent: string;
  proxy: string | null;
}

/**
 * Session creation options
 */
export interface SessionOptions {
  browserType: string;
  userAgent: string;
  proxy?: {
    server: string;
    username?: string;
    password?: string;
  };
  headless?: boolean;
}

/**
 * Login credentials
 */
export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Session manager interface
 */
export interface ISessionManager {
  createSession(options: SessionOptions): Promise<BrowserSession>;
  login(session: BrowserSession, credentials: LoginCredentials): Promise<void>;
  logout(session: BrowserSession): Promise<void>;
  closeSession(session: BrowserSession): Promise<void>;
}
