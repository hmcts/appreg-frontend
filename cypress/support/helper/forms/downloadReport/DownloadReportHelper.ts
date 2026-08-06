/// <reference types="cypress" />

import { DownloadReportElement } from '../../../pageobjects/generic/downloadreport/DownloadReportElement';

export class DownloadReportHelper {
  static waitForReportDownloadToComplete(): void {
    cy.contains('app-async-job-progress', 'Report in progress').should(
      'be.visible',
    );
    DownloadReportElement.findDownloadProgressMessage(
      'Report in progress',
    ).should('be.visible');
    DownloadReportElement.findDownloadProgressMessage(
      'Your CSV is being generated and will download automatically when ready.',
    ).should('be.visible');
  }
}
