import { DataTable, Then, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApplicationListEntriesSearchHelper } from '../../../support/helper/appreg/ApplicationListEntriesDetailsHelper';
import { CivilFeeHelper } from '../../../support/helper/appreg/CivilFeeHelper';

When('User Searches Application List Entries With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListEntriesSearchHelper.searchApplicationListEntries({
    criteria: searchCriteria,
  });
});

When('User Captures The Fees For Application Code {string}', (code: string) => {
  CivilFeeHelper.captureApplicationCodeFees(code);
});

Then('User Verifies The Civil Fee Amounts Against The Application Code', () => {
  CivilFeeHelper.verifyAmounts();
});
