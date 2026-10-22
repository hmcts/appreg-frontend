import type { Page } from 'puppeteer';

import { entryId, list, listId } from './a11y.fixtures';

export interface Scenario {
  name: string;
  path: string;
  heading: string;
  ready: string;
  state?: Record<string, unknown>;
  responses?: Record<string, { status: number; body: unknown }>;
  exercise?: (page: Page) => Promise<void>;
  error?: string;
}
const root = `/applications-list/${listId}`;
const paymentState = {
  row: {
    rowId: 'test-fee',
    paymentReference: 'TEST',
    paymentStatus: 'Due',
    statusDateRaw: '2026-01-01',
  },
};
export const scenarios: Scenario[] = [
  {
    name: 'Sign in',
    path: '/login',
    heading: 'Sign in',
    ready: 'app-login h1',
  },
  {
    name: 'Forbidden',
    path: '/forbidden',
    heading: 'You do not have permission to access this page',
    ready: '#forbidden-heading',
  },
  {
    name: 'Internal error',
    path: '/internal-error',
    heading: 'There is a problem with the service',
    ready: 'h1[role="alert"]',
  },
  {
    name: 'Not found',
    path: '/page-not-found',
    heading: 'Page not found',
    ready: 'h1[role="alert"]',
  },
  {
    name: 'Application lists',
    path: '/applications-list',
    heading: 'Applications list',
    ready: 'app-applications-list form',
  },
  {
    name: 'List details',
    path: root,
    heading: 'Applications list',
    ready: 'app-application-detail a[href$="/create-entry"]',
  },
  {
    name: 'Create list',
    path: '/applications-list/create',
    heading: 'Create new applications list',
    ready: 'app-applications-list #create',
  },
  {
    name: 'Create entry',
    path: `${root}/create-entry`,
    heading: 'Create new entry',
    ready: 'app-applications-list-entry-create form',
  },
  {
    name: 'Edit entry',
    path: `${root}/update-entry/${entryId}`,
    heading: 'Applications list entry update',
    ready: 'app-applications-list-entry-detail form',
  },
  {
    name: 'Delete list',
    path: `${root}/delete`,
    heading: 'Are you sure you want to delete this application list?',
    ready: 'app-review-confirm button',
    state: { listRow: list },
  },
  ...['create-entry', `update-entry/${entryId}`].map((segment) => ({
    name: `Payment reference (${segment})`,
    path: `${root}/${segment}/change-payment-reference`,
    heading: 'Change payment reference',
    ready: '#paymentReference',
    state: paymentState,
  })),
  {
    name: 'Bulk upload',
    path: `${root}/bulk-upload`,
    heading: 'Bulk upload applications',
    ready: '#file-upload-1',
  },
  {
    name: 'Result selected',
    path: `${root}/result-selected`,
    heading: 'Result applications',
    ready: 'app-result-selected table',
    state: {
      resultingApplications: [
        {
          id: entryId,
          sequenceNumber: '1',
          applicant: 'Synthetic organisation',
          respondent: '',
          title: 'Test application',
        },
      ],
    },
  },
  {
    name: 'Reports',
    path: '/reports',
    heading: 'Reports',
    ready: '#report-duration',
  },
];
for (const [name, button] of [
  ['Create list', 'app-applications-list #create'],
  [
    'Create entry',
    'app-applications-list-entry-create > form > .govuk-button-group button[type="submit"]',
  ],
  [
    'Edit entry',
    'app-applications-list-entry-detail > form > .govuk-button-group button[type="submit"]',
  ],
]) {
  const scenario = scenarios.find((item) => item.name === name)!;
  scenarios.push({
    ...scenario,
    name: `${name}: validation errors`,
    exercise: async (page) => {
      await page.click(button);
    },
    error: '.govuk-error-summary',
  });
}
scenarios.push({
  ...scenarios.find((item) => item.name === 'Reports')!,
  name: 'Reports: validation errors',
  exercise: async (page) => {
    await page.click('#report-duration');
    await page.waitForSelector('#list-date-from-day', { visible: true });
    await page.waitForSelector('app-reports > .govuk-button-group button', {
      visible: true,
    });
    await page.click('app-reports > .govuk-button-group button');
  },
  error: '.govuk-error-summary',
});
scenarios.push({
  ...scenarios.find((item) => item.ready === '#paymentReference')!,
  name: 'Payment reference: validation error',
  exercise: async (page) => {
    await page.type('#paymentReference', '1234567890123456');
    await page.click('app-payment-reference-edit button');
  },
  error: '#paymentReference-error',
});
scenarios.push({
  ...scenarios.find((item) => item.name === 'Edit entry')!,
  name: 'Edit entry: load failure',
  responses: {
    [`/application-lists/${listId}/entries/${entryId}`]: {
      status: 500,
      body: { detail: 'Synthetic entry load failure' },
    },
  },
  error: '.govuk-error-summary',
});
