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
  private static readonly notificationBannerHeadingSelector =
    'app-notification-banner .govuk-notification-banner__heading';
  private static readonly notificationBannerBodySelector =
    'app-notification-banner .govuk-notification-banner__content';

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

  static findNotificationBannerWithHeadingAndBody(
    heading: string,
    bodyText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .contains(this.notificationBannerHeadingSelector, heading)
      .closest('.govuk-notification-banner')
      .find(this.notificationBannerBodySelector)
      .should('contain.text', bodyText);
  }
}
