/// <reference types="cypress" />

import { TestDataGenerator } from '../../utils/TestDataGenerator';

export class PdfDownloadHelper {
  private static readonly DOWNLOADS_FOLDER = 'cypress/downloads';

  static getDownloadsPath(): string {
    return `${Cypress.config('projectRoot')}/${this.DOWNLOADS_FOLDER}`;
  }

  static listPdfFiles(): Cypress.Chainable<string[]> {
    const downloadsPath = this.getDownloadsPath();
    return cy.task('listPdfFiles', downloadsPath);
  }

  static getLatestPdfOrFail(): Cypress.Chainable<string> {
    return this.listPdfFiles().then((files) => {
      if (!files.length) {
        throw new Error(
          `Expected at least 1 PDF file in downloads folder (${this.DOWNLOADS_FOLDER}), but found none`,
        );
      }
      const latestPdf = files[files.length - 1];
      Cypress.log({
        name: 'getLatestPdfOrFail',
        message: `Latest PDF detected: "${latestPdf}"`,
      });
      return latestPdf;
    });
  }

  static findPdfByName(partialName: string): Cypress.Chainable<string> {
    const processedName = TestDataGenerator.parseValue(partialName);

    return this.listPdfFiles().then((files) => {
      const matchedFile = [...files]
        .reverse()
        .find((file) => file.includes(processedName));
      if (!matchedFile) {
        throw new Error(
          `No PDF found with name containing "${processedName}". Found files: ${files.join(', ')}`,
        );
      }
      Cypress.log({
        name: 'findPdfByName',
        message: `Found PDF: "${matchedFile}" (searched for: "${processedName}")`,
      });
      return matchedFile;
    });
  }

  static clearDownloadsFolder(): Cypress.Chainable<null> {
    const downloadsPath = this.getDownloadsPath();
    Cypress.log({
      name: 'clearDownloadsFolder',
      message: 'Clearing PDF downloads folder',
    });
    return cy.task('clearDownloadsFolder', downloadsPath);
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
