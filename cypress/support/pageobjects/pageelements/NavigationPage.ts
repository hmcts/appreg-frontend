export class NavigationPage {
  static signOutLink(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get('.govuk-service-navigation__item .govuk-service-navigation__link')
      .contains('Sign out');
  }
}
