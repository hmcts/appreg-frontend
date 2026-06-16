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
  const rows: [string, string][] = dataTable
    .raw()
    .filter((row): row is [string, string] => row.length === 2);
  ApiResponseHelper.verifyResponseBodyShouldHave(rows);
});

Then(
  'User Verify Response Body Array Property {string} Should Contain Values:',
  (arrayPropertyPath: string, dataTable: DataTable) => {
    const values = dataTable
      .raw()
      .flat()
      .map((value) => value.trim())
      .filter(Boolean);
    ApiResponseHelper.verifyResponseBodyArrayPropertyShouldContainValues(
      arrayPropertyPath,
      values,
    );
  },
);

Then(
  'User Verify Response Body Array Property {string} At Field {string} Should Contain Values:',
  (arrayPropertyPath: string, fieldPath: string, dataTable: DataTable) => {
    const values = dataTable
      .raw()
      .flat()
      .map((value) => value.trim())
      .filter(Boolean);
    ApiResponseHelper.verifyResponseBodyArrayPropertyFieldShouldContainValues(
      arrayPropertyPath,
      fieldPath,
      values,
    );
  },
);

Then(
  'User Verify Response Body Property {string} Should Be {string}',
  (propertyPath: string, expectedValue: string) => {
    ApiResponseHelper.verifyResponseBodyPropertyShouldBe(
      propertyPath,
      expectedValue,
    );
  },
);

Then(
  'User Verify Response Header {string} Should Be Present',
  (headerName: string) => {
    ApiResponseHelper.verifyResponseHeaderShouldBePresent(headerName);
  },
);

Then(
  'User Verify Response Header {string} Should Contain {string}',
  (headerName: string, expectedValue: string) => {
    ApiResponseHelper.verifyResponseHeaderShouldContain(
      headerName,
      expectedValue,
    );
  },
);
