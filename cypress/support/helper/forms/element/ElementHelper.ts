/// <reference types="cypress" />

export class ElementHelper {
  /**
   * Verifies that an element is not visible on the page
   */
  static verifyElementNotVisible(element: string): void {
    cy.log(`Verifying element not visible: ${element}`);
    cy.get(element).should('not.exist');
  }

  /**
   * Verifies that an element is visible on the page
   */
  static verifyElementVisible(element: string): void {
    cy.log(`Verifying element visible: ${element}`);
    cy.get(element).should('exist');
  }
}
