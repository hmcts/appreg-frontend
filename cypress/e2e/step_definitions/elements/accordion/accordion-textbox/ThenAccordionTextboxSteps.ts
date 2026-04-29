import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TextboxHelper } from '../../../../../support/helper/forms/textbox/TextboxHelper';
import { TestDataGenerator } from '../../../../../support/utils/TestDataGenerator';

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
    const resolvedExpected =
      TestDataGenerator.replaceRandomPlaceholders(expectedValue);
    AccordionHelper.within(accordionTitle, () => {
      if (!textboxLabel || textboxLabel.trim() === '') {
        // Find the first textbox (input or textarea) in the accordion
        cy.get('input[type="text"], textarea')
          .first()
          .invoke('val')
          .should('eq', resolvedExpected);
      } else {
        TextboxHelper.getValueInTextbox(textboxLabel).should(
          'eq',
          resolvedExpected,
        );
      }
    });
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
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.typeInTextboxByPlaceholder(placeholder, value),
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
