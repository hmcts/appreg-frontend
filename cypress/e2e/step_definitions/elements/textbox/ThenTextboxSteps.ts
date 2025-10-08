import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextboxHelper } from '../../../../support/helper/forms/textbox/TextboxHelper';

Then(
  'User Enters {string} Into The {string} Textbox',
  (value: string, field: string) => {
    TextboxHelper.typeInTextbox(field, value);
    cy.screenshot(`TypedInTextbox-${field}-${value}`);
  },
);

Then('User Clears The {string} Textbox', (field: string) => {
  TextboxHelper.clearTextbox(field);
  cy.screenshot(`ClearedTextbox-${field}`);
});

Then(
  'User Verifies The {string} Textbox Contains {string}',
  (field: string, value: string) => {
    TextboxHelper.getValueInTextbox(field).should('eq', value);
  },
);

Then('User Verifies The {string} Textbox Is Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('be.empty');
});

Then('User Verifies The {string} Textbox Is Not Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('not.be.empty');
});
