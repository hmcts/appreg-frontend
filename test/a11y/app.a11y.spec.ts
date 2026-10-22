import type { Server } from 'node:http';

import pa11y from 'pa11y';
import { type Browser, launch } from 'puppeteer';

import {
  assertNoBrowserFailures,
  openScenario,
  preparePage,
} from './a11y.browser';
import { scenarios } from './a11y.scenarios';
import { startStaticSpaServer } from './a11y.server';

let baseUrl: string;
let server: Server;
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

describe('Accessibility', () => {
  test.each(scenarios)('$name', async (scenario) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    try {
      const failures = await preparePage(page, scenario);
      await openScenario(page, baseUrl, scenario);
      assertNoBrowserFailures(failures);
      const result = await pa11y(page.url(), {
        browser,
        page,
        ignoreUrl: true,
        hideElements:
          '.govuk-footer__licence-logo, .govuk-header__logotype-crown',
        timeout: 20_000,
      });
      expect(result.issues.filter((issue) => issue.type === 'error')).toEqual(
        [],
      );
      assertNoBrowserFailures(failures);
    } finally {
      await context.close();
    }
  });
});
