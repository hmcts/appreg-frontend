import type { Page } from 'puppeteer';

import { entry, entryId, list, listId } from './a11y.fixtures';

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
    heading: 'Check the application list and entries before deleting',
    ready: 'app-applications-list-delete app-sortable-table tbody tr',
    responses: {
      [`/application-lists/${listId}/entries`]: {
        status: 200,
        body: {
          content: [
            {
              ...entry,
              sequenceNumber: 1,
              applicationTitle: 'Synthetic title ' + 'SYNTHETIC'.repeat(12),
            },
          ],
          pageNumber: 0,
          pageSize: 100,
          totalElements: 1,
          elementsOnPage: 1,
        },
      },
    },
    exercise: async (page) => {
      await page.setViewport({ width: 320, height: 900 });
      expect(
        await page.$eval(
          'app-applications-list-delete tbody tr',
          (row) => row.getBoundingClientRect().height,
        ),
      ).toBeLessThan(300);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBe(320);
    },
    state: {
      listRow: {
        ...list,
        location: list.courtName,
        entries: list.entriesCount,
      },
    },
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
const deleteListScenario = scenarios.find(
  (item) => item.name === 'Delete list',
)!;
const entriesPath = `/application-lists/${listId}/entries`;
scenarios.push(
  {
    ...deleteListScenario,
    name: 'Delete list: empty list',
    ready: 'app-applications-list-delete .govuk-button--warning:not(:disabled)',
    responses: {
      [entriesPath]: {
        status: 200,
        body: {
          content: [],
          pageNumber: 0,
          pageSize: 100,
          totalElements: 0,
          elementsOnPage: 0,
        },
      },
    },
    exercise: async (page) => {
      expect(await page.$('app-applications-list-delete table')).toBeNull();
      expect(
        await page.$eval('[role="status"]', (element) => element.textContent),
      ).toContain('This application list has no entries.');
    },
  },
  {
    ...deleteListScenario,
    name: 'Delete list: entries load failure',
    ready: '#retry-entries',
    responses: {
      [entriesPath]: {
        status: 500,
        body: { detail: 'Synthetic entries load failure' },
      },
    },
    error: '.govuk-error-summary',
    exercise: async (page) => {
      expect(await page.$('app-applications-list-delete table')).toBeNull();
      expect(
        await page.$eval(
          '.govuk-button--warning',
          (element) => (element as HTMLButtonElement).disabled,
        ),
      ).toBe(true);
      await page.focus('.govuk-error-summary a');
      await page.keyboard.press('Enter');
      expect(await page.evaluate(() => document.activeElement?.id)).toBe(
        'retry-entries',
      );
    },
  },
);
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
      await page.waitForSelector(`${button}:not(:disabled)`, { visible: true });
      if (name === 'Edit entry') {
        await page.waitForSelector('#applicant-org-name', { visible: true });
        await page.$eval('#applicant-org-name', (element) => {
          const input = element as HTMLInputElement;
          input.focus();
          input.select();
        });
        await page.keyboard.press('Backspace');
        await page.waitForFunction(() => {
          const input = document.querySelector<HTMLInputElement>(
            '#applicant-org-name',
          );
          return (
            input?.value === '' &&
            input.closest('app-text-input')?.classList.contains('ng-invalid')
          );
        });
      }
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
