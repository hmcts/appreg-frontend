import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TableElement } from '../../../../../support/pageobjects/generic/table/TableElement';

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
    rows.forEach((rowData, index) => {
      AccordionHelper.within(accordionTitle, () => {
        TableElement.verifyCheckboxInTableRows(rowData);
      });
      cy.screenshot(`checked-checkbox-in-row-${index + 1}`);
    });
  },
);
