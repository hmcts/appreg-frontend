/// <reference types="cypress" />
export class ButtonElement {
  static findButton(
    name: string,
    timeout?: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      'button, input[type="button"], input[type="submit"], [role="button"]',
      name,
      ...(timeout !== undefined ? [{ timeout }] : []),
    );
  }
}
