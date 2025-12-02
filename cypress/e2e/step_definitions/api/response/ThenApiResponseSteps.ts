import { DataTable, Then } from '@badeball/cypress-cucumber-preprocessor';

Then(
  'User Verify Response Status Code Should Be {string}',
  (expectedStatusCode: string) => {
    const expectedStatus = Number.parseInt(expectedStatusCode, 10);
    cy.log(`Verifying that the response status code is: ${expectedStatus}`);
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }
      expect(apiResponse.status).to.eq(expectedStatus);
    });
  },
);

Then('User Verify Response Body Should Have:', (dataTable: DataTable) => {
  cy.get('@lastApiResponse').then((response) => {
    const apiResponse = response as unknown as Cypress.Response<unknown>;
    if (!apiResponse) {
      throw new Error('No API response found to verify.');
    }
    const body = apiResponse.body as Record<string, unknown>;
    for (const [header, value] of dataTable.raw()) {
      let expected: unknown;
      try {
        expected = JSON.parse(value);
      } catch {
        expected = value;
      }
      const actual = body[header];
      cy.log(
        `Assert: ${header} | Expected: ${JSON.stringify(expected)} | Actual: ${JSON.stringify(actual)}`,
      );
      if (Array.isArray(expected)) {
        if (Array.isArray(actual)) {
          for (const item of expected) {
            expect(actual).to.deep.include(item);
          }
        } else {
          throw new TypeError(
            `Expected an array for property ${header}, but got ${typeof actual}`,
          );
        }
      } else if (typeof expected === 'object') {
        expect(actual).to.deep.equal(expected);
      } else {
        expect(body).to.have.property(header, expected);
      }
    }
  });
});
