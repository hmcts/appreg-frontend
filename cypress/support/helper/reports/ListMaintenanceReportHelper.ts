/// <reference types="cypress" />

import { CsvDownloadHelper } from '../download/csv/CsvDownloadHelper';

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type RequestBody = Record<string, JsonValue>;

export class ListMaintenanceReportHelper {
  private static readonly createAlias = 'createListMaintenanceReportJob';
  private static readonly statusAlias = 'getListMaintenanceReportJobStatus';
  private static readonly downloadAlias = 'downloadListMaintenanceReportCsv';

  static stubAcceptedJob(jobId: string): void {
    cy.intercept('POST', '**/reports/list-maintenance/jobs', (req) => {
      req.reply({
        delay: 750,
        statusCode: 202,
        headers: {
          'content-type': 'application/vnd.hmcts.appreg.v1+json',
        },
        body: {
          id: jobId,
          type: 'LIST_MAINTENANCE_REPORT',
          status: 'RECEIVED',
        },
      });
    }).as(this.createAlias);
  }

  static stubCompletedJob(jobId: string): void {
    cy.intercept('GET', `**/jobs/${jobId}`, {
      statusCode: 200,
      headers: {
        'content-type': 'application/vnd.hmcts.appreg.v1+json',
      },
      body: {
        id: jobId,
        type: 'LIST_MAINTENANCE_REPORT',
        status: 'COMPLETED',
      },
    }).as(this.statusAlias);
  }

  static stubHeadersOnlyCsvDownload(jobId: string, headers: string[]): void {
    const csv = `${headers.map((header) => this.csvCell(header)).join(',')}\n`;

    cy.intercept('GET', `**/reports/jobs/${jobId}/download`, {
      statusCode: 200,
      headers: {
        'content-type': 'text/csv',
        'content-disposition': 'attachment; filename="list-maintenance.csv"',
      },
      body: csv,
    }).as(this.downloadAlias);
  }

  static verifyReportProgressMessage(): void {
    cy.contains('app-async-job-progress', 'Report in progress').should(
      'be.visible',
    );
    cy.get('app-async-job-progress output[aria-live="polite"]')
      .should('exist')
      .and('contain.text', 'Report in progress')
      .and(
        'contain.text',
        'Your CSV is being generated and will download automatically when ready.',
      );
  }

  static verifyCreateJobRequestContainsOnlyPopulatedFilters(): void {
    cy.wait(`@${this.createAlias}`).then(({ request }) => {
      const body = request.body as RequestBody;
      const location = body['location'] as RequestBody | undefined;

      expect(body).to.deep.include({
        dateFrom: '2026-02-27',
        dateTo: '2026-03-27',
        listDescription: 'Stale lists',
      });
      expect(body).not.to.have.property('description');
      expect(body).not.to.have.property('court');
      expect(body).not.to.have.property('otherLocation');
      expect(body).not.to.have.property('cja');
      expect(location, 'location filter').to.be.an('object');
      const courtLocationCode = location?.['courtLocationCode'];
      expect(courtLocationCode, 'court location code').to.be.a('string');
      expect(courtLocationCode, 'court location code').not.to.equal('');
      expect(location).not.to.have.property('otherLocationDescription');
      expect(location).not.to.have.property('cjaCode');
      this.verifyNoBlankOptionalValues(body);
    });
  }

  static verifyLatestDownloadedCsvContainsOnlyHeaderRow(): void {
    CsvDownloadHelper.getLatestCsvContent().then((content) => {
      const rows = content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      expect(rows, 'non-empty CSV rows').to.have.length(1);
      expect(rows[0], 'CSV header row').not.to.equal('');
    });
  }

  private static verifyNoBlankOptionalValues(value: JsonValue): void {
    if (Array.isArray(value)) {
      value.forEach((item) => this.verifyNoBlankOptionalValues(item));
      return;
    }

    if (value && typeof value === 'object') {
      Object.values(value).forEach((item) =>
        this.verifyNoBlankOptionalValues(item),
      );
      return;
    }

    expect(value, 'request value').not.to.equal('');
    expect(value, 'request value').not.to.equal(null);
  }

  private static csvCell(value: string): string {
    return `"${value.replaceAll('"', '""')}"`;
  }
}
