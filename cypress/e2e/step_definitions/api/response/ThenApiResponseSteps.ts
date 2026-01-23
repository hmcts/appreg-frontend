import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

import { ApiResponseHelper } from '../../../../support/helper/api/apiResponse/ApiResponseHelper';

Then(
  'User Verify Response Status Code Should Be {string}',
  (expectedStatusCode: string) => {
    ApiResponseHelper.verifyStatusCode(expectedStatusCode);
  },
);

Then(
  'User Stores Response Body Property {string} As {string}',
  (propertyPath: string, aliasName: string) => {
    ApiResponseHelper.storeResponseBodyProperty(propertyPath, aliasName);
  },
);

Then('User Verify Response Body Should Have:', (dataTable: DataTable) => {
  const rows: [string, string][] = dataTable.raw().filter((row): row is [string, string] => row.length === 2);
  ApiResponseHelper.verifyResponseBodyShouldHave(rows);
});

Then(
  'User Verify Response Body Property {string} Should Be {string}',
  (propertyPath: string, expectedValue: string) => {
    ApiResponseHelper.verifyResponseBodyPropertyShouldBe(
      propertyPath,
      expectedValue,
    );
  },
);
