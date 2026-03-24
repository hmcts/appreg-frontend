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
