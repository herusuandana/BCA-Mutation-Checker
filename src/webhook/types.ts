/**
 * Webhook types and interfaces
 */

import { MutationRecord } from "../scraper/types";

/**
 * Webhook configuration
 */
export interface WebhookConfig {
  url: string;
  retryAttempts?: number;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  timestamp: string;
  account: string;
  mutations: MutationRecord[];
}

/**
 * Webhook client interface
 */
export interface IWebhookClient {
  send(mutations: MutationRecord[], account: string): Promise<void>;
  sendWithRetry(
    mutations: MutationRecord[],
    account: string,
    attempts: number,
  ): Promise<void>;
}
