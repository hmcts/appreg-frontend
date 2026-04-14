import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { BannerHelper } from '../../../../support/helper/forms/banner/BannerHelper';

Then('User Sees Validation Error Banner {string}', (expectedText: string) => {
  BannerHelper.verifyErrorBanner(expectedText);
  cy.screenshot(`ErrorBannerWithText-${expectedText.substring(0, 30)}`);
});

Then(
  'User Does Not See Validation Error Banner {string}',
  (unexpectedText: string) => {
    BannerHelper.verifyErrorBannerNotPresent(unexpectedText);
  },
);

Then('User Sees Notification Banner {string}', (expectedText: string) => {
  BannerHelper.verifyBannerText(expectedText);
  cy.screenshot(`BannerWithText-${expectedText.substring(0, 30)}`);
});

Then(
  'User Sees Success Banner {string} Containing {string}',
  (heading: string, bodyText: string) => {
    BannerHelper.verifySuccessBannerContaining(heading, bodyText);
    cy.screenshot(`BannerWithText-${heading.substring(0, 30)}`);
  },
);

Then('User Sees Success Banner {string}', (expectedText: string) => {
  BannerHelper.verifySuccessBanner(expectedText);
  cy.screenshot(`BannerWithText-${expectedText.substring(0, 30)}`);
});

Then('User Sees Warning Banner {string}', (expectedText: string) => {
  BannerHelper.verifyWarningBanner(expectedText);
  cy.screenshot(`WarningBannerWithText-${expectedText.substring(0, 30)}`);
});
