/// <reference types="cypress" />
import { APP_URLS } from '../../constants/ProjectConstants';
import { NavigationPage } from '../../pageobjects/pageelements/NavigationPage';

export class NavigationHelper {
  static navigateToPortalPage(): void {
    cy.log('Navigating to portal page: ', Cypress.config('baseUrl'));
    cy.visit(APP_URLS.HOME);
  }

  static navigateToUrl(url: string): void {
    cy.log(`Navigating to ${url}`);
    cy.visit(url);
  }

  static verifyPageTitle(expectedTitle: string): void {
    cy.log(`Verifying page title is ${expectedTitle}`);
    cy.title().should('eq', expectedTitle);
  }

  static verifyPageUrl(expectedUrl: string): void {
    cy.log(`Verifying page URL is ${expectedUrl}`);
    cy.url().should('eq', expectedUrl);
  }

  static verifyPageUrlContains(partialUrl: string): void {
    cy.log(`Verifying page URL contains ${partialUrl}`);
    cy.url({ timeout: 30000 }).should('include', partialUrl);
  }

  static verifySignOutLinkVisible(): void {
    cy.log('Verifying Sign out link is visible');
    NavigationPage.signOutLink().should('be.visible');
  }

  static pageRefresh(): void {
    cy.log('Refreshing the page');
    cy.reload();
  }
}
