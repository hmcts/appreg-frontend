/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';

Then('User Waits For {int} Milliseconds', (delayMs: number) => {
  cy.wait(delayMs);
});
