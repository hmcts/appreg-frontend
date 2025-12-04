/// <reference types="cypress" />

export class PdfDownloadHelper {
  private static readonly DOWNLOADS_FOLDER = 'cypress/downloads';

  static getDownloadsPath(): string {
    return `${Cypress.config('projectRoot')}/${this.DOWNLOADS_FOLDER}`;
  }

  static listPdfFiles(): Cypress.Chainable<string[]> {
    const downloadsPath = this.getDownloadsPath();
    return cy.task('listPdfFiles', downloadsPath);
  }

  static findPdfByName(partialName: string): Cypress.Chainable<string> {
    return this.listPdfFiles().then((files) => {
      const matchedFile = files.find((file) => file.includes(partialName));
      if (!matchedFile) {
        throw new Error(
          `No PDF found with name containing "${partialName}". Found files: ${files.join(', ')}`,
        );
      }
      Cypress.log({
        name: 'findPdfByName',
        message: `Found PDF: "${matchedFile}"`,
      });
      return matchedFile;
    });
  }

  static verifyFileNotEmpty(filename: string, minSize: number = 1000): void {
    cy.readFile(`${this.DOWNLOADS_FOLDER}/${filename}`, 'binary').should(
      (content) => {
        Cypress.log({
          name: 'verifyFileNotEmpty',
          message: `PDF size: ${content.length} bytes (min: ${minSize})`,
        });
        expect(content.length).to.be.greaterThan(
          minSize,
          `PDF file ${filename} should be larger than ${minSize} bytes`,
        );
      },
    );
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

  static verifyPdfContainsText(filename: string, expectedText: string): void {
    this.parsePdfContent(filename).then((pdfData) => {
      Cypress.log({
        name: 'verifyPdfContainsText',
        message: `✓ PDF contains: "${expectedText}"`,
      });
      expect(pdfData.text).to.include(
        expectedText,
        `PDF should contain text: "${expectedText}"`,
      );
    });
  }

  static verifyPdfPageCount(filename: string, expectedPages: number): void {
    this.parsePdfContent(filename).then((pdfData) => {
      Cypress.log({
        name: 'verifyPdfPageCount',
        message: `✓ PDF has ${pdfData.numPages} page(s)`,
      });
      expect(pdfData.numPages).to.equal(
        expectedPages,
        `PDF should have ${expectedPages} pages, but has ${pdfData.numPages}`,
      );
    });
  }

  static getPdfText(filename: string): Cypress.Chainable<string> {
    return this.parsePdfContent(filename).then((pdfData) => pdfData.text);
  }
}


