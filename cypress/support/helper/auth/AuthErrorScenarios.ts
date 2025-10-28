/// <reference types="cypress" />
import { ButtonHelper } from '../forms/button/ButtonHelper';
import { APP_URLS, AUTH_CONSTANTS, UI_CONSTANTS } from '../../constants/ProjectConstants';

export class AuthErrorScenarios {
  
  static signInWithInvalidEmailAndVerifyError(
    invalidEmail: string,
    expectedError: string,
  ): void {
    cy.visit(APP_URLS.HOME);
    ButtonHelper.clickButton(UI_CONSTANTS.BUTTON_TEXT_SIGN_IN);
    cy.url().should('include', AUTH_CONSTANTS.MICROSOFT_LOGIN_DOMAIN);
    
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
    ButtonHelper.clickButton(UI_CONSTANTS.BUTTON_TEXT_SIGN_IN);
    cy.url().should('include', AUTH_CONSTANTS.MICROSOFT_LOGIN_DOMAIN);
    
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
