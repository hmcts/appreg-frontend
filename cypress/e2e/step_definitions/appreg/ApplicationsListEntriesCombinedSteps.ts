import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListEntriesCombinedHelper } from '../../../support/helper/appreg/ApplicationListEntriesCombinedHelper';

When('User Searches Application List Entry With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListEntriesCombinedHelper.searchApplicationListEntry({
    criteria: searchCriteria,
  });
});
