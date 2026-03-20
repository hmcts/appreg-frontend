import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';

When('User Toggles The Accordion {string}', (accordionSectionTitle: string) => {
  AccordionHelper.toggleAccordion(accordionSectionTitle);
});
