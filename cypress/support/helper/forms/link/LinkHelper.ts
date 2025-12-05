import { LinkElement } from '../../../pageobjects/generic/link/LinkElement';

export class LinkHelper {
  static clickLink(linkText: string): void {
    LinkElement.findLink(linkText).click();
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
