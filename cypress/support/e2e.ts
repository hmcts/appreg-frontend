/// <reference types="cypress" />

import './commands';
import { AUTH_CONSTANTS } from './constants/ProjectConstants';
import { AuthHelper } from './helper/auth/AuthHelper';
import { BaseDownloadHelper } from './helper/download/BaseDownloadHelper';
import { TestDataGenerator } from './utils/TestDataGenerator';

const isApiSpec = Cypress.spec.relative.includes('/apiTests/');

function configureSpecDownloadsFolder(): Cypress.Chainable {
  const downloadsPath = BaseDownloadHelper.getDownloadsPath();

  return BaseDownloadHelper.ensureDownloadsFolderExists().then(() => {
    if (Cypress.browser.family !== 'chromium') {
      return null;
    }

    return Cypress.automation('remote:debugger:protocol', {
      command: 'Page.setDownloadBehavior',
      params: {
        behavior: 'allow',
        downloadPath: downloadsPath,
      },
    });
  });
}

function clearAuthenticationState(): Cypress.Chainable {
  const baseUrl = Cypress.config('baseUrl');

  if (!baseUrl) {
    throw new Error('Cypress baseUrl is required to clear the SSO session');
  }

  return cy
    .getCookie(AUTH_CONSTANTS.SESSION_COOKIE_NAME)
    .then((sessionCookie) => {
      if (!sessionCookie) {
        return cy.wrap(null, { log: false });
      }

      // /login passes through the CSRF middleware in both production and
      // local servers, unlike SSO routes mounted before that middleware.
      return cy
        .request({
          url: '/login',
          failOnStatusCode: false,
        })
        .then(() => cy.getCookie('XSRF-TOKEN'))
        .then((xsrfCookie) => {
          if (!xsrfCookie) {
            throw new Error('SSO logout requires an XSRF-TOKEN cookie');
          }

          return cy.request({
            method: 'POST',
            url: '/sso/logout',
            headers: { origin: new URL(baseUrl).origin },
            form: true,
            body: { _csrf: xsrfCookie.value },
            followRedirect: false,
          });
        })
        .then((response) => {
          expect(response.status).to.eq(302);
        });
    })
    .then(() => {
      Cypress.session.clearAllSavedSessions().catch(() => {});
      cy.clearCookies();
      cy.clearLocalStorage();
      cy.clearAllSessionStorage();
    });
}

if (isApiSpec) {
  Cypress.Screenshot.defaults({
    screenshotOnRunFailure: false,
  });
}

beforeEach(() => {
  configureSpecDownloadsFolder().then(() => {
    clearAuthenticationState();
  });

  TestDataGenerator.resetScenario();
  cy.viewport(1280, 720); // Set a default viewport size
});

afterEach(function () {
  AuthHelper.releaseSsoLoginLock();

  if (isApiSpec) {
    return;
  }

  const state = this.currentTest?.state ?? 'unknown';
  const title = (this.currentTest?.title ?? 'unnamed')
    .replace(/[^a-zA-Z0-9-_]/g, '_')
    .slice(0, 80);
  cy.screenshot(`${state}/${title}`, { overwrite: true });
});
