/// <reference types="cypress" />

import { DOWNLOAD_CONSTANTS } from '../../../constants/ProjectConstants';
import { BaseDownloadHelper } from '../BaseDownloadHelper';

export class PdfDownloadHelper extends BaseDownloadHelper {
  static listPdfFiles(): Cypress.Chainable<string[]> {
    return this.listFiles('listPdfFiles');
  }

  static getLatestPdfOrFail(): Cypress.Chainable<string> {
    return this.getLatestOrFail('listPdfFiles', 'PDF');
  }

  static findPdfByName(
    partialName: string,
    timeout = DOWNLOAD_CONSTANTS.DEFAULT_FIND_TIMEOUT_MS,
  ): Cypress.Chainable<string> {
    return this.findByName('listPdfFiles', 'PDF', partialName, timeout);
  }

  static clearDownloadsFolder(): Cypress.Chainable<null> {
    return this.clearFiles('clearDownloadsFolder', 'PDF');
  }

  static parsePdfContent(
    filename: string,
  ): Cypress.Chainable<{ text: string; numPages: number; info: unknown }> {
    const filePath = `${this.getDownloadsPath()}/${filename}`;
    Cypress.log({
      name: 'parsePdfContent',
      message: `Parsing PDF: ${filename}`,
    });
    return cy.task('parsePdfContent', filePath);
  }

  static getPdfText(filename: string): Cypress.Chainable<string> {
    return this.parsePdfContent(filename).then((pdfData) => pdfData.text);
  }
}
