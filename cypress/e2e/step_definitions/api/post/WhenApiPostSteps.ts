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
      keys.forEach((key, idx) => {
        rowObj[key] = values[idx];
      });
      processedRow = processDatatableRow(rowObj);
    }
    ApiPostHelper.postWithProcessedRow(endpoint, processedRow);
  },
);
