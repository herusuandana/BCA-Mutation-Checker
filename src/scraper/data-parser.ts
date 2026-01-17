/**
 * Data parser
 * Parses raw mutation data into structured format
 */

import { RawMutationData, MutationRecord, IDataParser } from "./types";
import { Logger } from "../logging/logger";

export class DataParser implements IDataParser {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Parse a single raw mutation record
   */
  parse(raw: RawMutationData): MutationRecord {
    try {
      // Validate required fields
      if (
        !raw.date ||
        !raw.description ||
        !raw.amount ||
        !raw.type ||
        !raw.balance
      ) {
        throw new Error("Missing required fields in raw mutation data");
      }

      // Parse date (format: DD/MM/YY or DD/MM/YYYY)
      const date = this.parseDate(raw.date);

      // Parse amount (remove separators and convert to number)
      const amount = this.parseAmount(raw.amount);

      // Parse type (DB = debit, CR = credit)
      const type = this.parseType(raw.type);

      // Parse balance
      const balance = this.parseAmount(raw.balance);

      return {
        date,
        description: raw.description.trim(),
        amount,
        type,
        balance,
      };
    } catch (error) {
      this.logger.error("Failed to parse mutation record", {
        error,
        raw,
      });
      throw error;
    }
  }

  /**
   * Parse all raw mutation records
   */
  parseAll(raw: RawMutationData[]): MutationRecord[] {
    this.logger.debug("Parsing mutation records", { count: raw.length });

    const parsed: MutationRecord[] = [];
    const errors: Error[] = [];

    for (const record of raw) {
      try {
        parsed.push(this.parse(record));
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      this.logger.warning("Some records failed to parse", {
        errorCount: errors.length,
        successCount: parsed.length,
      });
    }

    this.logger.info("Mutation parsing completed", {
      total: raw.length,
      success: parsed.length,
      failed: errors.length,
    });

    return parsed;
  }

  /**
   * Parse date string to Date object
   * Supports formats: DD/MM/YY, DD/MM/YYYY
   */
  private parseDate(dateStr: string): Date {
    const parts = dateStr.split("/");
    if (parts.length !== 3) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    let year = parseInt(parts[2], 10);

    // Handle 2-digit year
    if (year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    const date = new Date(year, month, day);

    // Validate date
    if (
      isNaN(date.getTime()) ||
      date.getDate() !== day ||
      date.getMonth() !== month ||
      date.getFullYear() !== year
    ) {
      throw new Error(`Invalid date: ${dateStr}`);
    }

    return date;
  }

  /**
   * Parse amount string to number
   * Removes thousand separators (. or ,) and handles decimal point
   */
  private parseAmount(amountStr: string): number {
    // Remove whitespace
    let cleaned = amountStr.trim();

    // Remove thousand separators (dots or commas)
    cleaned = cleaned.replace(/\./g, "").replace(/,/g, "");

    // Parse to number
    const amount = parseFloat(cleaned);

    if (isNaN(amount)) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    return amount;
  }

  /**
   * Parse transaction type
   * DB = debit, CR = credit
   */
  private parseType(typeStr: string): "debit" | "credit" {
    const normalized = typeStr.trim().toUpperCase();

    if (normalized === "DB" || normalized === "DEBIT") {
      return "debit";
    } else if (normalized === "CR" || normalized === "CREDIT") {
      return "credit";
    } else {
      throw new Error(`Invalid transaction type: ${typeStr}`);
    }
  }
}
