/// <reference types="cypress" />

export class BannerElement {
  private static readonly notificationRegionSelector =
    'app-notification-banner [role="region"]';
  private static readonly notificationAlertSelector =
    'app-notification-banner [role="alert"]';
  private static readonly successAlertSelector =
    'app-success-banner [role="alert"]';
  private static readonly errorSummarySelector =
    'app-error-summary [data-component="error-summary"]';
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

  static findSuccessAlertWithLink(
    heading: string,
    linkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.successAlertSelector, heading, { timeout: 10000 })
      .should('contain.text', linkText)
      .find('a')
      .contains(linkText);
  }

  static getErrorSummary(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(this.errorSummarySelector);
  }

  static findErrorSummaryByText(
    text: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(this.errorSummarySelector, text);
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

  static findErrorSummaryWithBody(
    heading: string,
    bodyText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.errorSummarySelector, heading, { timeout: 10000 })
      .should('contain.text', bodyText);
  }
}
