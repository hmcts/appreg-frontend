/// <reference types="cypress" />
import { Then } from '@badeball/cypress-cucumber-preprocessor';

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
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(
        files.length,
        `Expected at least 1 PDF file in downloads folder, but found ${files.length}`,
      ).to.be.greaterThan(0);

      const latestPdf = files[files.length - 1];
      cy.log(`Verifying PDF contains text: "${expectedText}"`);
      PdfDownloadHelper.verifyPdfContainsText(latestPdf, expectedText);
    });
  },
);

Then(
  'User Verifies Latest Downloaded PDF Contains {int} {string} Entries',
  (expectedCount: number, entryType: string) => {
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(
        files.length,
        `Expected at least 1 PDF file in downloads folder, but found ${files.length}`,
      ).to.be.greaterThan(0);

      const latestPdf = files[files.length - 1];
      cy.log(`Verifying PDF has ${expectedCount} "${entryType}" entries`);

      PdfDownloadHelper.getPdfText(latestPdf).then((text) => {
        const escapedEntryType = entryType.replaceAll(
          /[.*+?^${}()|[\]\\]/g,
          String.raw`\$&`,
        );
        const pattern = new RegExp(
          String.raw`\d+\.\s+${escapedEntryType}`,
          'g',
        );
        const matches = text.match(pattern);
        const actualCount = matches ? matches.length : 0;

        expect(
          actualCount,
          `Expected ${expectedCount} "${entryType}" entries in PDF, but found ${actualCount}`,
        ).to.equal(expectedCount);
      });
    });
  },
);

Then('User Verifies Latest Downloaded PDF Is Not Empty', () => {
  PdfDownloadHelper.listPdfFiles().then((files) => {
    expect(
      files.length,
      `Expected at least 1 PDF file in downloads folder, but found ${files.length}`,
    ).to.be.greaterThan(0);

    const latestPdf = files[files.length - 1];
    cy.log(`Verifying PDF is not empty: ${latestPdf}`);
    PdfDownloadHelper.verifyFileNotEmpty(latestPdf);
  });
});

Then(
  'User Verifies Latest Downloaded PDF Has {int} Pages',
  (expectedPages: number) => {
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(
        files.length,
        `Expected at least 1 PDF file in downloads folder, but found ${files.length}`,
      ).to.be.greaterThan(0);

      const latestPdf = files[files.length - 1];
      cy.log(`Verifying PDF has ${expectedPages} page(s)`);
      PdfDownloadHelper.verifyPdfPageCount(latestPdf, expectedPages);
    });
  },
);

Then(
  'User Verifies Latest Downloaded PDF Contains The Following Values:',
  (dataTable: { rawTable: string[][] }) => {
    PdfDownloadHelper.listPdfFiles().then((files) => {
      expect(
        files.length,
        `Expected at least 1 PDF file in downloads folder, but found ${files.length}`,
      ).to.be.greaterThan(0);

      const latestPdf = files[files.length - 1];
      const rows = dataTable.rawTable;

      cy.log(`Verifying PDF contains ${rows.length} values`);

      PdfDownloadHelper.getPdfText(latestPdf).then((text) => {
        for (const [key, value] of rows) {
          cy.log(`Checking: ${key} = "${value}"`);

          expect(text).to.include(key, `PDF should contain key: "${key}"`);

          expect(text).to.include(
            value,
            `PDF should contain value: "${value}"`,
          );
        }
      });
    });
  },
);
