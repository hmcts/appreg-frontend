import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';

import { Browser, HTTPRequest, Page, launch } from 'puppeteer';

import { startStaticSpaServer } from './a11y.server';

// Run after yarn build: yarn jest -c jest.a11y.config.js --runInBand --runTestsByPath test/a11y/reports-navigation.a11y.spec.ts
// Native dialog focus/inertness cannot be verified in jsdom.
describe('Report navigation confirmation in a browser', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let baseUrl: string;
  let completed = false;
  let nativeDialogs = 0;

  beforeAll(async () => {
    ({ server, baseUrl } = await startStaticSpaServer());
    browser = await launch({ headless: true });
  });

  afterAll(async () => {
    await browser?.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  });

  beforeEach(async () => {
    completed = false;
    nativeDialogs = 0;
    page = await browser.newPage();
    page.on('dialog', (dialog) => {
      nativeDialogs++;
      void dialog.dismiss();
    });
    page.setDefaultTimeout(5_000);
    await page.setRequestInterception(true);
    const handleRequest = async (request: HTTPRequest): Promise<void> => {
      const path = new URL(request.url()).pathname;
      if (request.resourceType() === 'document') {
        await request.respond({
          contentType: 'text/html',
          body: readFileSync(
            'dist/appreg-frontend/browser/index.csr.html',
            'utf8',
          ),
        });
      } else if (path === '/reports/duration/jobs') {
        await request.respond({
          status: 202,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'report-job', status: 'RECEIVED' }),
        });
      } else if (path === '/jobs/report-job') {
        await request.respond({
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'report-job',
            status: completed ? 'COMPLETED' : 'RUNNING',
          }),
        });
      } else if (path === '/reports/jobs/report-job/download') {
        await request.respond({
          contentType: 'text/csv',
          body: 'Report\nExample\n',
        });
      } else if (['fetch', 'xhr'].includes(request.resourceType())) {
        await request.respond({
          contentType: 'application/json',
          body: path === '/app/config' ? '{}' : '[]',
        });
      } else {
        await request.continue();
      }
    };
    page.on('request', (request) => {
      void handleRequest(request);
    });
    await page.goto(`${baseUrl}/applications`);
    await page.waitForSelector('a[routerlink="/reports"]', { visible: true });
    await page.click('a[routerlink="/reports"]');
    await page.waitForSelector('#report-duration');
    await page.click('#report-duration');
    await page.waitForSelector('#list-date-from-day');
    for (const prefix of ['list-date-from', 'list-date-to']) {
      await page.type(`#${prefix}-day`, '1');
      await page.type(`#${prefix}-month`, '1');
      await page.type(`#${prefix}-year`, '2026');
    }
    await page.click('app-reports > .govuk-button-group button');
    await page.waitForSelector('app-async-job-progress');
  });

  afterEach(async () => {
    await page?.close();
    expect(nativeDialogs).toBe(0);
  });

  async function openDialog(): Promise<void> {
    await page.click('a[routerlink="/applications"]');
    await page.waitForSelector('dialog[open]');
  }

  it('traps focus, restores it on Escape, and only leaves after confirmation', async () => {
    await openDialog();
    expect(
      await page.$eval('dialog', (dialog) => dialog.matches(':modal')),
    ).toBe(true);
    expect(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
    ).toBe('Stay on this page');
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() => document.activeElement?.textContent?.trim()),
    ).toBe('Leave this page');
    await page.keyboard.press('Tab');
    // Browsers may visit browser chrome between the last and first dialog control.
    await page.keyboard.press('Tab');
    expect(
      await page.evaluate(() =>
        document.querySelector('dialog')?.contains(document.activeElement),
      ),
    ).toBe(true);
    await page.keyboard.press('Escape');
    await page.waitForSelector('dialog[open]', { hidden: true });
    expect(new URL(page.url()).pathname).toBe('/reports');
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('routerlink'),
      ),
    ).toBe('/applications');
    await openDialog();
    await page.click('dialog button.govuk-button--secondary');
    await page.waitForFunction(() => location.pathname === '/applications');
  });

  it('supports the header close button by keyboard with a visible focus indicator', async () => {
    await openDialog();
    expect(
      await page.$eval(
        '.dialog-header',
        (header) => getComputedStyle(header).backgroundColor,
      ),
    ).toBe('rgb(11, 12, 12)');
    await page.keyboard.down('Shift');
    await page.keyboard.press('Tab');
    await page.keyboard.up('Shift');
    expect(
      await page.evaluate(() =>
        document.activeElement?.getAttribute('aria-label'),
      ),
    ).toBe('Close dialog');
    expect(
      await page.$eval(
        '.dialog-close',
        (button) => getComputedStyle(button).outlineWidth,
      ),
    ).toBe('3px');
    await page.keyboard.press('Enter');
    await page.waitForSelector('dialog[open]', { hidden: true });
    expect(new URL(page.url()).pathname).toBe('/reports');
  });

  it('protects browser Back within the application history', async () => {
    await page.evaluate(() => history.back());
    await page.waitForSelector('dialog[open]');
    await page.click('dialog button.govuk-button');
    await page.waitForFunction(() => location.pathname === '/reports');
    await page.evaluate(() => history.back());
    await page.waitForSelector('dialog[open]');
    await page.click('dialog button.govuk-button--secondary');
    await page.waitForFunction(() => location.pathname === '/applications');
  });

  it('stays on reports and dismisses stale confirmation when the job finishes', async () => {
    await openDialog();
    completed = true;
    await page.waitForSelector('app-success-banner');
    await page.waitForSelector('dialog[open]', { hidden: true });
    expect(new URL(page.url()).pathname).toBe('/reports');
  });
});
