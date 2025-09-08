export class AlertElement {
  static findAlert(alertText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('[role="alert"]', alertText);
  }
}
