/// <reference types="cypress" />

export class DownloadReportHelper {
  static waitForReportDownloadToComplete(): void {
    // A fast backend can replace the progress component before Cypress sees it,
    // so wait for the durable terminal state rather than a transient frame.
    cy.contains('app-success-banner', 'Report downloaded', {
      timeout: 120000,
    }).should('be.visible');
  }
}
