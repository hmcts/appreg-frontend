/// <reference types="cypress" />
import { ButtonHelper } from '../forms/button/ButtonHelper';

import { MicrosoftAuthHelper } from './MicrosoftAuthHelper';

export class AuthHelper {
  static signInWithMicrosoftSSO(email: string, password: string): void {
    cy.log(`Starting SSO login for: ${email}`);

    cy.screenshot('01-HomePage-Before-SignIn');

    ButtonHelper.clickButton('Sign in');
    cy.screenshot('02-After-Clicking-SignIn-Button');

    MicrosoftAuthHelper.performLogin(email, password);

    cy.url({ timeout: 30000 }).should('include', '/applications-list');
    cy.screenshot('06-Final-ApplicationsList-Page');
    cy.log('SSO login completed');
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
