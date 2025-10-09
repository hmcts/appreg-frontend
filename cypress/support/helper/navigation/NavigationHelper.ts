/// <reference types="cypress" />
import { NavigationPage } from '../../pageobjects/pageelements/NavigationPage';

export class NavigationHelper {
  static navigateToPortalPage(): void {
    cy.log('Navigating to portal page: ', Cypress.config('baseUrl'));
    cy.visit('/');
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
    cy.url().should('include', partialUrl);
  }

  static verifySignOutLinkVisible(): void {
    cy.log('Verifying Sign out link is visible');
    NavigationPage.signOutLink().should('be.visible');
  }
}
