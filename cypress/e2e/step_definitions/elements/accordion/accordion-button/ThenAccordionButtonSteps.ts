import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { AccordionButtonHelper } from '../../../../../support/helper/forms/accordion/accordionButton/AccordionButtonHelper';

Then(
  'User Verifies The Button {string} Is Disabled In The Accordion {string}',
  (buttonText: string, accordionTitle: string) => {
    AccordionHelper.ensureAccordionExpanded(accordionTitle);
    AccordionButtonHelper.verifyButtonDisabled(accordionTitle, buttonText);
  },
);
