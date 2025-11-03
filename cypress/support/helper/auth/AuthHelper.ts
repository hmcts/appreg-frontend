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
        ButtonHelper.clickButton('Sign in');

        MicrosoftAuthHelper.performLogin(email, password);

        cy.log('Waiting for OAuth redirect...');
        cy.wait(5000);

        cy.url({ timeout: 10000, log: true }).then((url) => {
          cy.log(`Current URL after wait: ${url}`);
        });

        SessionValidator.waitForSessionEstablishment();
        cy.log('SSO login completed successfully');
      },
      {
        validate() {
          cy.log('Validating existing session...');
          SessionValidator.validateSessionCookie();
        },
      },
    );
    NavigationHelper.navigateToUrl(APP_URLS.APPLICATIONS_LIST);
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
