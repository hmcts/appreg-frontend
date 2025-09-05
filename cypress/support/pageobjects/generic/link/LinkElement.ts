export class LinkElement {
  static findLink(linkText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('a, button[role="link"]', linkText);
  }
}
