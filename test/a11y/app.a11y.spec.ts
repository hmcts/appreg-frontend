import pa11y from 'pa11y';

import { startStaticSpaServer } from './a11y.server';

const hide = '.govuk-footer__licence-logo, .govuk-header__logotype-crown';

let baseUrl: string;
let server: import('node:http').Server;

jest.setTimeout(120000);

beforeAll(async () => {
  const started = await startStaticSpaServer();
  baseUrl = started.baseUrl;
  server = started.server;
});

afterAll(async () => {
  await new Promise<void>((resolve, reject) =>
    server.close((err) => (err ? reject(err) : resolve())),
  );
});

function runPa11y(p: string) {
  return pa11y(`${baseUrl}${p}`, {
    hideElements: hide,
    timeout: 60000,
    wait: 500,
  });
}

function assertNoErrors(issues: Awaited<ReturnType<typeof pa11y>>['issues']) {
  const errors = issues.filter((i) => i.type === 'error');
  if (errors.length) {
    throw new Error(
      `Accessibility errors:\n${JSON.stringify(errors, null, 2)}`,
    );
  }
}

function testAccessibility(p: string): void {
  describe(`Page ${p}`, () => {
    test('has no accessibility errors', async () => {
      const result = await runPa11y(p);
      expect(Array.isArray(result.issues)).toBe(true);
      assertNoErrors(result.issues);
    });
  });
}

describe('Accessibility', () => {
  const routes = [
    '/login',
    '/forbidden',
    '/internal-error',
    '/page-not-found',
    '/applications-list',
    '/applications-list/1',
    '/applications-list/1/create',
    '/applications-list/1/update',
    '/applications-list/1/delete',
    '/applications-list/1/update/change-payment-reference',
    '/applications-list/1/create/change-payment-reference',
    '/applications-list/1/bulk-upload',
    '/applications-list/1/result-selected',
    '/applications-list/create',
  ];

  routes.forEach((route) => {
    testAccessibility(route);
  });
});
