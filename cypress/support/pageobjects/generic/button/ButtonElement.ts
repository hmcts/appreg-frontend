/// <reference types="cypress" />
export class ButtonElement {
  private static readonly buttonSelector =
    'button, input[type="button"], input[type="submit"], [role="button"]';

  static findButton(
    name: string,
    timeout?: number,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(
      this.buttonSelector,
      name,
      ...(timeout !== undefined ? [{ timeout }] : []),
    );
  }
}
