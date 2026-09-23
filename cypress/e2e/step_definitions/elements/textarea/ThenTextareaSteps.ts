/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextareaHelper } from '../../../../support/helper/forms/textarea/TextareaHelper';
import { TestDataGenerator } from '../../../../support/utils/TestDataGenerator';

Then('User Should See The Textarea {string}', (field: string) => {
    TextareaHelper.verifyTextareaIsVisible(field);  
})

Then('User Enters {string} Into The {string} Textarea', (value: string, field: string) => {
    const substituteValue = TestDataGenerator.replaceRandomPlaceholders(value);
    TextareaHelper.typeInTextarea(field, substituteValue);
    cy.screenshot(`TypedInTextarea-${field}-${substituteValue}`);
})

Then('User Clears The {string} Textarea', (field: string) => {
    TextareaHelper.clearTextarea(field);
    cy.screenshot(`ClearedTextarea-${field}`);
})

Then('User Verifies The {string} Textarea Has Value {string}', (field: string, value: string) => {
    const substituteValue = TestDataGenerator.replaceRandomPlaceholders(value);
    TextareaHelper.verifyValueInTextarea(field, substituteValue);
})