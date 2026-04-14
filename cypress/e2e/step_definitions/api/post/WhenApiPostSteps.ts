import { DataTable, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiPostHelper } from '../../../../support/helper/api/apiPost/ApiPostHelper';
import { processDatatableRow } from '../../../../support/utils/TestDataGenerator';

When(
  'User Makes POST API Request To {string} With Body:',
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
    ApiPostHelper.postWithProcessedRow(endpoint, processedRow);
  },
);

When(
  'User Makes POST API Request To {string} With Json Body',
  (endpoint: string, jsonBody: string) => {
    ApiPostHelper.postWithJsonBody(endpoint, jsonBody);
  },
);

When(
  'User Makes POST API Request To {string} With Object Builder:',
  (endpoint: string, dataTable: DataTable) => {
    const rows = dataTable.raw();
    const rowObj: Record<string, string> = {};

    // Process all rows (no header row in Object Builder tables)
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (row.length >= 2) {
        const key = row[0].trim();
        const value = row[1].trim();
        rowObj[key] = value;
      }
    }

    // Process dynamic values like {RANDOM}, dates, etc.
    const processedRow = processDatatableRow(rowObj);

    // Build nested object from flat dot-notation keys and make POST request
    ApiPostHelper.postWithBuilder(endpoint, processedRow);
  },
);
