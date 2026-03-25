/// <reference types="cypress" />

import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AlertHelper } from '../../../../support/helper/forms/alert/AlertHelper';

Then('User Sees Warning Alert {string}', (alertText: string) => {
    AlertHelper.verifyWarningAlertVisible(alertText);
    cy.screenshot(`WarningAlertWithText-${alertText.substring(0, 30)}`);
}); 

Then('User Sees Error Alert {string}', (alertText: string) => {
    AlertHelper.verifyErrorAlertVisible(alertText);
    cy.screenshot(`ErrorAlertWithText-${alertText.substring(0, 30)}`);
});

Then('User Sees Success Alert {string}', (alertText: string) => {
    AlertHelper.verifySuccessAlertVisible(alertText);
    cy.screenshot(`SuccessAlertWithText-${alertText.substring(0, 30)}`);
});

Then('User Sees Information Alert {string}', (alertText: string) => {
    AlertHelper.verifyInfoAlertVisible(alertText);
    cy.screenshot(`InfoAlertWithText-${alertText.substring(0, 30)}`);
});