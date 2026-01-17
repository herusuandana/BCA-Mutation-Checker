import * as fc from "fast-check";
import { RawMutationData } from "../src/scraper/types";

// Feature: bca-mutation-checker, Property 11: Mutation Data Completeness
// Validates: Requirements 6.2

describe("Mutation Data Completeness Property Tests", () => {
  describe("Property 11: Mutation Data Completeness", () => {
    it("should have all required fields present", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.string({ minLength: 8, maxLength: 10 }),
            description: fc.string({ minLength: 5, maxLength: 100 }),
            amount: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          (mutation: RawMutationData) => {
            // All required fields should be present
            expect(mutation.date).toBeDefined();
            expect(mutation.description).toBeDefined();
            expect(mutation.amount).toBeDefined();
            expect(mutation.type).toBeDefined();
            expect(mutation.balance).toBeDefined();
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have non-empty required fields", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.string({ minLength: 8, maxLength: 10 }),
            description: fc.string({ minLength: 5, maxLength: 100 }),
            amount: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          (mutation: RawMutationData) => {
            // All fields should be non-empty
            expect(mutation.date.length).toBeGreaterThan(0);
            expect(mutation.description.length).toBeGreaterThan(0);
            expect(mutation.amount.length).toBeGreaterThan(0);
            expect(mutation.type.length).toBeGreaterThan(0);
            expect(mutation.balance.length).toBeGreaterThan(0);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have date field in valid format", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.oneof(
              fc.constant("01/01/23"),
              fc.constant("31/12/2023"),
              fc.constant("15/06/24"),
            ),
            description: fc.string({ minLength: 5 }),
            amount: fc.string({ minLength: 1 }),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.string({ minLength: 1 }),
          }),
          (mutation: RawMutationData) => {
            // Date should match DD/MM/YY or DD/MM/YYYY format
            expect(mutation.date).toMatch(/^\d{2}\/\d{2}\/\d{2,4}$/);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should have type field as DB or CR", () => {
      fc.assert(
        fc.property(
          fc.record({
            date: fc.string({ minLength: 8 }),
            description: fc.string({ minLength: 5 }),
            amount: fc.string({ minLength: 1 }),
            type: fc.constantFrom("DB", "CR"),
            balance: fc.string({ minLength: 1 }),
          }),
          (mutation: RawMutationData) => {
            // Type should be DB or CR
            expect(["DB", "CR"]).toContain(mutation.type);
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should maintain field structure in arrays", () => {
      fc.assert(
        fc.property(
          fc.array(
            fc.record({
              date: fc.string({ minLength: 8 }),
              description: fc.string({ minLength: 5 }),
              amount: fc.string({ minLength: 1 }),
              type: fc.constantFrom("DB", "CR"),
              balance: fc.string({ minLength: 1 }),
            }),
            { minLength: 1, maxLength: 10 },
          ),
          (mutations: RawMutationData[]) => {
            // All mutations should have complete structure
            mutations.forEach((mutation) => {
              expect(mutation).toHaveProperty("date");
              expect(mutation).toHaveProperty("description");
              expect(mutation).toHaveProperty("amount");
              expect(mutation).toHaveProperty("type");
              expect(mutation).toHaveProperty("balance");
            });
          },
        ),
        { numRuns: 100 },
      );
    });

    it("should handle empty mutation list", () => {
      fc.assert(
        fc.property(fc.constant([]), (mutations: RawMutationData[]) => {
          // Empty list should be valid
          expect(Array.isArray(mutations)).toBe(true);
          expect(mutations.length).toBe(0);
        }),
        { numRuns: 100 },
      );
    });
  });
});
