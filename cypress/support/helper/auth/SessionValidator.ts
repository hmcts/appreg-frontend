/// <reference types="cypress" />
import { AUTH_CONSTANTS, HTTP_CONSTANTS, TIMEOUT_CONSTANTS } from '../../constants/ProjectConstants';

export class SessionValidator {
  static verifySessionIsValid(): void {
    cy.request({
      method: 'GET',
      url: AUTH_CONSTANTS.SESSION_ENDPOINT,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(HTTP_CONSTANTS.STATUS_OK);
      expect(response.body).to.have.property(AUTH_CONSTANTS.AUTHENTICATED_PROPERTY, AUTH_CONSTANTS.AUTHENTICATED_VALUE);
      expect(response.body).to.have.property(AUTH_CONSTANTS.NAME_PROPERTY);
      expect(response.body).to.have.property(AUTH_CONSTANTS.USERNAME_PROPERTY);
      
      cy.log(`Session validated - User: ${response.body[AUTH_CONSTANTS.NAME_PROPERTY]} (${response.body[AUTH_CONSTANTS.USERNAME_PROPERTY]})`);
    });

    cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME).should('exist');
  }

  static verifyCookieExists(cookieName: string): void {
    cy.getCookie(cookieName).should('exist');
  }

  static verifyCookieNotExists(cookieName: string): void {
    cy.getCookie(cookieName).should('not.exist');
  }

  static waitForSessionEstablishment(): void {
    cy.wait(AUTH_CONSTANTS.SESSION_WAIT_TIME);
    cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME, { 
      timeout: TIMEOUT_CONSTANTS.DEFAULT_TIMEOUT 
    }).should('exist');
  }

  static validateSessionCookie(): void {
    cy.getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME).should('exist');
  }
}