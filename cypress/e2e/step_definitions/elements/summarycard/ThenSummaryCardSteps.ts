import { Then, When } from '@badeball/cypress-cucumber-preprocessor';

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

When('User Starts Listening For Result Retrieval', () => {
  cy.intercept('GET', '**/application-lists/*/entries/*/results**').as(
    'resultRetrieval',
  );
});

Then(
  'User Stores Updated Date Time For Result {string} From Result Retrieval As {string}',
  (resultCode: string, aliasName: string) => {
    cy.wait('@resultRetrieval').then(({ response }) => {
      const body = response?.body as
        | { content?: { resultCode?: string; updatedDateTime?: string }[] }
        | undefined;
      const result = body?.content?.find(
        (item) => item.resultCode === resultCode,
      );

      if (!result) {
        throw new Error(
          `Result ${resultCode} was not found in the retrieval response.`,
        );
      }
      if (!result.updatedDateTime) {
        throw new Error(
          `Result ${resultCode} did not include an updatedDateTime.`,
        );
      }

      cy.wrap(result.updatedDateTime).as(aliasName);
    });
  },
);

Then(
  'User Verifies The Local Updated Date And Time In Summary Card {string} From Alias {string}',
  (cardTitle: string, aliasName: string) => {
    cy.get<string>(`@${aliasName}`).then((updatedDateTime) => {
      SummaryCardHelper.verifyUpdatedDateTimeInCard(cardTitle, updatedDateTime);
    });
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
