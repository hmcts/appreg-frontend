/// <reference types="cypress" />

export class DownloadReportElement {
  static findDownloadProgressMessage(
    message: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get('app-async-job-progress output[aria-live="polite"]')
      .contains(message);
  }
}
