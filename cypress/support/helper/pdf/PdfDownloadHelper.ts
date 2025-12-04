/// <reference types="cypress" />
import * as path from 'path';

/**
 * Helper class for handling PDF download operations and verification
 */
export class PdfDownloadHelper {
  private static readonly DOWNLOADS_FOLDER = 'cypress/downloads';
  private static readonly PDF_EXTENSION = '.pdf';

  /**
   * Get the full path to the downloads folder
   * @returns {string} The absolute path to downloads folder
   */
  static getDownloadsPath(): string {
    return path.join(Cypress.config('projectRoot'), this.DOWNLOADS_FOLDER);
  }

  /**
   * Get list of all PDF files in downloads folder
   * @returns {Cypress.Chainable<string[]>}
   */
  static listPdfFiles(): Cypress.Chainable<string[]> {
    const downloadsPath = this.getDownloadsPath();
    return cy.task('listPdfFiles', downloadsPath);
  }

  /**
   * Find a PDF file by partial filename match
   * @param partialName - Part of the filename to search for
   * @returns {Cypress.Chainable<string>} The full filename
   */
  static findPdfByName(partialName: string): Cypress.Chainable<string> {
    return this.listPdfFiles().then((files) => {
      const matchedFile = files.find((file) => file.includes(partialName));
      if (!matchedFile) {
        throw new Error(
          `No PDF found with name containing "${partialName}". Found files: ${files.join(', ')}`,
        );
      }
      return matchedFile;
    });
  }

  /**
   * Wait for a PDF file to exist and read it
   * @param filename - The expected filename (can be partial)
   * @param timeout - Maximum time to wait in milliseconds (default: 10000ms)
   * @returns {Cypress.Chainable<Buffer>} The PDF file content
   */
  static waitForDownload(
    filename: string,
    timeout: number = 10000,
  ): Cypress.Chainable<Buffer> {
    // Use cy.readFile with retry - Cypress will auto-wait for file
    return cy.readFile(`${this.DOWNLOADS_FOLDER}/${filename}`, 'binary', {
      timeout,
    });
  }

  /**
   * Verify that a PDF file exists by reading it
   * @param filename - The filename to check
   * @returns {Cypress.Chainable<boolean>}
   */
  static verifyFileExists(filename: string): Cypress.Chainable<boolean> {
    return cy.task('listPdfFiles', this.getDownloadsPath()).then((files) => {
      return (files as string[]).includes(filename);
    });
  }

  /**
   * Verify that a PDF file is not empty
   * @param filename - The filename to check
   * @param minSize - Minimum expected file size in bytes (default: 1000)
   */
  static verifyFileNotEmpty(filename: string, minSize: number = 1000): void {
    cy.readFile(`${this.DOWNLOADS_FOLDER}/${filename}`, 'binary').should(
      (content) => {
        expect(content.length).to.be.greaterThan(
          minSize,
          `PDF file ${filename} should be larger than ${minSize} bytes`,
        );
      },
    );
  }

  /**
   * Delete all PDF files from downloads folder
   * @returns {Cypress.Chainable<null>}
   */
  static clearDownloadsFolder(): Cypress.Chainable<null> {
    const downloadsPath = this.getDownloadsPath();
    return cy.task('clearDownloadsFolder', downloadsPath);
  }

  /**
   * Verify filename matches expected pattern
   * @param actualFilename - The actual filename
   * @param expectedPattern - RegExp or string pattern to match
   */
  static verifyFilenamePattern(
    actualFilename: string,
    expectedPattern: RegExp | string,
  ): void {
    if (expectedPattern instanceof RegExp) {
      expect(actualFilename).to.match(
        expectedPattern,
        `Filename ${actualFilename} should match pattern ${expectedPattern}`,
      );
    } else {
      expect(actualFilename).to.include(
        expectedPattern,
        `Filename ${actualFilename} should include ${expectedPattern}`,
      );
    }
  }

  /**
   * Read PDF file content as buffer for parsing
   * @param filename - The filename to read
   * @returns {Cypress.Chainable<Buffer>}
   */
  static readPdfFile(filename: string): Cypress.Chainable<Buffer> {
    return cy.readFile(`${this.DOWNLOADS_FOLDER}/${filename}`, 'binary');
  }

  /**
   * Parse PDF and extract text content
   * @param filename - The PDF filename to parse
   * @returns {Cypress.Chainable<{text: string, numPages: number, info: unknown}>}
   */
  static parsePdfContent(
    filename: string,
  ): Cypress.Chainable<{ text: string; numPages: number; info: unknown }> {
    const filePath = path.join(this.getDownloadsPath(), filename);
    return cy.task('parsePdfContent', filePath);
  }

  /**
   * Verify PDF contains specific text
   * @param filename - The PDF filename
   * @param expectedText - Text that should be present in PDF
   */
  static verifyPdfContainsText(filename: string, expectedText: string): void {
    this.parsePdfContent(filename).then((pdfData) => {
      expect(pdfData.text).to.include(
        expectedText,
        `PDF should contain text: "${expectedText}"`,
      );
    });
  }

  /**
   * Verify PDF contains multiple text values
   * @param filename - The PDF filename
   * @param expectedTexts - Array of texts that should be present in PDF
   */
  static verifyPdfContainsTexts(
    filename: string,
    expectedTexts: string[],
  ): void {
    this.parsePdfContent(filename).then((pdfData) => {
      expectedTexts.forEach((text) => {
        expect(pdfData.text).to.include(
          text,
          `PDF should contain text: "${text}"`,
        );
      });
    });
  }

  /**
   * Verify PDF does NOT contain specific text
   * @param filename - The PDF filename
   * @param unexpectedText - Text that should NOT be present in PDF
   */
  static verifyPdfDoesNotContainText(
    filename: string,
    unexpectedText: string,
  ): void {
    this.parsePdfContent(filename).then((pdfData) => {
      expect(pdfData.text).to.not.include(
        unexpectedText,
        `PDF should NOT contain text: "${unexpectedText}"`,
      );
    });
  }

  /**
   * Verify number of pages in PDF
   * @param filename - The PDF filename
   * @param expectedPages - Expected number of pages
   */
  static verifyPdfPageCount(filename: string, expectedPages: number): void {
    this.parsePdfContent(filename).then((pdfData) => {
      expect(pdfData.numPages).to.equal(
        expectedPages,
        `PDF should have ${expectedPages} pages, but has ${pdfData.numPages}`,
      );
    });
  }

  /**
   * Get full PDF text content for custom assertions
   * @param filename - The PDF filename
   * @returns {Cypress.Chainable<string>} The extracted text
   */
  static getPdfText(filename: string): Cypress.Chainable<string> {
    return this.parsePdfContent(filename).then((pdfData) => pdfData.text);
  }
}

