import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../support/helper/forms/accordion/AccordionHelper';

Then(
  'User Should See The Accordion {string}',
  (detailsSectionTitle: string) => {
    AccordionHelper.IsAccordionVisible(detailsSectionTitle);
  },
);

Then(
  'User Should See The Textbox {string} In The Accordion {string}',
  (labelText: string, detailsSectionTitle: string) => {
    AccordionHelper.verifyTextboxInAccordion(labelText, detailsSectionTitle);
  },
);
