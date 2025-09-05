/// <reference types="cypress" />
import { ButtonHelper } from '../../../support/helper/forms/button/ButtonHelper';
import { NavigationHelper } from '../navigation/NavigationHelper';

export class AuthHelper {
  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.session(
      email,
      () => {
        cy.visit('/');
        ButtonHelper.clickButton('Sign in');

        cy.origin(
          'https://login.microsoftonline.com',
          { args: { email, password } },
          ({ email, password }) => {
            cy.wait(2000, { log: false });
            cy.get('input[name="loginfmt"]').should('be.visible').type(email);
            cy.get('input[type="submit"]').click();
            cy.get('input[name="passwd"]').should('be.visible').type(password);
            cy.get('input[type="submit"]').should('be.visible').click();
            cy.wait(2000, { log: false });
            cy.get('#idBtn_Back').should('be.visible').click();
          },
        );
      },
      {
        validate() {
          NavigationHelper.navigateToUrl('/applications-list');
          NavigationHelper.verifySignOutLinkVisible();
        },
      },
    );
    NavigationHelper.navigateToUrl('/applications-list');
  }

  static verifyCookieExists(cookieName: string): void {
    cy.log(`Verifying existence of cookie: ${cookieName}`);
    cy.getCookie(cookieName).should('exist');
  }

  static verifyCookieNotExists(cookieName: string): void {
    cy.log(`Verifying non-existence of cookie: ${cookieName}`);
    cy.getCookie(cookieName).should('not.exist');
  }

  static verifyElementNotVisible(element: string): void {
    cy.log(`Verifying element not visible: ${element}`);
    cy.get(element).should('not.exist');
  }

  static verifyElementVisible(element: string): void {
    cy.log(`Verifying element visible: ${element}`);
    cy.get(element).should('exist');
  }

  static clearCookiesAndStorage(): void {
    cy.log('Clearing cookies and storage');
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  }

  static pageRefresh(): void {
    cy.log('Refreshing the page');
    cy.reload();
  }
}
