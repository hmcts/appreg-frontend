/// <reference types="cypress" />

import { StringUtils } from '../../utils/StringUtils';
import {
  TestDataGenerator,
  processDatatableRow,
} from '../../utils/TestDataGenerator';

import { PdfDownloadHelper } from './PdfDownloadHelper';

export class PdfAssertions {
  static verifyFileNotEmpty(
    filename: string,
    minSize: number = 1000,
  ): Cypress.Chainable<void> {
    const filePath = `${PdfDownloadHelper.getDownloadsPath()}/${filename}`;
    return cy.readFile(filePath, 'binary').should((content): void => {
      Cypress.log({
        name: 'verifyFileNotEmpty',
        message: `PDF size: ${content.length} bytes (min: ${minSize})`,
      });
      expect(content.length).to.be.greaterThan(
        minSize,
        `PDF file ${filename} should be larger than ${minSize} bytes`,
      );
    });
  }

  static verifyPdfContainsText(
    filename: string,
    expectedText: string,
  ): Cypress.Chainable<void> {
    const processedText = TestDataGenerator.parseValue(expectedText);
    return PdfDownloadHelper.parsePdfContent(filename).then((pdfData): void => {
      Cypress.log({
        name: 'verifyPdfContainsText',
        message: `✓ PDF contains: "${processedText}"`,
      });
      expect(pdfData.text).to.include(
        processedText,
        `PDF should contain text: "${processedText}"`,
      );
    }) as unknown as Cypress.Chainable<void>;
  }

  static verifyPdfPageCount(
    filename: string,
    expectedPages: number,
  ): Cypress.Chainable<void> {
    return PdfDownloadHelper.parsePdfContent(filename).then((pdfData): void => {
      Cypress.log({
        name: 'verifyPdfPageCount',
        message: `✓ PDF has ${pdfData.numPages} page(s)`,
      });
      expect(pdfData.numPages).to.equal(
        expectedPages,
        `PDF should have ${expectedPages} pages, but has ${pdfData.numPages}`,
      );
    }) as unknown as Cypress.Chainable<void>;
  }

  static verifyLatestPdfContainsText(
    expectedText: string,
  ): Cypress.Chainable<void> {
    Cypress.log({
      name: 'verifyLatestPdfContainsText',
      message: `Checking latest PDF contains text: "${expectedText}"`,
    });
    return PdfDownloadHelper.getLatestPdfOrFail().then((latestPdf) =>
      this.verifyPdfContainsText(latestPdf, expectedText),
    ) as unknown as Cypress.Chainable<void>;
  }

  static verifyLatestPdfContainsEntries(
    expectedCount: number,
    entryType: string,
  ): Cypress.Chainable<void> {
    return PdfDownloadHelper.getLatestPdfOrFail().then((latestPdf) => {
      Cypress.log({
        name: 'verifyLatestPdfContainsEntries',
        message: `Checking ${expectedCount} "${entryType}" entries in ${latestPdf}`,
      });
      return PdfDownloadHelper.getPdfText(latestPdf).then((text): void => {
        const normalizedText = StringUtils.normalizeText(text);
        const pattern = StringUtils.buildNumberedEntryPattern(entryType);
        const matches = normalizedText.match(pattern);
        const actualCount = matches ? matches.length : 0;

        expect(
          actualCount,
          `Expected ${expectedCount} "${entryType}" entries in PDF, but found ${actualCount}`,
        ).to.equal(expectedCount);
      }) as unknown as Cypress.Chainable<void>;
    }) as unknown as Cypress.Chainable<void>;
  }

  static verifyLatestPdfIsNotEmpty(
    minSize: number = 1000,
  ): Cypress.Chainable<void> {
    Cypress.log({
      name: 'verifyLatestPdfIsNotEmpty',
      message: 'Checking latest PDF is not empty',
    });
    return PdfDownloadHelper.getLatestPdfOrFail().then((latestPdf) =>
      this.verifyFileNotEmpty(latestPdf, minSize),
    ) as unknown as Cypress.Chainable<void>;
  }

  static verifyLatestPdfPageCount(
    expectedPages: number,
  ): Cypress.Chainable<void> {
    Cypress.log({
      name: 'verifyLatestPdfPageCount',
      message: `Checking latest PDF has ${expectedPages} page(s)`,
    });
    return PdfDownloadHelper.getLatestPdfOrFail().then((latestPdf) =>
      this.verifyPdfPageCount(latestPdf, expectedPages),
    ) as unknown as Cypress.Chainable<void>;
  }

  static verifyLatestPdfContainsValues(
    rows: string[][],
  ): Cypress.Chainable<void> {
    Cypress.log({
      name: 'verifyLatestPdfContainsValues',
      message: `Checking latest PDF contains ${rows.length} value row(s)`,
    });
    return PdfDownloadHelper.getLatestPdfOrFail().then(
      (latestPdf) =>
        PdfDownloadHelper.getPdfText(latestPdf).then((text): void => {
          const normalizedText = StringUtils.normalizeText(text);

          for (const row of rows) {
            const [keyCell, valueCell] = row;
            const hasValue = typeof valueCell === 'string';

            if (hasValue) {
              const processedRow = processDatatableRow({
                key: keyCell,
                value: valueCell,
              });
              const processedKey = processedRow.key;
              const processedValue = processedRow.value;

              const normalizedKey = StringUtils.normalizeText(processedKey);
              const normalizedValue = StringUtils.normalizeText(processedValue);

              expect(normalizedText).to.include(
                normalizedKey,
                `PDF should contain key: "${processedKey}"`,
              );

              expect(normalizedText).to.include(
                normalizedValue,
                `PDF should contain value: "${processedValue}"`,
              );
            } else {
              const processed = TestDataGenerator.parseValue(keyCell);
              const normalized = StringUtils.normalizeText(processed);
              expect(normalizedText).to.include(
                normalized,
                `PDF should contain value: "${processed}"`,
              );
            }
          }
        }) as unknown as Cypress.Chainable<void>,
    ) as unknown as Cypress.Chainable<void>;
  }
}
