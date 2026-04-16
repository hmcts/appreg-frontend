import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { CheckboxHelper } from '../../../../../support/helper/forms/checkbox/CheckboxHelper';

Then(
  'User Verifies The Checkbox With Label {string} In The Accordion {string} Is Unchecked',
  (label: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      CheckboxHelper.verifyUnchecked(label),
    );
  },
);

Then(
  'User Checks The Checkbox With Label {string} In The Accordion {string}',
  (label: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      CheckboxHelper.check(label);
    });
  },
);
