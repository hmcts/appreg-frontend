/// <reference types="cypress" />

export class BannerElement {
  private static readonly notificationRegionSelector =
    'app-notification-banner [role="region"]';
  private static readonly notificationAlertSelector =
    'app-notification-banner [role="alert"]';
  private static readonly successAlertSelector =
    'app-success-banner [role="alert"]';
  private static readonly errorAlertSelector =
    'app-error-summary [role="alert"]';
  private static readonly warningRegionSelector =
    'app-warning-banner [role="region"]';
  private static readonly pageHeaderSelector =
    'app-page-header .moj-page-header-actions__title h1, h1.govuk-heading-xl';

  static findNotificationRegionByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.notificationRegionSelector, text);
  }

  static findNotificationAlertByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.notificationAlertSelector, text);
  }

  static getSuccessAlert(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.successAlertSelector);
  }

  static findSuccessAlertByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.successAlertSelector, text, { timeout: 10000 });
  }

  static getErrorAlert(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.errorAlertSelector);
  }

  static findErrorAlertByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.errorAlertSelector, text);
  }

  static findWarningRegionByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.warningRegionSelector, text);
  }

  static getPageHeader(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.pageHeaderSelector).first();
  }

  static findSuccessAlertWithBody(
    heading: string,
    bodyText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.successAlertSelector, heading, { timeout: 10000 })
      .should('contain.text', bodyText);
  }

  static findErrorAlertWithBody(
    heading: string,
    bodyText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.errorAlertSelector, heading, { timeout: 10000 })
      .should('contain.text', bodyText);
  }
}
