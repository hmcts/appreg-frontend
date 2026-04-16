import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TextboxHelper } from '../../../../../support/helper/forms/textbox/TextboxHelper';

Then(
  'User Enters {string} Into The Accordion {string} Textbox {string}',
  (text: string, accordionTitle: string, textboxLabel: string) => {
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.typeInTextbox(textboxLabel, text),
    );
  },
);

Then(
  'User Verifies The Accordion {string} Textbox {string} Contains {string}',
  (accordionTitle: string, textboxLabel: string, expectedValue: string) => {
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
