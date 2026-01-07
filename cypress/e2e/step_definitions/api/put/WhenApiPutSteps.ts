import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiPutHelper } from '../../../../support/helper/api/apiPut/ApiPutHelper';
import { processDatatableRow } from '../../../../support/utils/TestDataGenerator';

When(
  'User Makes PUT API Request To {string} With Body:',
  (endpoint: string, dataTable: DataTable) => {
    const rows = dataTable.raw();
    let processedRow: Record<string, string> = {};
    if (rows.length === 2 && rows[0].length > 1) {
      // Horizontal datatable: first row is keys, second row is values
      const keys = rows[0];
      const values = rows[1];
      const rowObj: Record<string, string> = {};
      for (let idx = 0; idx < keys.length; idx++) {
        rowObj[keys[idx]] = values[idx];
      }
      processedRow = processDatatableRow(rowObj);
    }
    ApiPutHelper.putWithProcessedRow(endpoint, processedRow);
  },
);

When(
  'User Makes PUT API Request To {string} With Json Body',
  (endpoint: string, jsonBody: string) => {
    ApiPutHelper.putWithJsonBody(endpoint, jsonBody);
  },
);
