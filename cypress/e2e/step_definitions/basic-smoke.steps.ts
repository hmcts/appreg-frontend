import { Given } from '@badeball/cypress-cucumber-preprocessor';

Given('I open the application', () => {
  cy.visit('/');
});
