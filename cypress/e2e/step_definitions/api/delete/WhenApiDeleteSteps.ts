import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiDeleteHelper } from '../../../../support/helper/api/apiDelete/ApiDeleteHelper';
import { processDatatableRow } from '../../../../support/utils/TestDataGenerator';

When('User Makes DELETE API Request To {string}', (endpoint: string) => {
  ApiDeleteHelper.makeDeleteRequest(endpoint);
});

When(
  'User Makes DELETE API Request To {string} With Object Builder:',
  (endpoint: string, dataTable: DataTable) => {
    const rowObj: Record<string, string> = {};

    for (const row of dataTable.raw()) {
      if (row.length >= 2) {
        rowObj[row[0].trim()] = row[1].trim();
      }
    }

    ApiDeleteHelper.deleteWithBuilder(endpoint, processDatatableRow(rowObj));
  },
);
