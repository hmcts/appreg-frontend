import type { Server } from 'node:http';

import { Browser, HTTPRequest, Page, launch } from 'puppeteer';

import { startStaticSpaServer } from './a11y.server';

// Run after yarn build; exercises actual keyboard activation and route recreation.
describe('Recent reports in a browser', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let baseUrl: string;
  let listRequests = 0;
  let generationRequests = 0;
  const downloaded: string[] = [];
  const reports = [
    {
      id: 'report-one',
      type: 'FEES_REPORT',
      completedAt: '2026-10-07T12:30:00Z',
    },
    {
      id: 'report-two',
      type: 'FEES_REPORT',
      completedAt: '2026-10-07T11:30:00Z',
    },
  ];

  beforeAll(async () => {
    ({ server, baseUrl } = await startStaticSpaServer());
    browser = await launch({
      headless: true,
      downloadBehavior: { policy: 'deny' },
    });
    page = await browser.newPage();
    // File saving is covered by unit/API tests. Suppress native downloads here to avoid
    // Chrome's pending-download quit dialog while checking keyboard and navigation behaviour.
    await page.evaluateOnNewDocument(() => {
      HTMLAnchorElement.prototype.click = () => undefined;
    });
    page.setDefaultTimeout(5_000);
    await page.setRequestInterception(true);
    const handleRequest = async (request: HTTPRequest): Promise<void> => {
      const path = new URL(request.url()).pathname;
      if (request.method() === 'POST' && path.startsWith('/reports/')) {
        generationRequests++;
      }
      if (path === '/reports/jobs') {
        listRequests++;
        await request.respond({
          contentType: 'application/json',
          body: JSON.stringify(reports),
        });
      } else if (path.endsWith('/download')) {
        downloaded.push(path);
        await request.respond({
          contentType: 'text/csv',
          body: 'Report\nCSV\n',
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
  });

  afterAll(async () => {
    await page?.close();
    await browser?.close();
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
      server.closeAllConnections();
    });
  });

  it('identifies reports, supports keyboard re-download and survives navigation and refresh', async () => {
    await page.goto(`${baseUrl}/applications`);
    await page.waitForSelector('a[routerlink="/reports"]');
    await page.click('a[routerlink="/reports"]');
    const button = '#recent-reports-heading + p + table tbody button';
    await page.waitForSelector(button);
    const names = await page.$$eval(button, (buttons) =>
      buttons.map((b) => b.textContent),
    );
    expect(names[0]).toContain('Fees');
    expect(names[0]).toContain('7 Oct 2026 at 13:30');
    expect(names[1]).toContain('7 Oct 2026 at 12:30');
    await page.focus(button);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() =>
      document
        .querySelector(
          'section[aria-labelledby="recent-reports-heading"] [role="status"]',
        )
        ?.textContent?.includes('has downloaded'),
    );
    expect(downloaded).toEqual(['/reports/jobs/report-one/download']);
    const initialLists = listRequests;
    await page.click('a[routerlink="/applications"]');
    await page.waitForSelector('#recent-reports-heading', { hidden: true });
    await page.click('a[routerlink="/reports"]');
    await page.waitForSelector(button);
    expect(listRequests).toBeGreaterThan(initialLists);
    await page.focus(button);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() =>
      document
        .querySelector(
          'section[aria-labelledby="recent-reports-heading"] [role="status"]',
        )
        ?.textContent?.includes('has downloaded'),
    );
    expect(downloaded).toHaveLength(2);
    await page.reload();
    await page.waitForSelector(button);
    expect(generationRequests).toBe(0);
  });
});
