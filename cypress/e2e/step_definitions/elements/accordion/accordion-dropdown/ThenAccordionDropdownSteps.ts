import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { DropdownHelper } from '../../../../../support/helper/forms/dropdown/DropdownHelper';

Then(
  'User Selects {string} From The Accordion {string} Dropdown {string}',
  (optionText: string, accordionTitle: string, dropdownLabel: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.selectDropdownOption(dropdownLabel, optionText);
    });
  },
);

Then(
  'The Accordion {string} Dropdown {string} Should Be {string}',
  (accordionTitle: string, dropdownLabel: string, expectedValue: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.verifyDropdownOptionSelected(dropdownLabel, expectedValue);
    });
  },
);

Then(
  'User Verifies Dropdown {string} Is Disabled In The Accordion {string}',
  (dropdownLabel: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      DropdownHelper.verifyDropdownIsDisabled(dropdownLabel);
    });
  },
);
