import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextHelper } from '../../../../support/helper/forms/text/TextHelper';
import { PageElements } from '../../../../support/pageobjects/pageelements/PageElements';

Then('User See {string} On The Page', (expectedText: string) => {
  TextHelper.verifyTextPresence(PageElements.body, expectedText);
});

Then('User Sees Page Heading {string}', (expectedText: string) => {
  TextHelper.verifyPageHeading(expectedText, PageElements.pageHeading);
});

Then(
  'User Sees Text {string} In {string} Field',
  (expectedText: string, containerLabel: string) => {
    TextHelper.verifyTextInSection(containerLabel, expectedText);
  },
);

Then('User Sees Validation Error {string}', (errorMessage: string) => {
  TextHelper.verifyValidationError(errorMessage);
  cy.screenshot(`ValidationError-${errorMessage}`);
});

Then('User Does Not See Validation Errors', () => {
  TextHelper.verifyNoValidationErrors();
});

Then('User Sees Notification Banner {string}', (message: string) => {
  TextHelper.verifyNotificationBanner(message);
  cy.screenshot(`NotificationBanner-${message.substring(0, 30)}`);
});

Then(
  'User Sees Field Error {string} For {string}',
  (errorMessage: string, fieldLabel: string) => {
    TextHelper.verifyFieldError(fieldLabel, errorMessage);
    cy.screenshot(`FieldError-${fieldLabel}`);
  },
);
