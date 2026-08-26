import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TextboxHelper } from '../../../../../support/helper/forms/textbox/TextboxHelper';
import { TestDataGenerator } from '../../../../../support/utils/TestDataGenerator';

const resolveExpectedValue = (
  expectedValue: string,
): Cypress.Chainable<string> => {
  const resolvedValue = TestDataGenerator.parseValue(expectedValue);
  const trailingWhitespace = expectedValue.match(/\s+$/)?.[0] ?? '';

  const aliases = [...resolvedValue.matchAll(/:([A-Za-z][A-Za-z0-9_-]*)\b/g)];

  return aliases
    .reduce(
      (chain, [placeholder, aliasName]) =>
        chain.then((value) =>
          cy
            .get(`@${aliasName}`)
            .then((aliasValue) =>
              value.replace(placeholder, String(aliasValue)),
            ),
        ),
      cy.wrap(resolvedValue),
    )
    .then((value) =>
      trailingWhitespace && !value.endsWith(trailingWhitespace)
        ? `${value}${trailingWhitespace}`
        : value,
    );
};

const normaliseLineEndings = (value: string): string =>
  value.replace(/\r\n/g, '\n');

const normaliseText = (value: string): string =>
  normaliseLineEndings(value)
    .replace(/\u00a0/g, ' ')
    .replace(/[\u200b-\u200d\ufeff]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

Then(
  'User Enters {string} Into The Textbox {string} In The Accordion {string}',
  (text: string, textboxLabel: string, accordionTitle: string) => {
    const resolvedText = TestDataGenerator.replaceRandomPlaceholders(text);
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.typeInTextbox(textboxLabel, resolvedText),
    );
  },
);

Then(
  'User Verifies The Textbox {string} Contains {string} In The Accordion {string}',
  (textboxLabel: string, expectedValue: string, accordionTitle: string) => {
    resolveExpectedValue(expectedValue).then((resolvedExpected) =>
      AccordionHelper.within(accordionTitle, () => {
        TextboxHelper.getValueInTextbox(textboxLabel).should((actualValue) => {
          expect(normaliseText(String(actualValue))).to.contain(
            normaliseText(resolvedExpected),
          );
        });
      }),
    );
  },
);

Then(
  'User Verifies The {string} Accordion Has Value {string}',
  (accordionTitle: string, expectedValue: string) => {
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.verifyContainsText(expectedValue),
    );
  },
);

Then(
  'User Verifies The {string} Accordion Has textbox with placeholder {string} and Enters {string}',
  (accordionTitle: string, placeholder: string, value: string) => {
    const resolvedValue = TestDataGenerator.replaceRandomPlaceholders(value);
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.typeInTextboxByPlaceholder(placeholder, resolvedValue),
    );
  },
);

Then(
  'User Verifies The Textbox {string} Is Disabled In The Accordion {string}',
  (textboxLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      TextboxHelper.TextboxIsDisabled(textboxLabel);
    });
  },
);

Then(
  'User Should See The Textbox {string} Under {string} FieldSet In The Accordion {string}',
  (textboxLabel: string, fieldsetLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      TextboxHelper.verifyTextboxIsVisibleUnderFieldset(
        textboxLabel,
        fieldsetLabel,
      );
    });
  },
);

Then(
  'User Verifies The Textbox {string} In The Accordion {string} Is Empty',
  (textboxLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      TextboxHelper.getValueInTextbox(textboxLabel).should('eq', '');
    });
  },
);

Then(
  'User Verifies Textbox With Placeholder {string} Contains {string} In The Accordion {string}',
  (placeholder: string, expectedValue: string, accordionTitle: string) => {
    resolveExpectedValue(expectedValue).then((resolvedExpected) =>
      AccordionHelper.within(accordionTitle, () => {
        cy.get(
          `input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`,
        )
          .invoke('val')
          .should((actualValue) => {
            expect(normaliseText(String(actualValue))).to.contain(
              normaliseText(resolvedExpected),
            );
          });
      }),
    );
  },
);

Then(
  'User Enters {string} In The Textbox {string} Under {string} FieldSet In The Accordion {string}',
  (
    value: string,
    textboxLabel: string,
    fieldsetLabel: string,
    accordionTitle: string,
  ) => {
    const resolvedValue = TestDataGenerator.replaceRandomPlaceholders(value);
    AccordionHelper.within(accordionTitle, () => {
      TextboxHelper.typeInTextboxUnderFieldset(
        textboxLabel,
        fieldsetLabel,
        resolvedValue,
      );
    });
  },
);

Then(
  'User Verifies The Textbox {string} Contains {string} Under {string} FieldSet In The Accordion {string}',
  (
    textboxLabel: string,
    expectedValue: string,
    fieldsetLabel: string,
    accordionTitle: string,
  ) => {
    resolveExpectedValue(expectedValue).then((resolvedExpected) =>
      AccordionHelper.within(accordionTitle, () => {
        TextboxHelper.getValueInTextboxUnderFieldset(
          textboxLabel,
          fieldsetLabel,
        ).should((actualValue) => {
          expect(normaliseText(String(actualValue))).to.contain(
            normaliseText(resolvedExpected),
          );
        });
      }),
    );
  },
);
