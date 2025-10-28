/// <reference types="cypress" />
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { NavigationHelper } from '../navigation/NavigationHelper';
import { APP_URLS } from '../../constants/ProjectConstants';
import { SessionValidator } from './SessionValidator';
import { MicrosoftAuthHelper } from './MicrosoftAuthHelper';

export class AuthHelper {
  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.session(
      email,
      () => {
        cy.visit(APP_URLS.HOME);
        ButtonHelper.clickButton('Sign in');

        // Perform Microsoft authentication
        MicrosoftAuthHelper.performLogin(email, password);

        // Validate redirect back to app
        MicrosoftAuthHelper.validateRedirectFromMicrosoft();
        
        // Wait for session to be established
        SessionValidator.waitForSessionEstablishment();
      },
      {
        validate() {
          SessionValidator.validateSessionCookie();
        },
      },
    );

    NavigationHelper.navigateToUrl(APP_URLS.APPLICATIONS_LIST);
  }

  static aadSignOut(): void {
    MicrosoftAuthHelper.performSignOut();
  }

  // Auth-specific utility methods
  static clearCookiesAndStorage(): void {
    cy.log('Clearing cookies and storage');
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.window().then((win) => {
      win.sessionStorage.clear();
    });
  }

}