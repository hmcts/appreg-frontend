import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListEntriesCombinedHelper } from '../../../support/helper/appreg/ApplicationListEntriesCombinedHelper';

When('User Searches Applications With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListEntriesCombinedHelper.searchApplicationListEntry({
    criteria: searchCriteria,
  });
});

When('User Fills In The Applicant Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.fillApplicant({ criteria });
});

When('User Fills In The Respondent Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.fillRespondent({ criteria });
});

When('User Verifies In The Applicant Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.verifyApplicant({ criteria });
});

When('User Verifies In The Respondent Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.verifyRespondent({ criteria });
});
