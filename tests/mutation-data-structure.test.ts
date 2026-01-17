import * as fc from "fast-check";
import { DataParser } from "../src/scraper/data-parser";
import { RawMutationData } from "../src/scraper/types";
import { Logger } from "../src/logging/logger";

// Feature: bca-mutation-checker, Property 12: Mutation Data Structure
// Validates: Requirements 6.3

describe("Mutation Data Structure Property Tests", () => {
  describe("Property 12: Mutation Data Structure", () => {
    it("should parse date field to Date type", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024", "31/12/25"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000", "50000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000", "250000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Date should be Date type
            expect(parsed.date).toBeInstanceOf(Date);
            expect(parsed.date.getTime()).not.toBeNaN();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should parse amount field to number type", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000", "50000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Amount should be number type
            expect(typeof parsed.amount).toBe("number");
            expect(parsed.amount).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should parse balance field to number type", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000", "250000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Balance should be number type
            expect(typeof parsed.balance).toBe("number");
            expect(parsed.balance).toBeGreaterThanOrEqual(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should parse type field to debit or credit", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Type should be debit or credit
            expect(["debit", "credit"]).toContain(parsed.type);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should preserve description as string", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5, maxLength: 50 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Description should be string
            expect(typeof parsed.description).toBe("string");
            expect(parsed.description.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have all required fields in parsed structure", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // All fields should be present
            expect(parsed).toHaveProperty("date");
            expect(parsed).toHaveProperty("description");
            expect(parsed).toHaveProperty("amount");
            expect(parsed).toHaveProperty("type");
            expect(parsed).toHaveProperty("balance");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly map DB to debit", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constant("DB"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // DB should map to debit
            expect(parsed.type).toBe("debit");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should correctly map CR to credit", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23", "15/06/2024"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("100000", "1.000.000"),
            type: fc.constant("CR"),
            balance: fc.constantFrom("500000", "5.000.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // CR should map to credit
            expect(parsed.type).toBe("credit");
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle thousand separators in amounts", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.constantFrom("01/01/23"),
            description: fc.string({ minLength: 5 }),
            amount: fc.constantFrom("1.000.000", "10.000", "100.000.000"),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.constantFrom("5.000.000", "50.000"),
          }),
          (raw: RawMutationData) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsed = parser.parse(raw);

            // Should parse correctly without separators
            expect(typeof parsed.amount).toBe("number");
            expect(parsed.amount).toBeGreaterThan(0);
            expect(typeof parsed.balance).toBe("number");
            expect(parsed.balance).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should parse all records in array", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              date: fc.constantFrom("01/01/23", "15/06/2024"),
              description: fc.string({ minLength: 5 }),
              amount: fc.constantFrom("100000", "1.000.000"),
              type: fc.constantFrom("DB", "CR"),
              balance: fc.constantFrom("500000", "5.000.000"),
            }),
            { minLength: 1, maxLength: 5 },
          ),
          (rawArray: RawMutationData[]) => {
            const logger = new Logger("test", { level: "error" });
            const parser = new DataParser(logger);

            const parsedArray = parser.parseAll(rawArray);

            // Should parse all records
            expect(parsedArray.length).toBeGreaterThan(0);
            expect(parsedArray.length).toBeLessThanOrEqual(rawArray.length);

            // All parsed records should have correct structure
            parsedArray.forEach((parsed) => {
              expect(parsed.date).toBeInstanceOf(Date);
              expect(typeof parsed.amount).toBe("number");
              expect(typeof parsed.balance).toBe("number");
              expect(["debit", "credit"]).toContain(parsed.type);
            });
          },
        ),
        { numRuns: 100 },
      );
    });
  });
});
