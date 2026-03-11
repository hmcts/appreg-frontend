import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { TextHelper } from '../../../../support/helper/forms/text/TextHelper';
import { PageElements } from '../../../../support/pageobjects/pageelements/PageElements';

Then('User See {string} On The Page', (expectedText: string) => {
  TextHelper.verifyTextPresence(PageElements.body, expectedText);
});

Then('User Sees Page Heading {string}', (expectedText: string) => {
  TextHelper.verifyPageHeading(PageElements.pageHeading, expectedText);
});

Then(
  'User Sees Text {string} In {string} Field',
  (expectedText: string, containerLabel: string) => {
    TextHelper.verifyTextInSection(containerLabel, expectedText);
  },
);

Then(
  'User Sees Field Error {string} For {string}',
  (errorMessage: string, fieldLabel: string) => {
    TextHelper.verifyFieldError(fieldLabel, errorMessage);
    cy.screenshot(`FieldError-${fieldLabel}`);
  },
);
