import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';

Then('User Should See The Accordion {string}', (accordionTitle: string) => {
  AccordionHelper.isAccordionVisible(accordionTitle);
});

Then(
  'User Should See The Accordion {string} Expanded',
  (accordionTitle: string) => {
    AccordionHelper.isAccordionExpanded(accordionTitle).should('eq', true);
  },
);
