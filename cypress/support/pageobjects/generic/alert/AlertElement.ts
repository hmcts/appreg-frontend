export class AlertElement {
  private static readonly alertSelector = '[role="alert"]';
  private static readonly warningAlertSelector =
    'app-alert[alerttype="warning"]';
  private static readonly errorAlertSelector = 'app-alert[alerttype="error"]';
  private static readonly successAlertSelector =
    'app-alert[alerttype="success"]';
  private static readonly infoAlertSelector =
    'app-alert[alerttype="information"]';

  static findAlert(alertText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.alertSelector, alertText);
  }

  static findWarningAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.warningAlertSelector, alertText);
  }

  static findErrorAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.errorAlertSelector, alertText);
  }

  static findSuccessAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.successAlertSelector, alertText);
  }

  static findInfoAlert(
    alertText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.infoAlertSelector, alertText);
  }
}
