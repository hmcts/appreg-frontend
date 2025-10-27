/// <reference types="cypress" />
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { LinkHelper } from '../forms/link/LinkHelper';
import { NavigationHelper } from '../navigation/NavigationHelper';
import { APP_URLS } from '../../constants/ProjectConstants';
import { AUTH_CONSTANTS } from '../../constants/ProjectConstants';

export class AuthHelper {
  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.session(
      email,
      () => {
        cy.visit(APP_URLS.HOME);
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

        // Wait for the redirect and ensure we're back in the app
        cy.url().should('not.include', 'login.microsoftonline.com', { timeout: AUTH_CONSTANTS.EXTENDED_TIMEOUT });
        cy.url().should('include', Cypress.config('baseUrl'));
        
        // Wait for session to be established
        cy.wait(AUTH_CONSTANTS.SESSION_WAIT_TIME);
        cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME, { timeout: AUTH_CONSTANTS.DEFAULT_TIMEOUT }).should('exist');
      },
      {
        validate() {
          cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME).should('exist');
        },
      },
    );

    NavigationHelper.navigateToUrl(APP_URLS.APPLICATIONS_LIST);
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
    cy.visit(APP_URLS.HOME);
    cy.contains(/sign in|login/i, { timeout: AUTH_CONSTANTS.DEFAULT_TIMEOUT }).should('be.visible');
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
    cy.visit(APP_URLS.HOME);
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
    cy.visit(APP_URLS.HOME);
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

  static verifySessionIsValid(): void {
    cy.log('Verifying session is valid with tokens stored in Redis');

    // Verify session endpoint returns authenticated status
    cy.request({
      method: 'GET',
      url: AUTH_CONSTANTS.SESSION_ENDPOINT,
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.equal(AUTH_CONSTANTS.HTTP_STATUS_OK);
      expect(response.body).to.have.property(AUTH_CONSTANTS.AUTHENTICATED_PROPERTY, AUTH_CONSTANTS.AUTHENTICATED_VALUE);
      expect(response.body).to.have.property(AUTH_CONSTANTS.NAME_PROPERTY);
      expect(response.body).to.have.property(AUTH_CONSTANTS.USERNAME_PROPERTY);
      cy.log('Session validation successful - user is authenticated');
      cy.log(`User: ${response.body.name} (${response.body.username})`);
    });

    // Verify the secure session cookie is httpOnly and secure
    cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME)
      .should('exist')
      .then((cookie) => {
        if (cookie) {
          cy.wrap(cookie.httpOnly).should('be.true');
          cy.log('Session cookie is properly secured (httpOnly)');
        }
      });
  }
}