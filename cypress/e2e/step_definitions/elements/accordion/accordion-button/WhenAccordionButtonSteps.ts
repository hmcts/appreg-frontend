import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionButtonHelper } from '../../../../../support/helper/forms/accordion/accordionButton/AccordionButtonHelper';

/**
 * Step: User clicks a button within a specific accordion
 */
When(
  'User Clicks On The {string} Button In The Accordion {string}',
  (buttonText: string, accordionTitle: string) => {
    AccordionButtonHelper.clickButtonInAccordion(accordionTitle, buttonText);
  },
);
