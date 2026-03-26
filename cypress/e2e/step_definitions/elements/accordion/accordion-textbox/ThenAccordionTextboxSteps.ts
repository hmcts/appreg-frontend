import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionTextboxHelper } from '../../../../../support/helper/forms/accordion/accordionTextbox/AccordionTextboxHelper';

Then(
  'User Enters {string} Into The Accordion {string} Textbox {string}',
  (text: string, accordionTitle: string, textboxLabel: string) => {
    cy.log(
      `Entering text: "${text}" into textbox: "${textboxLabel}" within accordion: "${accordionTitle}"`,
    );
    AccordionTextboxHelper.enterTextIntoAccordionTextbox(
      accordionTitle,
      textboxLabel,
      text,
    );
  },
);

Then(
  'User Verifies The Accordion {string} Textbox {string} Contains {string}',
  (accordionTitle: string, textboxLabel: string, expectedValue: string) => {
    cy.log(
      `Verifying textbox: "${textboxLabel}" within accordion: "${accordionTitle}" contains: "${expectedValue}"`,
    );
    AccordionTextboxHelper.verifyTextboxValue(
      accordionTitle,
      textboxLabel,
      expectedValue,
    );
  },
);

Then(
  'User Verifies The {string} Accordion Has Value {string}',
  (accordionTitle: string, expectedValue: string) => {
    AccordionTextboxHelper.verifyAccordionValue(accordionTitle, expectedValue);
  },
);
Then(
  'User Verifies The {string} Accordion Has textbox with placeholder {string} and Enters {string}',
  (accordionTitle: string, placeholder: string, value: string) => {
    AccordionTextboxHelper.verifyAccordionTextboxPlaceholder(
      accordionTitle,
      placeholder,
      value,
    );
  },
);

Then(
  'User Verifies The Textbox {string} Is Disabled In The Accordion {string}',
  (textboxLabel: string, accordionTitle: string) => {
    AccordionTextboxHelper.verifyTextboxDisabledInAccordion(
      accordionTitle,
      textboxLabel,
    );
  },
);
