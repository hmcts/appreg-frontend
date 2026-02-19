/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { PdfAssertions } from '../../../../support/helper/pdf/PdfAssertions';
import { PdfDownloadHelper } from '../../../../support/helper/pdf/PdfDownloadHelper';

Then('User Clears Downloaded PDFs', () => {
  PdfDownloadHelper.clearDownloadsFolder();
});

Then('User Verifies PDF {string} Is Downloaded', (partialName: string) => {
  PdfDownloadHelper.findPdfByName(partialName).then((filename) => {
    cy.log(`✓ PDF Downloaded: ${filename}`);
  });
});

Then(
  'User Verifies Latest Downloaded PDF Contains Text {string}',
  (expectedText: string) => {
    PdfAssertions.verifyLatestPdfContainsText(expectedText);
  },
);

Then(
  'User Verifies Latest Downloaded PDF Contains {int} {string} Entries',
  (expectedCount: number, entryType: string) => {
    PdfAssertions.verifyLatestPdfContainsEntries(expectedCount, entryType);
  },
);

Then('User Verifies Latest Downloaded PDF Is Not Empty', () => {
  PdfAssertions.verifyLatestPdfIsNotEmpty();
});

Then(
  'User Verifies Latest Downloaded PDF Has {int} Pages',
  (expectedPages: number) => {
    PdfAssertions.verifyLatestPdfPageCount(expectedPages);
  },
);

Then(
  'User Verifies Latest Downloaded PDF Contains The Following Values:',
  (dataTable: { rows: () => string[][] }) => {
    PdfAssertions.verifyLatestPdfContainsValues(dataTable.rows());
  },
);
