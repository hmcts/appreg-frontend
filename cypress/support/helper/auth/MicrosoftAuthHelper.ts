/// <reference types="cypress" />
import {
  APP_URLS,
  AUTH_CONSTANTS,
  TIMEOUT_CONSTANTS,
  UI_CONSTANTS,
} from '../../constants/ProjectConstants';
import { LinkHelper } from '../forms/link/LinkHelper';

export class MicrosoftAuthHelper {
  static performLogin(email: string, password: string): void {
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
  }

  static performSignOut(): void {
    // Click the app's sign out link or button
    LinkHelper.clickLink(UI_CONSTANTS.BUTTON_TEXT_SIGN_OUT);
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
    cy.contains(/sign in|login/i, {
      timeout: TIMEOUT_CONSTANTS.DEFAULT_TIMEOUT,
    }).should('be.visible');
  }

  /**
   * Validates successful redirect back to the application after authentication
   */
  static validateRedirectFromMicrosoft(): void {
    // Wait for the redirect and ensure we're back in the app
    cy.url().should('not.include', AUTH_CONSTANTS.MICROSOFT_LOGIN_DOMAIN, {
      timeout: TIMEOUT_CONSTANTS.EXTENDED_TIMEOUT,
    });
    cy.url().should('include', Cypress.config('baseUrl'));
  }
}
