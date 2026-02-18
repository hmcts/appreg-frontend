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

  // Click the details section with the given title
  static clickDetailsSection(detailsSectionTitle: string): void {
    cy.contains('details summary, details, summary', detailsSectionTitle).click(
      { force: true },
    );
  }

  // Verify a textbox with the given label is present in the details section
  static verifyTextboxInDetailsSection(
    labelText: string,
    detailsSectionTitle: string,
  ): void {
    cy.contains('details summary, details, summary', detailsSectionTitle)
      .should('be.visible')
      .parent()
      .within(() => {
        cy.contains('label', labelText, { matchCase: false }).should('exist');
      });
  }
}
