import {Then} from "@badeball/cypress-cucumber-preprocessor";

import {DetailsHelper} from "../../../../support/helper/forms/details/DetailsHelper";

Then('User Should See The Details section {string}', (detailsSectionTitle: string) => {
  DetailsHelper.verifyDetailsSectionVisible(detailsSectionTitle);
});

Then('User Should Not See The Details section {string}', (detailsSectionTitle: string) => {
  DetailsHelper.verifyDetailsSectionNotVisible(detailsSectionTitle);
});

Then('User Clicks On The Details section {string}', (detailsSectionTitle: string) => {
  DetailsHelper.clickDetailsSection(detailsSectionTitle);
});