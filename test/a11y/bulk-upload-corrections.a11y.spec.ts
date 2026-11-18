import type { Server } from 'node:http';

import { type Browser, launch } from 'puppeteer';

import {
  assertNoBrowserFailures,
  openScenario,
  preparePage,
} from './a11y.browser';
import { listId } from './a11y.fixtures';
import { Scenario, scenarios } from './a11y.scenarios';
import { startStaticSpaServer } from './a11y.server';

let server: Server;
let baseUrl: string;
let browser: Browser;

beforeAll(async () => {
  ({ server, baseUrl } = await startStaticSpaServer());
  browser = await launch({ headless: true });
});

afterAll(async () => {
  await browser?.close();
  if (server) {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  }
});

test('corrects a record by keyboard, restores focus and retains corrections across validation attempts', async () => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const jobId = '00000000-0000-4000-8000-000000000001';
  const jobPath = `/jobs/${jobId}`;
  const failure = (rowNumber: number) => ({
    status: 200,
    body: {
      id: jobId,
      type: 'BULK_UPLOAD_ENTRIES',
      status: 'FAILED',
      error_description: JSON.stringify([
        {
          rowNumber,
          location: 'applicationCode',
          message: 'Check the application code',
          errorType: 'DATA_ERROR',
        },
      ]),
    },
  });
  const scenario: Scenario = {
    ...scenarios.find((item) => item.name === 'Bulk upload')!,
    responses: {
      [`/application-lists/${listId}/entries/bulk-import`]: {
        status: 202,
        body: { id: jobId, type: 'BULK_UPLOAD_ENTRIES', status: 'PENDING' },
      },
      [jobPath]: failure(2),
    },
  };
  try {
    const failures = await preparePage(page, scenario);
    await openScenario(page, baseUrl, scenario);
    await page.evaluate(() => {
      // GOV.UK assigns the original input ID to its enhanced Choose file
      // button. Select the native control by type rather than that mutable ID.
      const input = document.querySelector(
        'app-applications-list-bulk-upload input[type="file"]',
      );
      if (!(input instanceof HTMLInputElement)) {
        throw new Error('Expected the native bulk-upload file input');
      }
      const transfer = new DataTransfer();
      transfer.items.add(
        new File(
          [
            'APPLICANT_CODE|APPLICATION_CODE|EXTRA\n0001|BAD|unchanged\n0002|GOOD|retained',
          ],
          'test.csv',
          { type: 'text/csv' },
        ),
      );
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    });
    // The service navigation also has a submit button (Sign out).
    // Scope both readiness and keyboard activation to the upload form.
    const uploadButton =
      'app-applications-list-bulk-upload form button[type="submit"]';
    await page.waitForFunction(
      (selector) => {
        const button = document.querySelector<HTMLButtonElement>(selector);
        return button !== null && !button.disabled;
      },
      {},
      uploadButton,
    );
    await page.focus(uploadButton);
    const [uploadResponse] = await Promise.all([
      page.waitForResponse(
        (response) =>
          response.request().method() === 'POST' &&
          new URL(response.url()).pathname ===
            `/application-lists/${listId}/entries/bulk-import`,
      ),
      page.keyboard.press('Enter'),
    ]);
    expect(uploadResponse.status()).toBe(202);
    expect(new URL(page.url()).pathname).toBe(scenario.path);
    await page.waitForSelector('#edit-csv-row-2');
    await page.focus('#edit-csv-row-2');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#correct-record-heading');
    await page.focus('a[href="#csv-field-1"]');
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.activeElement?.id === 'csv-field-1',
    );
    await page.$eval('#csv-field-1', (element) =>
      (element as HTMLTextAreaElement).select(),
    );
    await page.keyboard.type('FIXED');
    await page.focus('app-bulk-upload-correct-record button[type="submit"]');
    await page.keyboard.press('Enter');
    await page.waitForFunction(
      () => document.activeElement?.id === 'edit-csv-row-2',
    );
    expect(
      await page.$eval('#error-table', (element) => element.textContent),
    ).toContain('Changes saved');

    // Leaving the journey protects saved corrections even though no job is active.
    await page.click('app-breadcrumbs a[href="/applications-list"]');
    await page.waitForSelector('dialog[open]');
    await page.click('dialog[open] button[autofocus]');
    expect(new URL(page.url()).pathname).toBe(scenario.path);

    scenario.responses![jobPath] = failure(3);
    await page.evaluate(() => {
      const button = Array.from(document.querySelectorAll('button')).find(
        (item) => item.textContent?.trim() === 'Upload corrected file',
      );
      button?.click();
    });
    await page.waitForSelector('#edit-csv-row-3');
    expect(await page.$('#edit-csv-row-2')).toBeNull();
    assertNoBrowserFailures(failures);
  } finally {
    await context.close();
  }
});
