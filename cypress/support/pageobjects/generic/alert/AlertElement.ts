export class AlertElement {
  static findAlert(alertText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('[role="alert"]', alertText);
  }

  static findWarningAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('app-alert[alerttype="warning"]', alertText);
  }

  static findErrorAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('app-alert[alerttype="error"]', alertText);
  }

  static findSuccessAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('app-alert[alerttype="success"]', alertText);
  }

  static findInfoAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('app-alert[alerttype="information"]', alertText);
  }
}
