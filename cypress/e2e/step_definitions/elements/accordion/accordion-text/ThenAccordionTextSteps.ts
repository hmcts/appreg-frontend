import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionTextHelper } from '../../../../../support/helper/forms/accordion/accordionText/AccordionTextHelper';

Then(
  'User Should See The Text {string} In The Accordion {string}',
  (expectedText: string, accordionTitle: string) => {
    AccordionTextHelper.verifyTextInAccordion(accordionTitle, expectedText);
  },
);
