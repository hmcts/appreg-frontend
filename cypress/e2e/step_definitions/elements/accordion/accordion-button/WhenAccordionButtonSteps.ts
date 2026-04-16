import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { ButtonHelper } from '../../../../../support/helper/forms/button/ButtonHelper';

/**
 * Step: User clicks a button within a specific accordion.
 * Uses AccordionHelper.within() to scope ButtonHelper inside the accordion content.
 */
When(
  'User Clicks On The {string} Button In The Accordion {string}',
  (buttonText: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      ButtonHelper.clickButton(buttonText),
    );
  },
);
