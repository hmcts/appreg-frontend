import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextboxHelper } from '../../../../support/helper/forms/textbox/TextboxHelper';
import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';

Then(
  'User Enters {string} Into The {string} Textbox',
  (value: string, field: string) => {
    const substituteValue = TestDataGenerator.replaceRandomPlaceholders(value);
    TextboxHelper.typeInTextbox(field, substituteValue);
    cy.screenshot(`TypedInTextbox-${field}-${substituteValue}`);
  },
);

Then('User Clears The {string} Textbox', (field: string) => {
  TextboxHelper.clearTextbox(field);
  cy.screenshot(`ClearedTextbox-${field}`);
});

Then(
  'User Verifies The {string} Textbox Contains {string}',
  (field: string, value: string) => {
    const substituteValue = TestDataGenerator.replaceRandomPlaceholders(value);
    TextboxHelper.getValueInTextbox(field).should('eq', substituteValue);
  },
);

Then('User Verifies The {string} Textbox Is Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('be.empty');
});

Then('User Verifies The {string} Textbox Is Not Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('not.be.empty');
});
