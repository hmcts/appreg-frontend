/// <reference types="cypress" />

import './commands';
import 'cypress-mochawesome-reporter/register';
import { TestDataGenerator } from './utils/TestDataGenerator';

beforeEach(() => {
  // Clear sessions and cookies for test independence
  void Cypress.session.clearAllSavedSessions();
  cy.clearCookies();
  cy.clearLocalStorage();

  // Reset scenario data for each test
  TestDataGenerator.resetScenario();
  // Add any setup code needed before each test
  cy.viewport(1280, 720); // Set a default viewport size
});

afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    void cy.screenshot(`success-${this.currentTest.title}`);
  }
});
