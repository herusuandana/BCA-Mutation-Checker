/**
 * Webhook client
 * Sends mutation data to configured webhook endpoint
 */

import { MutationRecord } from "../scraper/types";
import { WebhookConfig, WebhookPayload, IWebhookClient } from "./types";
import { Logger } from "../logging/logger";

export class WebhookClient implements IWebhookClient {
  private config: WebhookConfig;
  private logger: Logger;

  constructor(config: WebhookConfig, logger: Logger) {
    this.config = config;
    this.logger = logger;
  }

  /**
   * Send mutation data to webhook endpoint
   */
  async send(mutations: MutationRecord[], account: string): Promise<void> {
    const maxAttempts = this.config.retryAttempts || 3;
    await this.sendWithRetry(mutations, account, maxAttempts);
  }

  /**
   * Send with retry logic and exponential backoff
   */
  async sendWithRetry(
    mutations: MutationRecord[],
    account: string,
    attempts: number,
  ): Promise<void> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await this.sendRequest(mutations, account);
        this.logger.info("Webhook delivery successful", {
          url: this.config.url,
          mutationCount: mutations.length,
          attempt,
        });
        return;
      } catch (error) {
        lastError = error as Error;
        this.logger.warning("Webhook delivery failed", {
          url: this.config.url,
          attempt,
          maxAttempts: attempts,
          error: lastError.message,
        });

        // Don't wait after last attempt
        if (attempt < attempts) {
          const delay = this.calculateBackoff(attempt);
          this.logger.debug("Retrying webhook delivery", { delay });
          await this.sleep(delay);
        }
      }
    }

    // All attempts exhausted
    this.logger.error("Webhook delivery failed after all retries", {
      url: this.config.url,
      attempts,
      error: lastError?.message,
    });

    throw new Error(
      `Webhook delivery failed after ${attempts} attempts: ${lastError?.message}`,
    );
  }

  /**
   * Send HTTP POST request to webhook endpoint
   */
  private async sendRequest(
    mutations: MutationRecord[],
    account: string,
  ): Promise<void> {
    const payload: WebhookPayload = {
      timestamp: new Date().toISOString(),
      account,
      mutations,
    };

    this.logger.debug("Sending webhook request", {
      url: this.config.url,
      payloadSize: JSON.stringify(payload).length,
    });

    const response = await fetch(this.config.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `Webhook request failed with status ${response.status}: ${response.statusText}`,
      );
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    return Math.pow(2, attempt - 1) * 1000;
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
