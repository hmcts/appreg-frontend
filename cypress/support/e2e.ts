/// <reference types="cypress" />

import './commands';
import { TestDataGenerator } from './utils/TestDataGenerator';

const isApiSpec = Cypress.spec.relative.includes('/apiTests/');

if (isApiSpec) {
  Cypress.Screenshot.defaults({
    screenshotOnRunFailure: false,
  });
}

beforeEach(() => {
  cy.request({
    url: '/sso/logout',
    failOnStatusCode: false,
    followRedirect: false,
  }).then(() => {
    Cypress.session.clearAllSavedSessions().catch(() => {});
    cy.clearCookies();
    cy.clearLocalStorage();
    cy.clearAllSessionStorage();
  });

  TestDataGenerator.resetScenario();
  cy.viewport(1280, 720); // Set a default viewport size
});

afterEach(function () {
  if (isApiSpec) {
    return;
  }

  const state = this.currentTest?.state ?? 'unknown';
  const title = (this.currentTest?.title ?? 'unnamed')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80);
  cy.screenshot(`${state}/${title}`, { overwrite: true });
});
