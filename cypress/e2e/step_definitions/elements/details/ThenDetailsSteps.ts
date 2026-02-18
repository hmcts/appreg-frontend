import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { DetailsHelper } from '../../../../support/helper/forms/details/DetailsHelper';

Then(
  'User Should See The Details section {string}',
  (detailsSectionTitle: string) => {
    DetailsHelper.verifyDetailsSectionVisible(detailsSectionTitle);
  },
);

Then(
  'User Clicks On The Details section {string}',
  (detailsSectionTitle: string) => {
    DetailsHelper.clickDetailsSection(detailsSectionTitle);
  },
);

Then(
  'User Should See The Textbox {string} In The Details section {string}',
  (labelText: string, detailsSectionTitle: string) => {
    DetailsHelper.verifyTextboxInDetailsSection(labelText, detailsSectionTitle);
  },
);