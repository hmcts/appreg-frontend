import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { CsvDownloadHelper } from '../../../../support/helper/download/csv/CsvDownloadHelper';

const csvLines = (content: string): string[] =>
  content
    .replace(/^\uFEFF/, '')
    .split(/\r?\n/)
    .filter((line) => line.length > 0);

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

Then(
  'User Verifies Latest Downloaded CSV Contains Text {string}',
  (expectedText: string) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      expect(content).to.include(
        expectedText,
        `Expected latest downloaded CSV to contain text "${expectedText}"`,
      );
    });
  },
);

Then('User Verifies CSV {string} Is Downloaded', (partialName: string) => {
  CsvDownloadHelper.findCsvByName(partialName).then((filename) => {
    cy.log(`✓ CSV Downloaded: ${filename}`);
  });
});

Then(
  'User Verifies Latest Downloaded CSV Contains All Columns From Fixture {string} In Row {int} Using Delimiter {string}',
  (fixtureFile: string, row: number, delimiter: string) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const lines = csvLines(content);
      const targetRow = lines[row - 1]; // Convert to 0-based index

      expect(
        targetRow,
        `Expected downloaded CSV to contain row ${row}`,
      ).not.to.equal(undefined);

      cy.fixture(fixtureFile).then((fixtureContent: string) => {
        const fixtureLines = csvLines(fixtureContent);
        const expectedHeaders = fixtureLines[0]
          .split(delimiter)
          .map((header) => header.trim())
          .filter(Boolean);
        const downloadedHeaders = targetRow
          .split(delimiter)
          .map((header) => header.trim());

        expectedHeaders.forEach((header) => {
          expect(downloadedHeaders).to.include(
            header,
            `Expected downloaded CSV row ${row} to contain header "${header}" from fixture "${fixtureFile}"`,
          );
        });
      });
    });
  },
);

Then(
  'User Verifies Latest Downloaded CSV Retains All Original Data From Fixture {string} Using Delimiter {string}',
  (fixtureFile: string, delimiter: string) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const downloadedLines = csvLines(content);

      cy.fixture(fixtureFile).then((fixtureContent: string) => {
        const fixtureLines = csvLines(fixtureContent);

        expect(
          downloadedLines.length,
          `Expected downloaded CSV to retain every row from fixture "${fixtureFile}"`,
        ).to.equal(fixtureLines.length);

        fixtureLines.forEach((fixtureLine, index) => {
          const expectedFields = fixtureLine.split(delimiter);
          const downloadedFields = downloadedLines[index].split(delimiter);

          expect(
            downloadedFields.slice(0, expectedFields.length),
            `Expected downloaded CSV row ${index + 1} to retain all original data`,
          ).to.deep.equal(expectedFields);
        });
      });
    });
  },
);

Then(
  'User Verifies Latest Downloaded CSV Using Delimiter {string} Contains Validation Errors:',
  (delimiter: string, dataTable: DataTable) => {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const lines = csvLines(content);
      const validationErrors = dataTable.hashes();
      const headerFields = lines[0].split(delimiter);
      const originalColumnCount = headerFields.reduce(
        (lastNamedColumn, header, index) =>
          header.trim() === '' ? lastNamedColumn : index + 1,
        0,
      );

      validationErrors.forEach((error) => {
        const sourceRow = Number(error['Source row']);
        const expectedError = error['Validation error'];

        expect(
          Number.isInteger(sourceRow) && sourceRow > 0,
          `Expected source row "${error['Source row']}" to be a positive integer`,
        ).to.equal(true);

        const sourceLine = lines[sourceRow - 1];
        expect(
          sourceLine,
          `Expected downloaded CSV to contain source row ${sourceRow}`,
        ).not.to.equal(undefined);

        const appendedValidationErrors = sourceLine
          .split(delimiter)
          .slice(originalColumnCount)
          .map((value) => value.trim())
          .filter(Boolean);

        expect(
          appendedValidationErrors,
          `Expected source row ${sourceRow} to contain validation error "${expectedError}"`,
        ).to.include(expectedError);
      });
    });
  },
);
