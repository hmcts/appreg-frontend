import { Given } from '@badeball/cypress-cucumber-preprocessor';

Given('User Is On The Portal Page', () => {
  cy.visit('/');
});
