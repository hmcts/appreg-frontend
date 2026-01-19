/// <reference types="cypress" />
import { APP_URLS } from '../../constants/ProjectConstants';
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { NavigationHelper } from '../navigation/NavigationHelper';

import { MicrosoftAuthHelper } from './MicrosoftAuthHelper';
import { SessionValidator } from './SessionValidator';

export class AuthHelper {
  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.session(
      email,
      () => {
        cy.log(`Starting SSO login for: ${email}`);
        cy.visit(APP_URLS.HOME);
        cy.screenshot('01-HomePage-Before-SignIn');

        ButtonHelper.clickButton('Sign in');
        cy.screenshot('02-After-Clicking-SignIn-Button');

        MicrosoftAuthHelper.performLogin(email, password);

        // Give the OAuth callback a moment to process
        cy.log('Waiting for OAuth callback to process...');
        cy.url({ timeout: 10000 }).should(
          'not.include',
          'login.microsoftonline.com',
        );

        cy.log('Visiting app to trigger OAuth callback...');
        cy.visit(APP_URLS.APPLICATIONS_LIST, { timeout: 30000 });
        cy.log('OAuth callback completed - redirected to applications list');
      },
      {
        validate() {
          cy.log('Validating existing session...');
          SessionValidator.validateSessionCookie();
        },
      },
    );
    NavigationHelper.navigateToUrl(APP_URLS.APPLICATIONS_LIST);
    cy.screenshot('05-Final-ApplicationsList-Page');
  }

  static aadSignOut(): void {
    MicrosoftAuthHelper.performSignOut();
  }

  static clearCookiesAndStorage(): void {
    cy.log('Clearing cookies and storage');
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  }
}
