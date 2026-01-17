/**
 * Property test: Webhook Delivery When Configured
 * Property 13: For any mutation data retrieved when a webhook endpoint is configured,
 * the system should attempt to send the data to that endpoint.
 * Validates: Requirements 7.1
 */

import * as fc from "fast-check";
import { WebhookClient } from "../src/webhook/webhook-client";
import { Logger } from "../src/logging/logger";

// Mock fetch globally
global.fetch = jest.fn();

describe("Property 13: Webhook Delivery When Configured", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test", { level: "info" });
    jest.clearAllMocks();
  });

  test("should attempt to send mutation data when webhook is configured", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.integer({ min: 1, max: 5 }),
        fc.array(
          fc.record({
            date: fc.date(),
            description: fc
              .string({ minLength: 1, maxLength: 50 })
              .filter((s) => s.trim().length > 0),
            amount: fc.integer({ min: 1, max: 1000000 }),
            type: fc.constantFrom("debit" as const, "credit" as const),
            balance: fc.integer({ min: 0, max: 10000000 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc
          .string({ minLength: 5, maxLength: 20 })
          .filter((s) => s.trim().length > 0),
        async (url, retryAttempts, mutations, account) => {
          // Mock successful response
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
            statusText: "OK",
          });

          const client = new WebhookClient({ url, retryAttempts }, logger);

          // Should not throw
          await client.send(mutations, account);

          // Verify fetch was called
          expect(global.fetch).toHaveBeenCalled();
          expect(global.fetch).toHaveBeenCalledWith(
            url,
            expect.objectContaining({
              method: "POST",
            }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should attempt delivery for any non-empty mutation list", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.array(
          fc.record({
            date: fc.date(),
            description: fc
              .string({ minLength: 1 })
              .filter((s) => s.trim().length > 0),
            amount: fc.integer({ min: 1 }),
            type: fc.constantFrom("debit" as const, "credit" as const),
            balance: fc.integer({ min: 0 }),
          }),
          { minLength: 1, maxLength: 20 },
        ),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (url, mutations, account) => {
          jest.clearAllMocks();

          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send(mutations, account);

          // Verify delivery was attempted
          expect(global.fetch).toHaveBeenCalledTimes(1);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should attempt delivery even with single mutation", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.record({
          date: fc.date(),
          description: fc
            .string({ minLength: 1 })
            .filter((s) => s.trim().length > 0),
          amount: fc.integer({ min: 1 }),
          type: fc.constantFrom("debit" as const, "credit" as const),
          balance: fc.integer({ min: 0 }),
        }),
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        async (url, mutation, account) => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send([mutation], account);

          expect(global.fetch).toHaveBeenCalled();
        },
      ),
      { numRuns: 100 },
    );
  });
});
