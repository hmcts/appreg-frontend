/// <reference types="cypress" />

import { DownloadReportElement } from '../../../pageobjects/generic/downloadreport/DownloadReportElement';

export class DownloadReportHelper {
  private static readonly REPORT_DOWNLOAD_TIMEOUT_MS = 120_000;

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

    cy.get('app-async-job-progress', {
      timeout: this.REPORT_DOWNLOAD_TIMEOUT_MS,
    }).should('not.exist');
    cy.contains('app-success-banner [role="alert"]', 'Report downloaded', {
      timeout: this.REPORT_DOWNLOAD_TIMEOUT_MS,
    }).should('be.visible');
  }
}
