/// <reference types="cypress" />

import './commands';
import 'cypress-mochawesome-reporter/register';
import { TestDataGenerator } from './utils/TestDataGenerator';

beforeEach(() => {
  void Cypress.session.clearAllSavedSessions();
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();

  TestDataGenerator.resetScenario();
  cy.viewport(1280, 720); // Set a default viewport size
});

afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    void cy.screenshot(`success-${this.currentTest.title}`);
  }
});
