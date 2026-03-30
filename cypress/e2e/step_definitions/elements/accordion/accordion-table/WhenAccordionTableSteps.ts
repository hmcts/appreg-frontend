import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionTableHelper } from '../../../../../support/helper/forms/accordion/accordionTable/AccordionTableHelper';

When(
  'User Checks The Checkbox In Row Of Table In The Accordion {string} With:',
  (
    accordionTitle: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }

    // Loop through all rows to check multiple checkboxes
    rows.forEach((rowData, index) => {
      AccordionTableHelper.checkCheckboxInAccordionTableRows(rowData);
      cy.screenshot(`checked-checkbox-in-row-${index + 1}`);
    });
  },
);
