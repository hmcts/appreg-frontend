
export class ButtonElement {

  static findButton(name: string): Cypress.Chainable {
    return cy.contains('button, input[type="button"], input[type="submit"], [role="button"]', name);
  }

}
