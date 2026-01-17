/**
 * Mutation scraper types and interfaces
 */

/**
 * Raw mutation data extracted from HTML
 */
export interface RawMutationData {
  date: string;
  description: string;
  amount: string;
  type: string;
  balance: string;
}

/**
 * Parsed mutation record
 */
export interface MutationRecord {
  date: Date;
  description: string;
  amount: number;
  type: "debit" | "credit";
  balance: number;
}

/**
 * Mutation scraper interface
 */
export interface IMutationScraper {
  scrape(): Promise<RawMutationData[]>;
}

/**
 * Data parser interface
 */
export interface IDataParser {
  parse(raw: RawMutationData): MutationRecord;
  parseAll(raw: RawMutationData[]): MutationRecord[];
}
