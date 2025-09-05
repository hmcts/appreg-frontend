// cypress/support/e2e.js
// Add custom commands or setup code for e2e tests here

import './commands';
import 'cypress-mochawesome-reporter/register';

// You can add global before/after hooks if needed

beforeEach(() => {
  // Add any setup code needed before each test
  // Example: cy.clearCookies();
});

afterEach(function () {
  if (this.currentTest && this.currentTest.state === 'passed') {
    cy.screenshot(`success-${this.currentTest.title}`);
  }
});
