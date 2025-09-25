/// <reference types="cypress" />

import './commands';
import 'cypress-mochawesome-reporter/register';

beforeEach(() => {
  // Add any setup code needed before each test
  cy.viewport(1280, 720); // Set a default viewport size
});

afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    cy.screenshot(`success-${this.currentTest.title}`);
  }
});

after(() => {
  void Cypress.session.clearAllSavedSessions();
  void cy.clearCookies();
});
