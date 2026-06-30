import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';

Then('User Should See The Accordion {string}', (accordionTitle: string) => {
  AccordionHelper.isAccordionVisible(accordionTitle);
});

Then(
  'User Should See The Accordion {string} Is Expanded',
  (accordionTitle: string) => {
    AccordionHelper.verifyAccordionExpanded(accordionTitle);
  },
);

Then(
  'User Should See The Accordion {string} Is Collapsed',
  (accordionTitle: string) => {
    AccordionHelper.verifyAccordionCollapsed(accordionTitle);
  },
);

Then(
  'User Should See Text {string} In The Accordion {string}',
  (expectedText: string, accordionTitle: string) => {
    AccordionHelper.verifyAccordionContainsText(accordionTitle, expectedText);
  },
);

Then(
  'User Should See The Following Text In The Accordion {string}:',
  (accordionTitle: string, dataTable: DataTable) => {
    const expectedTexts = dataTable
      .raw()
      .flat()
      .map((text) => text.trim())
      .filter(Boolean);

    AccordionHelper.verifyAccordionContainsTexts(accordionTitle, expectedTexts);
  },
);
