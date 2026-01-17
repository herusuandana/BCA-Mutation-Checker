/**
 * Property test: Webhook Payload Structure
 * Property 15: For any webhook payload sent, it should include timestamp
 * and account identifier fields.
 * Validates: Requirements 7.4
 */

import * as fc from "fast-check";
import { WebhookClient } from "../src/webhook/webhook-client";
import { Logger } from "../src/logging/logger";
import { WebhookPayload } from "../src/webhook/types";

// Mock fetch globally
global.fetch = jest.fn();

describe("Property 15: Webhook Payload Structure", () => {
  let logger: Logger;

  beforeEach(() => {
    logger = new Logger("test", { level: "info" });
    jest.clearAllMocks();
  });

  test("should include timestamp field in all payloads", async () => {
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
          { minLength: 1, maxLength: 10 },
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

          // Get payload from fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const payload: WebhookPayload = JSON.parse(fetchCall[1].body);

          // Verify timestamp exists and is valid ISO string
          expect(payload.timestamp).toBeDefined();
          expect(typeof payload.timestamp).toBe("string");
          expect(() => new Date(payload.timestamp)).not.toThrow();
          expect(new Date(payload.timestamp).toISOString()).toBe(
            payload.timestamp,
          );
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should include account field in all payloads", async () => {
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
          { minLength: 1, maxLength: 10 },
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

          // Get payload from fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const payload: WebhookPayload = JSON.parse(fetchCall[1].body);

          // Verify account exists and matches input
          expect(payload.account).toBeDefined();
          expect(payload.account).toBe(account);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should include mutations array in all payloads", async () => {
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
          { minLength: 1, maxLength: 10 },
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

          // Get payload from fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const payload: WebhookPayload = JSON.parse(fetchCall[1].body);

          // Verify mutations array exists and has correct length
          expect(payload.mutations).toBeDefined();
          expect(Array.isArray(payload.mutations)).toBe(true);
          expect(payload.mutations.length).toBe(mutations.length);
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should have all three required fields in payload structure", async () => {
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
          { minLength: 1, maxLength: 10 },
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

          // Get payload from fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const payload: WebhookPayload = JSON.parse(fetchCall[1].body);

          // Verify all required fields exist
          expect(payload).toHaveProperty("timestamp");
          expect(payload).toHaveProperty("account");
          expect(payload).toHaveProperty("mutations");
        },
      ),
      { numRuns: 100 },
    );
  });

  test("should preserve mutation data in payload", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.webUrl(),
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
          { minLength: 1, maxLength: 5 },
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

          // Get payload from fetch call
          const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
          const payload: WebhookPayload = JSON.parse(fetchCall[1].body);

          // Verify mutations are preserved
          expect(payload.mutations.length).toBe(mutations.length);
          payload.mutations.forEach((mutation, index) => {
            expect(mutation.description).toBe(mutations[index].description);
            expect(mutation.type).toBe(mutations[index].type);
          });
        },
      ),
      { numRuns: 100 },
    );
  });
});
