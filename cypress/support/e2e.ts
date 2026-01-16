/// <reference types="cypress" />

import './commands';
import { TestDataGenerator } from './utils/TestDataGenerator';

beforeEach(() => {
  Cypress.session.clearAllSavedSessions().catch(() => {});
  cy.clearCookies();
  cy.clearLocalStorage();
  cy.clearAllSessionStorage();

  TestDataGenerator.resetScenario();
  cy.viewport(1280, 720); // Set a default viewport size
});

// Capture screenshots for passed tests (keep failure screenshots via Cypress defaults)
afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    cy.screenshot(`success-${this.currentTest.title}`);
  }
});
