import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextHelper } from '../../../../support/helper/forms/text/TextHelper';
import { PageElements } from '../../../../support/pageobjects/pageelements/PageElements';

Then('User See {string} On The Page', (expectedText: string) => {
  TextHelper.verifyTextPresence(PageElements.body, expectedText);
});

Then('User Sees Text {string} In {string} Field', (expectedText: string, containerLabel: string) => {
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
