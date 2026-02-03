/// <reference types="cypress" />

export class LinkElement {
  static findLink(
    linkText: string,
    exact: boolean = false,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    if (!exact) {
      // preserve previous substring matching behavior (no change to tests)
      return cy.contains('a, button[role="link"]', linkText);
    }

    // escape regex metacharacters in the provided text
    const escapeRegExp = (s: string) =>
      // use String.raw for the replacement so backslashes don't need escaping
      s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const escaped = escapeRegExp(linkText);
    // match the exact text, allowing leading/trailing whitespace
    const exactRegex = new RegExp(String.raw`^\s*${escaped}\s*$`);
    return cy.contains('a, button[role="link"]', exactRegex);
  }

  static findLinkExact(
    linkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return this.findLink(linkText, true);
  }

  static findBreadcrumbLink(
    breadcrumbLinkText: string,
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy
      .get(
        'nav[aria-label="breadcrumb"], nav[aria-label="Breadcrumb"], nav[role="navigation"], .breadcrumb, nav.breadcrumbs',
      )
      .contains('a', breadcrumbLinkText);
  }
}
