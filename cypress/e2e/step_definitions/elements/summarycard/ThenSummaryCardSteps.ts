import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { SummaryCardHelper } from '../../../../support/helper/forms/summarycard/SummaryCardHelper';

Then(
  'User Should See Summary Card With Title {string}',
  (cardTitle: string) => {
    SummaryCardHelper.verifySummaryCardVisible(cardTitle);
  },
);

Then(
  'User Should See Tag {string} In Summary Card {string}',
  (tagText: string, cardTitle: string) => {
    SummaryCardHelper.verifyTagInCard(cardTitle, tagText);
  },
);

Then(
  'User Should See The Link {string} In Summary Card {string}',
  (linkText: string, cardTitle: string) => {
    SummaryCardHelper.verifyLinkInCard(cardTitle, linkText);
  },
);

Then(
  'User Clicks The Link {string} In Summary Card {string}',
  (linkText: string, cardTitle: string) => {
    SummaryCardHelper.clickLinkInCard(cardTitle, linkText);
  },
);

Then(
  'User Should See {string} In Summary Card {string}',
  (expectedText: string, cardTitle: string) => {
    SummaryCardHelper.verifyTextInCard(cardTitle, expectedText);
  },
);

Then(
  'User Verifies The {string} Summary Card Has Textbox With Placeholder {string} And Enters {string}',
  (cardTitle: string, placeholder: string, value: string) => {
    SummaryCardHelper.verifySummaryCardTextboxPlaceholder(
      cardTitle,
      placeholder,
      value,
    );
  },
);
