/// <reference types="cypress" />

import { DOWNLOAD_CONSTANTS } from '../../../constants/ProjectConstants';
import { BaseDownloadHelper } from '../BaseDownloadHelper';

export class CsvDownloadHelper extends BaseDownloadHelper {
  static listCsvFiles(): Cypress.Chainable<string[]> {
    return this.listFiles('listCsvFiles');
  }

  static getLatestCsvOrFail(): Cypress.Chainable<string> {
    return this.getLatestOrFail('listCsvFiles', 'CSV');
  }

  static findCsvByName(
    partialName: string,
    timeout = DOWNLOAD_CONSTANTS.DEFAULT_FIND_TIMEOUT_MS,
  ): Cypress.Chainable<string> {
    return this.findByName('listCsvFiles', 'CSV', partialName, timeout);
  }

  static clearDownloadsFolder(): Cypress.Chainable<null> {
    return this.clearFiles('clearCsvDownloads', 'CSV');
  }

  static readCsvHeaders(filename: string): Cypress.Chainable<string[]> {
    const filePath = `${this.getDownloadsPath()}/${filename}`;
    Cypress.log({
      name: 'readCsvHeaders',
      message: `Reading CSV headers from: ${filename}`,
    });
    return cy.task<string[]>('readCsvHeaders', filePath);
  }

  static getLatestCsvHeaders(): Cypress.Chainable<string[]> {
    return this.getLatestCsvOrFail().then((filename) =>
      this.readCsvHeaders(filename),
    );
  }

  static getLatestCsvContent(): Cypress.Chainable<string> {
    return this.getLatestCsvOrFail().then((filename) => {
      const filePath = `${this.getDownloadsPath()}/${filename}`;
      Cypress.log({
        name: 'getLatestCsvContent',
        message: `Reading CSV content from: ${filename}`,
      });
      return cy.task<string>('readFile', filePath);
    });
  }
}
