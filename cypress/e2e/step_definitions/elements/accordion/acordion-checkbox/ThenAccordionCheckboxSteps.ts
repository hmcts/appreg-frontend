import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionCheckboxHelper } from '../../../../../support/helper/forms/accordion/accordionCheckbox/AccordionCheckboxHelper';

Then(
  'User Verifies The Checkbox With Label {string} In The Accordion {string} Is Unchecked',
  (label: string, accordionTitle: string) => {
    AccordionCheckboxHelper.verifyCheckboxUnchecked(accordionTitle, label);
  },
);

Then(
  'User Checks The Checkbox With Label {string} In The Accordion {string}',
  (label: string, accordionTitle: string) => {
    AccordionCheckboxHelper.checkTheCheckbox(accordionTitle, label);
  },
);
