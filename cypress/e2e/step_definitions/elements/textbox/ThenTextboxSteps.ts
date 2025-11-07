/// <reference types="cypress" />
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
  'User Verifies The {string} Textbox Has Value {string}',
  (field: string, value: string) => {
    const substituteValue = TestDataGenerator.replaceRandomPlaceholders(value);
    TextboxHelper.verifyValueInTextbox(field, substituteValue);
  },
);

Then('User Verifies The {string} Textbox Is Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('be.empty');
});

Then('User Verifies The {string} Textbox Is Not Empty', (field: string) => {
  TextboxHelper.getValueInTextbox(field).should('not.be.empty');
});

Then(
  'User Selects {string} From The Textbox {string} Autocomplete By Typing {string}',
  (optionText: string, field: string, textToType: string) => {
    const substituteTextToType =
      TestDataGenerator.replaceRandomPlaceholders(textToType);
    const substituteOptionText =
      TestDataGenerator.replaceRandomPlaceholders(optionText);

    if (substituteOptionText && substituteOptionText.trim() !== '') {
      TextboxHelper.selectAutocompleteOption(
        field,
        substituteTextToType,
        substituteOptionText,
      );
      cy.screenshot(`SelectedAutocomplete-${field}-${substituteOptionText}`);
    } else {
      TextboxHelper.typeInTextbox(field, substituteTextToType);
      cy.screenshot(`TypedInAutocomplete-${field}-${substituteTextToType}`);
    }
  },
);

Then(
  'User Verifies The {string} Textbox Has Selected Value {string}',
  (field: string, expectedValue: string) => {
    const substituteValue =
      TestDataGenerator.replaceRandomPlaceholders(expectedValue);
    TextboxHelper.verifyValueInTextbox(field, substituteValue);
  },
);

Then(
  'User Verifies DropDown Error Message Is Displayed As {string}',
  (expectedErrorMessage: string) => {
    const substituteErrorMessage =
      TestDataGenerator.replaceRandomPlaceholders(expectedErrorMessage);
    TextboxHelper.verifyAutocompleteErrorMessage(substituteErrorMessage);
  },
);

