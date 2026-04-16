import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TextboxHelper } from '../../../../../support/helper/forms/textbox/TextboxHelper';

Then(
  'User Should See The Text {string} In The Accordion {string}',
  (expectedText: string, accordionTitle: string) => {
    AccordionHelper.within(accordionTitle, () =>
      TextboxHelper.verifyContainsText(expectedText),
    );
  },
);
