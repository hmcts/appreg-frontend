import { When } from '@badeball/cypress-cucumber-preprocessor';

import { AccordionHelper } from '../../../../../support/helper/forms/accordion/accordion/AccordionHelper';
import { TableInteraction } from '../../../../../support/helper/table/TableInteraction';

When(
  'User Checks The Checkbox In Row Of Table {string} In The Accordion {string} With:',
  (
    tableName: string,
    accordionTitle: string,
    dataTable: { hashes: () => { [key: string]: string }[] },
  ) => {
    const rows = dataTable.hashes();
    if (rows.length === 0) {
      throw new Error('DataTable must have at least one row of data');
    }
    const caption = tableName.trim();
    rows.forEach((rowData, index) => {
      AccordionHelper.within(accordionTitle, () => {
        TableInteraction.checkCheckboxInTableRow(caption, rowData);
      });
      cy.screenshot(`checked-checkbox-in-row-${index + 1}`);
    });
  },
);
