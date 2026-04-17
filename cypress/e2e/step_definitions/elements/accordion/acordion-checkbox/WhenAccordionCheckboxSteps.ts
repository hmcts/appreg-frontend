import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { CheckboxHelper } from '../../../../../support/helper/forms/checkbox/CheckboxHelper';

When(
  'User Verifies The Checkbox With Label {string} In The Accordion {string} Is Enabled',
  (label: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      CheckboxHelper.verifyEnabled(label),
    );
  },
);
