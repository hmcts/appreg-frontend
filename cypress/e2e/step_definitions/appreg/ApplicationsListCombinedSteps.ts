import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListCombinedHelper } from '../../../support/helper/appreg/ApplicationListCombinedHelper';

When('User Searches Application List With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListCombinedHelper.searchApplicationList(searchCriteria);
  cy.screenshot('search-application-list-results');
});
