import { LinkElement } from '../../../pageobjects/generic/link/LinkElement';

export class LinkHelper {
  static clickLink(linkText: string): void {
    LinkElement.findLink(linkText).click();
  }

  static clickTab(tabName: string): void {
    const fragment = tabName.trim().toLowerCase().replaceAll(' ', '-');

    LinkElement.findTab(tabName)
      .should('be.visible')
      .parents('[data-module="govuk-tabs"]')
      .should('have.attr', 'data-govuk-tabs-init')
      .then(() => {
        LinkElement.findTab(tabName).click();
      })
      .then(() => {
        cy.get(`#${fragment}`).should(
          'not.have.class',
          'govuk-tabs__panel--hidden',
        );
      });
  }

  static clickLinkExact(linkText: string): void {
    LinkElement.findLinkExact(linkText).click();
  }

  static verifyLinkVisible(linkText: string): void {
    LinkElement.findLink(linkText).should('be.visible');
  }

  static verifyLinkNotVisible(linkText: string): void {
    LinkElement.findLink(linkText).should('not.exist');
  }

  static clickBreadcrumbLink(breadcrumbLinkText: string): void {
    LinkElement.findBreadcrumbLink(breadcrumbLinkText).click();
  }
}
