import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionCheckboxHelper } from '../../../../../support/helper/forms/accordion/accordionCheckbox/AccordionCheckboxHelper';

When(
  'User Verifies The Checkbox With Label {string} In The Accordion {string} Is Enabled',
  (label: string, accordionTitle: string) => {
    AccordionCheckboxHelper.verifyCheckboxEnabled(accordionTitle, label);
  },
);
