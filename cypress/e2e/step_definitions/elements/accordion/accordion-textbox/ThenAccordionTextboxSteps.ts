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
    AccordionHelper.within(accordionTitle, () => {
      TextboxHelper.getValueInTextbox(textboxLabel).should('eq', expectedValue);
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
