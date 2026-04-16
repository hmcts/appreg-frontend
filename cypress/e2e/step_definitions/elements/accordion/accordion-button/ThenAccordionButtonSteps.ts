import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { ButtonHelper } from '../../../../../support/helper/forms/button/ButtonHelper';

Then(
  'User Verifies The Button {string} Is Disabled In The Accordion {string}',
  (buttonText: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () => {
      ButtonHelper.isButtonDisabled(buttonText);
    });
  },
);
