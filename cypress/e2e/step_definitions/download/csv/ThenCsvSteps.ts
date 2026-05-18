import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { CsvDownloadHelper } from '../../../../support/helper/download/csv/CsvDownloadHelper';

Then('User Clears Downloaded CSVs', () => {
  CsvDownloadHelper.clearDownloadsFolder();
});

Then(
  'User Verifies The Downloaded CSV Has Headers:',
  (dataTable: DataTable) => {
    const expectedHeaders = dataTable.raw().map((row) => row[0]);
    CsvDownloadHelper.getLatestCsvHeaders().then((actualHeaders) => {
      expectedHeaders.forEach((header) => {
        expect(actualHeaders).to.include(
          header,
          `Expected CSV header "${header}" to be present`,
        );
      });
    });
  },
);
