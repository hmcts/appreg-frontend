/// <reference types="cypress" />

export class DetailsHelper {
  // Verify the details section with the given title is visible
  static verifyDetailsSectionVisible(detailsSectionTitle: string): void {
    // Adjust selector as needed for your app layout (heading, label, container, etc.)
    cy.contains(
      'details summary, details, summary',
      detailsSectionTitle,
    ).should('be.visible');
  }

  // Verify the details section with the given title is not visible / not present
  static verifyDetailsSectionNotVisible(detailsSectionTitle: string): void {
    cy.contains(
      'details summary, details, summary',
      detailsSectionTitle,
    ).should('not.exist');
  }

  // Click the details section with the given title
  static clickDetailsSection(detailsSectionTitle: string): void {
    cy.contains('details summary, details, summary', detailsSectionTitle).click(
      { force: true },
    );
  }
}
