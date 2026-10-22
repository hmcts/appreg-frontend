import type { Server } from 'node:http';

import { type Browser, launch } from 'puppeteer';

import {
  assertNoBrowserFailures,
  openScenario,
  preparePage,
} from './a11y.browser';
import { scenarios } from './a11y.scenarios';
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

test('requires a built CSR document', async () => {
  await expect(startStaticSpaServer('/nonexistent-a11y-build')).rejects.toThrow(
    'run yarn build:ssr',
  );
});
test('serves deep links but never rewrites missing assets or JSON requests', async () => {
  const document = await fetch(`${baseUrl}/applications-list/create`, {
    headers: { accept: 'text/html' },
  });
  expect(document.status).toBe(200);
  expect(await document.text()).toContain('<app-root');
  for (const [path, accept] of [
    ['/missing.js', '*/*'],
    ['/application-lists', 'application/json'],
  ]) {
    expect(
      (await fetch(`${baseUrl}${path}`, { headers: { accept } })).status,
    ).toBe(404);
  }
});
test.each([
  'missing document',
  'login redirect',
  'not-found redirect',
  'invalid list ID redirect',
  'missing fixture',
])('rejects %s before scanning', async (failure) => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(failure === 'missing fixture' ? 10_000 : 3_000);
  const scenario = scenarios.find((item) => item.name === 'Reports')!;
  try {
    const configured =
      failure === 'login redirect'
        ? { ...scenario, responses: { '/sso/me': { status: 401, body: {} } } }
        : scenario;
    const failures = await preparePage(page, configured);
    if (failure === 'missing document') {
      await expect(
        openScenario(page, baseUrl, { ...scenario, path: '/missing.html' }),
      ).rejects.toThrow('document unavailable');
    } else if (failure === 'not-found redirect') {
      await expect(
        openScenario(page, baseUrl, { ...scenario, path: '/does-not-exist' }),
      ).rejects.toThrow();
      expect(new URL(page.url()).pathname).toBe('/page-not-found');
    } else if (failure === 'invalid list ID redirect') {
      const detail = scenarios.find((item) => item.name === 'List details')!;
      await expect(
        openScenario(page, baseUrl, {
          ...detail,
          path: '/applications-list/1',
        }),
      ).rejects.toThrow();
      expect(new URL(page.url()).pathname).toBe('/applications-list');
    } else if (failure === 'login redirect') {
      await expect(openScenario(page, baseUrl, configured)).rejects.toThrow();
      expect(new URL(page.url()).pathname).toBe('/login');
    } else {
      await openScenario(page, baseUrl, scenario);
      await page.evaluate(async () => {
        await fetch('/unprepared-fixture');
      });
      expect(() => assertNoBrowserFailures(failures)).toThrow(
        'Unmocked GET /unprepared-fixture',
      );
    }
  } finally {
    await context.close();
  }
});
