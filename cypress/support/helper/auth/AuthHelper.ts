/// <reference types="cypress" />
import { APP_URLS } from '../../constants/ProjectConstants';
import { ButtonHelper } from '../forms/button/ButtonHelper';

import { MicrosoftAuthHelper } from './MicrosoftAuthHelper';
import { SessionValidator } from './SessionValidator';

export class AuthHelper {
  private static isBypassSsoEnabled(): boolean {
    const value = Cypress.env('DEV_BYPASS_SSO');
    return value === true || value === 'true';
  }

  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.log(`Starting SSO login for: ${email}`);
    cy.visit(APP_URLS.HOME);
    cy.screenshot('01-HomePage-Before-SignIn');

    if (AuthHelper.isBypassSsoEnabled()) {
      cy.log('DEV_BYPASS_SSO=true: skipping Microsoft login flow');
      cy.visit(APP_URLS.APPLICATIONS_LIST);
      cy.contains('Sign out').should('be.visible');
      cy.screenshot('06-Final-ApplicationsList-Page');
      cy.log('Local bypass SSO login completed');
      return;
    }

    AuthHelper.acquireSsoLoginLock();

    ButtonHelper.clickButton('Sign in', 40000);
    cy.screenshot('02-After-Clicking-SignIn-Button');

    MicrosoftAuthHelper.performLogin(email, password);

    cy.url({ timeout: 30000 }).should('include', '/applications-list');
    SessionValidator.waitForSessionEstablishment();
    SessionValidator.verifySessionIsValid();
    cy.screenshot('06-Final-ApplicationsList-Page');
    cy.log('SSO login completed');
    AuthHelper.releaseSsoLoginLock();
  }

  static acquireSsoLoginLock(): void {
    cy.task<string>('acquireSsoLoginLock').then(() => {
      cy.log('Acquired shared SSO login lock');
    });
  }

  static releaseSsoLoginLock(): void {
    cy.task<boolean>('releaseSsoLoginLock', null, { log: false }).then(
      (released) => {
        if (released) {
          cy.log('Released shared SSO login lock');
        }
      },
    );
  }

  static aadSignOut(): void {
    AuthHelper.acquireSsoLoginLock();
    MicrosoftAuthHelper.performSignOut();
    AuthHelper.releaseSsoLoginLock();
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
