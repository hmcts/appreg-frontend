/// <reference types="cypress" />

export class LinkElement {
  private static readonly linkSelector = 'a, button[role="link"]';
  private static readonly breadcrumbNavSelector =
    'nav[aria-label="breadcrumb"], nav[aria-label="Breadcrumb"], nav[role="navigation"], .breadcrumb, nav.breadcrumbs';

  static findLink(linkText: string, exact: boolean = false): Cypress.Chainable {
    if (!exact) {
      // preserve previous substring matching behavior (no change to tests)
      return cy.contains(this.linkSelector, linkText);
    }

    // escape regex metacharacters in the provided text
    const escapeRegExp = (s: string) =>
      // use String.raw for the replacement so backslashes don't need escaping
      s.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
    const escaped = escapeRegExp(linkText);
    // match the exact text, allowing leading/trailing whitespace
    const exactRegex = new RegExp(String.raw`^\s*${escaped}\s*$`);
    return cy.contains(this.linkSelector, exactRegex);
  }

  static findLinkExact(linkText: string): Cypress.Chainable {
    return this.findLink(linkText, true);
  }

  static findBreadcrumbLink(breadcrumbLinkText: string): Cypress.Chainable {
    return cy.get(this.breadcrumbNavSelector).contains('a', breadcrumbLinkText);
  }
}
