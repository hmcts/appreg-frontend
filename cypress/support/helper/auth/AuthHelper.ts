/// <reference types="cypress" />
import { ButtonHelper } from '../../../support/helper/forms/button/ButtonHelper';
import { LinkHelper } from '../forms/link/LinkHelper';
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
          ({ email: innerEmail, password: innerPassword }) => {
            cy.get('input[name="loginfmt"]')
              .should('be.visible')
              .type(innerEmail, { log: false });
            cy.get('input[type="submit"]').click();
            cy.get('input[name="passwd"]')
              .should('be.visible')
              .type(innerPassword, { log: false });
            cy.get('input[type="submit"]').should('be.visible').click();
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

  static aadSignOut(): void {
    // Click the app's sign out link or button
    LinkHelper.clickLink('Sign out');
    cy.log('AAD logout initiated');

    // If redirected to Microsoft account picker, click the user tile to fully sign out
    cy.origin('https://login.microsoftonline.com', () => {
      cy.get('body', { timeout: 10000 }).then(($body) => {
        if ($body.find('.table-cell.tile-img > .tile-img').length) {
          cy.get('.table-cell.tile-img > .tile-img')
            .should('be.visible')
            .click();
        }
      });
    });

    // Verify signed-out state in app
    cy.visit('/');
    cy.contains(/sign in|login/i, { timeout: 10000 }).should('be.visible');
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

  static signInWithInvalidEmailAndVerifyError(
    invalidEmail: string,
    expectedError: string,
  ): void {
    cy.visit('/');
    ButtonHelper.clickButton('Sign in');
    cy.url().should('include', 'login.microsoftonline.com');
    cy.origin(
      'https://login.microsoftonline.com',
      { args: { invalidEmail, expectedError } },
      ({ invalidEmail: emailArg, expectedError: errorArg }) => {
        cy.get('input[name="loginfmt"]')
          .should('be.visible')
          .type(emailArg, { log: false });
        cy.get('input[type="submit"]').click();
        cy.contains(errorArg, { timeout: 10000 }).should('be.visible');
      },
    );
  }

  static signInWithValidEmailInvalidPasswordAndVerifyError(
    validEmail: string,
    invalidPassword: string,
    expectedError: string,
  ): void {
    cy.visit('/');
    ButtonHelper.clickButton('Sign in');
    cy.url().should('include', 'login.microsoftonline.com');
    cy.origin(
      'https://login.microsoftonline.com',
      { args: { validEmail, invalidPassword, expectedError } },
      ({
        validEmail: emailArg,
        invalidPassword: passArg,
        expectedError: errorArg,
      }) => {
        cy.get('input[name="loginfmt"]')
          .should('be.visible')
          .type(emailArg, { log: false });
        cy.get('input[type="submit"]').click();
        cy.get('input[type="password"]', { timeout: 30000 })
          .should('be.visible')
          .type(passArg, { log: false });
        cy.get('input[type="submit"]').click();
        cy.contains(errorArg, { timeout: 10000 }).should('be.visible');
      },
    );
  }
}
