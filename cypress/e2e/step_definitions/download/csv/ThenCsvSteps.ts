import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { CsvDownloadHelper } from '../../../../support/helper/download/csv/CsvDownloadHelper';

Then('User Clears Downloaded CSVs', () => {
  CsvDownloadHelper.clearDownloadsFolder();
});

Then(
  'User Verifies The Downloaded CSV Has Headers In Row {int}:',
  (row: number, dataTable: DataTable) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const lines = content.split('\n');
      const targetRow = lines[row - 1]; // Convert to 0-based index
      const expectedHeaders = dataTable.raw().map((headerRow) => headerRow[0]);
      expectedHeaders.forEach((header) => {
        expect(targetRow).to.include(
          header,
          `Expected CSV row ${row} to contain header "${header}"`,
        );
      });
    });
  },
);

Then(
  'User Verifies Latest Downloaded CSV Contains Text {string} In Row {int}',
  (expectedText: string, row: number) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const lines = content.split('\n');
      const targetRow = lines[row - 1]; // Convert to 0-based index
      expect(targetRow).to.include(
        expectedText,
        `Expected CSV row ${row} to contain text "${expectedText}"`,
      );
    });
  },
);

Then('User Verifies CSV {string} Is Downloaded', (partialName: string) => {
  CsvDownloadHelper.findCsvByName(partialName).then((filename) => {
    cy.log(`✓ CSV Downloaded: ${filename}`);
  });
});
