/**
 * Mutation scraper
 * Extracts transaction data from BCA portal
 */

import { Page } from "playwright";
import { RawMutationData, IMutationScraper } from "./types";
import { Logger } from "../logging/logger";

/**
 * BCA mutation page URL
 */
const BCA_MUTATION_URL =
  "https://ibank.klikbca.com/accountstmt.do?value(actions)=acct_stmt";

export class MutationScraper implements IMutationScraper {
  private page: Page;
  private logger: Logger;

  constructor(page: Page, logger: Logger) {
    this.page = page;
    this.logger = logger;
  }

  /**
   * Navigate to mutation page
   */
  async navigateToMutationPage(): Promise<void> {
    this.logger.debug("Navigating to mutation page");

    try {
      await this.page.goto(BCA_MUTATION_URL, {
        waitUntil: "networkidle",
        timeout: 30000,
      });

      this.logger.info("Successfully navigated to mutation page");
    } catch (error) {
      this.logger.error("Failed to navigate to mutation page", { error });
      throw error;
    }
  }

  /**
   * Scrape mutation data from the page
   */
  async scrape(): Promise<RawMutationData[]> {
    this.logger.debug("Starting mutation scraping");

    try {
      // Wait for transaction table to load
      const tableSelector = 'table[bordercolor="#ffffff"]';
      await this.page.waitForSelector(tableSelector, { timeout: 10000 });

      // Extract transaction rows
      const rows = await this.page.$$eval(`${tableSelector} tr`, (elements) => {
        return elements
          .map((row) => {
            const cells = Array.from(row.querySelectorAll("td")) as any[];
            if (cells.length < 5) return null;

            return {
              date: cells[0]?.textContent?.trim() || "",
              description: cells[1]?.textContent?.trim() || "",
              amount: cells[2]?.textContent?.trim() || "",
              type: cells[3]?.textContent?.trim() || "",
              balance: cells[4]?.textContent?.trim() || "",
            };
          })
          .filter((row) => row !== null);
      });

      // Filter out header rows and empty rows
      const mutations = rows.filter(
        (row) =>
          row &&
          row.date &&
          row.date !== "PEND" &&
          row.date !== "TANGGAL" &&
          row.description &&
          row.amount,
      );

      this.logger.info("Mutation scraping completed", {
        count: mutations.length,
      });

      return mutations as RawMutationData[];
    } catch (error) {
      this.logger.error("Failed to scrape mutations", { error });
      throw error;
    }
  }
}
