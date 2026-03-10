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

When(
  'User Makes PUT API Request To {string} With Object Builder:',
  (endpoint: string, dataTable: DataTable) => {
    const rows = dataTable.raw();
    const rowObj: Record<string, string> = {};

    // Skip header row (index 0) and process data rows (starting from index 1)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const key = row[0].trim();
        const value = row[1].trim();
        rowObj[key] = value;
      }
    }

    // Process dynamic values like {RANDOM}, dates, etc.
    const processedRow = processDatatableRow(rowObj);

    // Build nested object from flat dot-notation keys and make PUT request
    ApiPutHelper.putWithBuilder(endpoint, processedRow);
  },
);
