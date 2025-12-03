/// <reference types="cypress" />

export class LinkElement {
  static findLink(linkText: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains('a, button[role="link"]', linkText);
  }

  static findBreadcrumbLink(
    breadcrumbLinkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get('nav.govuk-breadcrumbs').contains('a', breadcrumbLinkText);
  }
}
