/// <reference types="cypress" />

export class ApiResponseHelper {
  static verifyStatusCode(expectedStatusCode: string | number): void {
    const expectedStatus =
      typeof expectedStatusCode === 'string'
        ? Number.parseInt(expectedStatusCode, 10)
        : expectedStatusCode;
    cy.log(`Verifying that the response status code is: ${expectedStatus}`);
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }
      expect(apiResponse.status).to.eq(expectedStatus);
    });
  }

  static storeResponseBodyProperty(
    propertyPath: string,
    aliasName: string,
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to store a property from.');
      }
      const body = apiResponse.body as Record<string, unknown>;
      const current = ApiResponseHelper.resolvePath(body, propertyPath);
      cy.log(
        `Storing response property "${propertyPath}" as alias "${aliasName}".`,
      );
      cy.wrap(current).as(aliasName);
    });
  }

  static verifyResponseBodyShouldHave(rows: [string, string][]): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }
      const body = apiResponse.body as Record<string, unknown>;
      for (const [header, value] of rows) {
        const expected = ApiResponseHelper.parseExpectedValue(value);
        const actual = ApiResponseHelper.resolvePath(body, header);
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
        } else if (expected !== null && typeof expected === 'object') {
          expect(actual).to.deep.equal(expected);
        } else {
          expect(actual).to.equal(expected);
        }
      }
    });
  }

  static verifyResponseBodyPropertyShouldBe(
    propertyPath: string,
    expectedValue: string,
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }
      const body = apiResponse.body as Record<string, unknown>;
      const current = ApiResponseHelper.resolvePath(body, propertyPath);
      const expected = ApiResponseHelper.parseExpectedValue(expectedValue);

      cy.log(
        `Verifying response property "${propertyPath}": Expected = ${JSON.stringify(
          expected,
        )}, Actual = ${JSON.stringify(current)}`,
      );

      if (Array.isArray(expected)) {
        if (Array.isArray(current)) {
          for (const item of expected) {
            expect(current).to.deep.include(item);
          }
        } else {
          throw new TypeError(
            `Expected an array for property ${propertyPath}, but got ${typeof current}`,
          );
        }
      } else if (expected !== null && typeof expected === 'object') {
        expect(current).to.deep.equal(expected);
      } else {
        expect(current).to.equal(expected);
      }
    });
  }

  private static parseExpectedValue(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  private static resolvePath(
    body: Record<string, unknown>,
    propertyPath: string,
  ): unknown {
    const pathSegments = ApiResponseHelper.parsePath(propertyPath);
    let current: unknown = body;

    for (const segment of pathSegments) {
      if (
        current &&
        typeof current === 'object' &&
        Object.hasOwn(current, segment)
      ) {
        current = (current as Record<string, unknown>)[segment];
      } else {
        throw new Error(
          `Property path "${propertyPath}" not found in response body.`,
        );
      }
    }

    return current;
  }

  private static parsePath(propertyPath: string): string[] {
    return propertyPath
      .replace(/\[(\d+)\]/g, '.$1')
      .split('.')
      .filter(Boolean);
  }
}
