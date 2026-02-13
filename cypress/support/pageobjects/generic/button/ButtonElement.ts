/// <reference types="cypress" />
export class ButtonElement {
  static findButton(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      'button, input[type="button"], input[type="submit"], [role="button"]',
      name,
    );
  }
}
