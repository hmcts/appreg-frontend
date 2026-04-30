import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListEntriesSearchHelper } from '../../../support/helper/appreg/ApplicationListEntriesDetailsHelper';

When('User Searches Application List Entries With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListEntriesSearchHelper.searchApplicationListEntries({
    criteria: searchCriteria,
  });
});
