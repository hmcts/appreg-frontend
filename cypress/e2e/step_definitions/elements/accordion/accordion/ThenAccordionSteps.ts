import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';

Then('User Should See The Accordion {string}', (accordionTitle: string) => {
  AccordionHelper.isAccordionVisible(accordionTitle);
});

Then(
  'User Verifies The {string} Accordion Has Value {string}',
  (accordionTitle: string, expectedValue: string) => {
    AccordionHelper.verifyAccordionValue(accordionTitle, expectedValue);
  },
);

Then(
  'User Verifies The {string} Accordion Has textbox with placeholder {string} and Enters {string}',
  (accordionTitle: string, placeholder: string, value: string) => {
    AccordionHelper.verifyAccordionTextboxPlaceholder(
      accordionTitle,
      placeholder,
      value,
    );
  },
);
