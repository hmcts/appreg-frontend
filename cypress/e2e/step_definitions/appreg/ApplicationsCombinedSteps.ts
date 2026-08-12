import { DataTable, Then, When } from '@badeball/cypress-cucumber-preprocessor';

import { ApiBaseHelper } from '../../../support/helper/api/apiBase/ApiBaseHelper';
import { ApplicationListEntriesCombinedHelper } from '../../../support/helper/appreg/ApplicationsCombinedHelper';

const APPLICATIONS_BULK_ACTION_PREVIEW_ALIAS = 'applicationsBulkActionPreview';

interface PreviewRequestAssertion {
  path: string;
  expected: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.values(value).every((entry) => typeof entry === 'string')
  );
}

function normalizePreviewRequestPath(path: string): string {
  switch (path) {
    case 'selectionType':
      return 'selection.selectionType';
    case 'entryIds':
      return 'selection.entryIds';
    case 'excludedEntryIds':
      return 'selection.excludedEntryIds';
    case 'sort':
      return 'selection.sort';
    default:
      return path.startsWith('filter.') ? `selection.${path}` : path;
  }
}

function expectedArrayValue(path: string, rawValue: string): string[] | null {
  if (
    !path.endsWith('entryIds') &&
    !path.endsWith('excludedEntryIds') &&
    !path.endsWith('sort')
  ) {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (!trimmedValue || trimmedValue === '[]') {
    return [];
  }

  if (path.endsWith('sort')) {
    return [trimmedValue];
  }

  return trimmedValue
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function resolveExpectedValue(
  path: string,
  rawValue: string,
): Cypress.Chainable<unknown> {
  const expectedArray = expectedArrayValue(path, rawValue);

  return ApiBaseHelper.resolveBodyPlaceholders(expectedArray ?? rawValue);
}

function buildPreviewRequestAssertions(
  criteria: Record<string, string>,
): Cypress.Chainable<PreviewRequestAssertion[]> {
  let chain = cy.wrap([] as PreviewRequestAssertion[], { log: false });

  Object.entries(criteria).forEach(([rawPath, rawValue]) => {
    const path = normalizePreviewRequestPath(rawPath);

    chain = chain.then((assertions) =>
      resolveExpectedValue(path, rawValue).then((expected) => [
        ...assertions,
        { path, expected },
      ]),
    );
  });

  return chain;
}

function getPathValue(source: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!isRecord(current)) {
      return undefined;
    }

    return current[key];
  }, source);
}

function assertPreviewRequestValue(
  requestBody: unknown,
  assertion: PreviewRequestAssertion,
): void {
  const actual = getPathValue(requestBody, assertion.path);

  if (Array.isArray(assertion.expected)) {
    expect(actual, assertion.path).to.be.an('array');

    if (assertion.path.endsWith('sort')) {
      expect(actual, assertion.path).to.deep.equal(assertion.expected);
      return;
    }

    expect(actual, assertion.path).to.have.members(assertion.expected);
    return;
  }

  expect(actual, assertion.path).to.equal(assertion.expected);
}

When('User Searches Applications With:', (dataTable: DataTable) => {
  const searchCriteria = dataTable.hashes()[0];
  ApplicationListEntriesCombinedHelper.searchApplicationListEntry({
    criteria: searchCriteria,
  });
});

When('User Starts Listening For Applications Bulk Action Preview', () => {
  cy.intercept('POST', '**/application-list-entries/bulk-action-preview').as(
    APPLICATIONS_BULK_ACTION_PREVIEW_ALIAS,
  );
});

Then(
  'User Verifies Applications Bulk Action Preview Request Has:',
  (dataTable: DataTable) => {
    const processedCriteria = ApiBaseHelper.processDynamicValues(
      dataTable.rowsHash(),
    );

    if (!isStringRecord(processedCriteria)) {
      throw new Error(
        'Applications bulk action preview assertions must be string key/value pairs',
      );
    }

    buildPreviewRequestAssertions(processedCriteria).then((assertions) => {
      cy.wait(`@${APPLICATIONS_BULK_ACTION_PREVIEW_ALIAS}`, {
        timeout: 20000,
      }).then((interception) => {
        assertions.forEach((assertion) => {
          assertPreviewRequestValue(interception.request.body, assertion);
        });
      });
    });
  },
);

When('User Fills In The Applicant Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.fillApplicant({ criteria });
});

When('User Fills In The Respondent Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.fillRespondent({ criteria });
});

When('User Verifies In The Applicant Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.verifyApplicant({ criteria });
});

When('User Verifies In The Respondent Details', (dataTable: DataTable) => {
  const criteria = dataTable.rowsHash();
  ApplicationListEntriesCombinedHelper.verifyRespondent({ criteria });
});
