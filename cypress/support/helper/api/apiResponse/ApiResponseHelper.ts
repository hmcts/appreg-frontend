/// <reference types="cypress" />

import { TestDataGenerator } from '../../../utils/TestDataGenerator';

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

      // Process each row sequentially
      for (const [header, value] of rows) {
        ApiResponseHelper.resolveExpectedValue(value).then((expected) => {
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
        });
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

      ApiResponseHelper.resolveExpectedValue(expectedValue).then((expected) => {
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
    });
  }

  static verifyResponseHeaderShouldBePresent(headerName: string): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }

      const headerValue = apiResponse.headers[headerName.toLowerCase()];
      cy.log(
        `Verifying response header "${headerName}" is present: ${JSON.stringify(
          headerValue,
        )}`,
      );
      expect(headerValue).to.not.equal(undefined);
      expect(String(headerValue)).to.not.equal('');
    });
  }

  static verifyResponseHeaderShouldContain(
    headerName: string,
    expectedValue: string,
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }

      const headerValue = apiResponse.headers[headerName.toLowerCase()];
      if (!headerValue) {
        throw new Error(`Response header "${headerName}" not found.`);
      }

      ApiResponseHelper.resolveExpectedValue(expectedValue).then((expected) => {
        cy.log(
          `Verifying response header "${headerName}" contains ${JSON.stringify(
            expected,
          )}: ${JSON.stringify(headerValue)}`,
        );
        expect(String(headerValue)).to.contain(String(expected));
      });
    });
  }

  static verifyResponseBodyArrayPropertyFieldShouldContainValues(
    arrayPropertyPath: string,
    fieldPath: string,
    expectedValues: string[],
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }

      const body = apiResponse.body as Record<string, unknown>;
      const current = ApiResponseHelper.resolvePath(body, arrayPropertyPath);

      if (!Array.isArray(current)) {
        throw new TypeError(
          `Expected an array for property ${arrayPropertyPath}, but got ${typeof current}`,
        );
      }

      const actualValues = current.map((item, index) => {
        if (!item || typeof item !== 'object') {
          throw new TypeError(
            `Expected array element ${index} in ${arrayPropertyPath} to be an object.`,
          );
        }
        return ApiResponseHelper.resolvePath(
          item as Record<string, unknown>,
          fieldPath,
        );
      });

      for (const expectedValue of expectedValues) {
        ApiResponseHelper.resolveExpectedValue(expectedValue).then(
          (expected) => {
            cy.log(
              `Assert array field: ${arrayPropertyPath}.${fieldPath} contains ${JSON.stringify(expected)} | Actual: ${JSON.stringify(actualValues)}`,
            );
            expect(actualValues).to.include(expected);
          },
        );
      }
    });
  }

  static verifyResponseBodyArrayPropertyShouldContainValues(
    arrayPropertyPath: string,
    expectedValues: string[],
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }

      const body = apiResponse.body as Record<string, unknown>;
      const current = ApiResponseHelper.resolvePath(body, arrayPropertyPath);

      if (!Array.isArray(current)) {
        throw new TypeError(
          `Expected an array for property ${arrayPropertyPath}, but got ${typeof current}`,
        );
      }

      for (const expectedValue of expectedValues) {
        ApiResponseHelper.resolveExpectedValue(expectedValue).then(
          (expected) => {
            cy.log(
              `Assert array: ${arrayPropertyPath} contains ${JSON.stringify(expected)} | Actual: ${JSON.stringify(current)}`,
            );
            expect(current).to.include(expected);
          },
        );
      }
    });
  }

  static verifyResponseBodyArrayPropertyShouldContainObjects(
    arrayPropertyPath: string,
    expectedObjects: Record<string, string>[],
  ): void {
    cy.get('@lastApiResponse').then((response) => {
      const apiResponse = response as unknown as Cypress.Response<unknown>;
      if (!apiResponse) {
        throw new Error('No API response found to verify.');
      }

      const body = apiResponse.body as Record<string, unknown>;
      const current = ApiResponseHelper.resolvePath(body, arrayPropertyPath);

      if (!Array.isArray(current)) {
        throw new TypeError(
          `Expected an array for property ${arrayPropertyPath}, but got ${typeof current}`,
        );
      }

      const verifyExpectedObject = (index: number): void => {
        if (index >= expectedObjects.length) {
          return;
        }

        const expectedObject = expectedObjects[index];
        const populatedEntries = Object.entries(expectedObject).filter(
          ([, value]) => value.trim() !== '',
        );
        let resolvedObjectChain: Cypress.Chainable<Record<string, unknown>> =
          cy.wrap({}, { log: false });

        for (const [key, value] of populatedEntries) {
          resolvedObjectChain = resolvedObjectChain.then((resolvedObject) =>
            ApiResponseHelper.resolveExpectedValue(value).then(
              (resolvedValue) => {
                resolvedObject[key] = resolvedValue;
                return resolvedObject;
              },
            ),
          );
        }

        resolvedObjectChain.then((resolvedExpectedObject) => {
          const hasMatch = current.some((candidate: unknown) => {
            if (!candidate || typeof candidate !== 'object') {
              return false;
            }

            const candidateObject = candidate as Record<string, unknown>;
            return Object.entries(resolvedExpectedObject).every(
              ([key, expectedValue]) =>
                Cypress._.isEqual(candidateObject[key], expectedValue),
            );
          });

          cy.log(
            `Assert array: ${arrayPropertyPath} contains object ${JSON.stringify(resolvedExpectedObject)} | Actual: ${JSON.stringify(current)}`,
          );
          expect(
            hasMatch,
            `${arrayPropertyPath} should contain an object matching ${JSON.stringify(resolvedExpectedObject)}`,
          ).to.equal(true);

          verifyExpectedObject(index + 1);
        });
      };

      verifyExpectedObject(0);
    });
  }

  /**
   * Resolves expected values by handling aliases and dynamic placeholders
   * @param value Expected value (can contain :alias references or {RANDOM})
   * @returns Chainable with resolved value
   */
  private static resolveExpectedValue(
    value: string,
  ): Cypress.Chainable<unknown> {
    // Check if the value is an alias reference (starts with :)
    if (value.startsWith(':')) {
      const aliasName = value.substring(1);
      return cy.get(`@${aliasName}`).then((aliasValue) => {
        // Try to parse the alias value as JSON if possible
        if (typeof aliasValue === 'string') {
          try {
            return JSON.parse(aliasValue) as unknown;
          } catch {
            return aliasValue as unknown;
          }
        }
        return aliasValue as unknown;
      });
    }

    // Process dynamic values like {RANDOM}, date/time keywords, etc.
    const processedValue = TestDataGenerator.parseValue(value);

    // Try to parse as JSON after processing dynamic values
    try {
      return cy.wrap(JSON.parse(processedValue) as unknown);
    } catch {
      return cy.wrap(processedValue as unknown);
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
