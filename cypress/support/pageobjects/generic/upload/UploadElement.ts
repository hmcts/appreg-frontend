/// <reference types="cypress" />

export class UploadElement {
  private static readonly fileInputSelector = 'input[type="file"]';
  private static readonly pageSpinnerSelector = 'app-loading-spinner';
  private static readonly bulkProgressSelector = '.app-bulk-upload-progress';
  static readonly bulkProgressHeading = 'Upload in progress';
  static readonly bulkProgressBody =
    'Your bulk upload is being processed. This page will refresh automatically when it finishes.';

  static getFileInput(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.fileInputSelector);
  }

  static getPageSpinner(
    timeout?: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(
      this.pageSpinnerSelector,
      ...(timeout !== undefined ? [{ timeout }] : []),
    );
  }

  static getBulkProgress(
    timeout?: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(
      this.bulkProgressSelector,
      ...(timeout !== undefined ? [{ timeout }] : []),
    );
  }

  static findBulkProgressByText(
    text: string,
    timeout?: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      this.bulkProgressSelector,
      text,
      ...(timeout !== undefined ? [{ timeout }] : []),
    );
  }
}
