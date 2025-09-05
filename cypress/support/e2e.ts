// cypress/support/e2e.js
// Add custom commands or setup code for e2e tests here
/// <reference types="cypress" />

import './commands';
import 'cypress-mochawesome-reporter/register';

beforeEach(() => {
  // Add any setup code needed before each test
  // Example: cy.clearCookies();
});

afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    cy.screenshot(`success-${this.currentTest.title}`);
  }
});

after(() => {
  void Cypress.session.clearAllSavedSessions();
  void cy.clearCookies();
  void cy.clearCookies({ domain: '.microsoftonline.com' });
  void cy.clearCookies({ domain: 'login.microsoftonline.com' });
});
