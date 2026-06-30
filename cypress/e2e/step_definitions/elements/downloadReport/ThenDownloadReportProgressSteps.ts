import { Then } from '@badeball/cypress-cucumber-preprocessor';

import { DownloadReportHelper } from '../../../../support/helper/forms/downloadReport/DownloadReportHelper';

Then('User Waits For The Report Download To Complete', () => {
  DownloadReportHelper.waitForReportDownloadToComplete();
});
