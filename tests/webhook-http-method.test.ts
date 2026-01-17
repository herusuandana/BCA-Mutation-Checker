/**
 * Property test: Webhook HTTP Method and Format
 * Property 14: For any webhook request sent, it should use HTTP POST method
 * with Content-Type application/json.
 * Validates: Requirements 7.2
 */

import * as fc from "fast-check";
import { WebhookClient } from "../src/webhook/webhook-client";
import { Logger } from "../src/logging/logger";

// Mock fetch globally
global.fetch = jest.fn();

describe("Property 14: Webhook HTTP Method and Format", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test", { level: "info" });
    jest.clearAllMocks();
  });

  test("should use POST method for all webhook requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.array(
          fc.record({
            date: fc.date(),
            description: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1 }),
            type: fc.constantFrom("debit" as const, "credit" as const),
            balance: fc.integer({ min: 0 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.string({ minLength: 1 }),
        async (url, mutations, account) => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send(mutations, account);

          // Verify POST method
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

  test("should use application/json content type for all requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.array(
          fc.record({
            date: fc.date(),
            description: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1 }),
            type: fc.constantFrom("debit" as const, "credit" as const),
            balance: fc.integer({ min: 0 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.string({ minLength: 1 }),
        async (url, mutations, account) => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send(mutations, account);

          // Verify Content-Type header
          expect(global.fetch).toHaveBeenCalledWith(
            url,
            expect.objectContaining({
              headers: expect.objectContaining({
                "Content-Type": "application/json",
              }),
            }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should send valid JSON body for all requests", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.array(
          fc.record({
            date: fc.date(),
            description: fc.string({ minLength: 1 }),
            amount: fc.integer({ min: 1 }),
            type: fc.constantFrom("debit" as const, "credit" as const),
            balance: fc.integer({ min: 0 }),
          }),
          { minLength: 1, maxLength: 10 },
        ),
        fc.string({ minLength: 1 }),
        async (url, mutations, account) => {
          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send(mutations, account);

          // Get the body from the fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const body = fetchCall[1].body;

          // Verify it's valid JSON
          expect(() => JSON.parse(body)).not.toThrow();
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should use POST and JSON for requests with different mutation counts", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
        fc.integer({ min: 1, max: 50 }),
        fc.string({ minLength: 1 }),
        async (url, mutationCount, account) => {
          const mutations = Array.from({ length: mutationCount }, (_, i) => ({
            date: new Date(),
            description: `Transaction ${i}`,
            amount: 100 + i,
            type: i % 2 === 0 ? ("debit" as const) : ("credit" as const),
            balance: 1000 + i * 100,
          }));

          (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            status: 200,
          });

          const client = new WebhookClient({ url }, logger);
          await client.send(mutations, account);

          expect(global.fetch).toHaveBeenCalledWith(
            url,
            expect.objectContaining({
              method: "POST",
              headers: expect.objectContaining({
                "Content-Type": "application/json",
              }),
            }),
          );
        },
      ),
      { numRuns: 100 },
    );
  });
});
