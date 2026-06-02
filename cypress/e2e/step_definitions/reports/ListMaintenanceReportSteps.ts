import {
  DataTable,
  Given,
  Then,
} from '@badeball/cypress-cucumber-preprocessor';

import { ListMaintenanceReportHelper } from '../../../support/helper/reports/ListMaintenanceReportHelper';

Given(
  'List Maintenance Report Job Will Be Accepted With Job Id {string}',
  (jobId: string) => {
    ListMaintenanceReportHelper.stubAcceptedJob(jobId);
  },
);

Given('Report Job {string} Will Complete', (jobId: string) => {
  ListMaintenanceReportHelper.stubCompletedJob(jobId);
});

Given(
  'Report Job {string} Will Download Headers Only CSV:',
  (jobId: string, dataTable: DataTable) => {
    const headers = dataTable.raw().map((row) => row[0]);
    ListMaintenanceReportHelper.stubHeadersOnlyCsvDownload(jobId, headers);
  },
);

Then('User Sees Report Progress Message', () => {
  ListMaintenanceReportHelper.verifyReportProgressMessage();
});

Then(
  'User Verifies List Maintenance Report Job Request Contains Only Populated Filters',
  () => {
    ListMaintenanceReportHelper.verifyCreateJobRequestContainsOnlyPopulatedFilters();
  },
);

Then('User Verifies Latest Downloaded CSV Contains Only Header Row', () => {
  ListMaintenanceReportHelper.verifyLatestDownloadedCsvContainsOnlyHeaderRow();
});
