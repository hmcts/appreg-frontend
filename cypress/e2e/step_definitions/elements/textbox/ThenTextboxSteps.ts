import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextboxHelper } from '../../../../support/helper/forms/textbox/TextboxHelper';

Then(
  'User enters {string} into the {string} textbox',
  (value: string, field: string) => {
    TextboxHelper.typeInTextbox(field, value);
    cy.screenshot(`TypedInTextbox-${field}-${value}`);
  });

Then('User clears the {string} textbox', (field: string) => {
  TextboxHelper.clearTextbox(field);
  cy.screenshot(`ClearedTextbox-${field}`);
});

Then(
  'User verifies the {string} textbox contains {string}',
  (field: string, value: string) => {
    TextboxHelper.getValueInTextbox(field).should('eq', value);
  });

Then('User verifies the {string} textbox is empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('be.empty');
});

Then('User verifies the {string} textbox is not empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('not.be.empty');
});
