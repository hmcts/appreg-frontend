import type { Server } from 'node:http';

import { type Browser, launch } from 'puppeteer';

import {
  assertNoBrowserFailures,
  openScenario,
  preparePage,
} from './a11y.browser';
import { fixtures } from './a11y.fixtures';
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

// Native implicit submission requires a real browser; dispatchEvent in jsdom cannot reproduce it.
test.each(['Create entry', 'Edit entry'])(
  '%s: Enter searches without submitting the entry',
  async (name) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    const scenario = scenarios.find((item) => item.name === name)!;
    try {
      const failures = await preparePage(page, scenario);
      await openScenario(page, baseUrl, scenario);
      assertNoBrowserFailures(failures);
      const searchRoot = 'app-application-code-search';
      await page.evaluate(() => {
        const toggle = Array.from(
          document.querySelectorAll<HTMLButtonElement>(
            '.govuk-accordion__section-button',
          ),
        ).find((button) => button.textContent?.includes('Application code'));
        if (toggle?.getAttribute('aria-expanded') === 'false') {
          toggle.click();
        }
      });
      await page.waitForSelector(`${searchRoot} #applicationCode`, {
        visible: true,
      });
      await page.click(`${searchRoot} #applicationCode`, { clickCount: 3 });
      await page.type(`${searchRoot} #applicationCode`, 'TEST');

      const submissions = await page.evaluateHandle(() => {
        const form = document
          .querySelector('app-application-code-search')
          ?.closest('form');
        if (!form) {
          throw new Error('Expected the entry form around the code search');
        }
        const events = { submits: 0, primaryClicks: 0 };
        form.addEventListener('submit', () => events.submits++, true);
        const primary = form.querySelector(
          ':scope > .govuk-button-group button[type="submit"]',
        );
        if (!primary) {
          throw new Error('Expected the entry submit button');
        }
        primary.addEventListener('click', () => events.primaryClicks++, true);
        return events;
      });
      const fields = ['#applicationCode', '#app-code-title'];
      if (name === 'Create entry') {
        fields.push(
          '#lodgement-date-day',
          '#lodgement-date-month',
          '#lodgement-date-year',
        );
      }
      let searches = 0;
      page.on('request', (request) => {
        if (new URL(request.url()).pathname === '/application-codes') {
          searches++;
        }
      });
      for (const field of fields) {
        await page.focus(`${searchRoot} ${field}`);
        const response = page
          .waitForResponse(
            (result) => new URL(result.url()).pathname === '/application-codes',
          )
          .catch(() => null);
        await page.keyboard.press('Enter');
        await page.waitForNetworkIdle();
        expect(await submissions.jsonValue()).toEqual({
          submits: 0,
          primaryClicks: 0,
        });
        expect(await response).not.toBeNull();
        await page.waitForSelector('#codes-table tbody tr', { visible: true });
        expect(await submissions.jsonValue()).toEqual({
          submits: 0,
          primaryClicks: 0,
        });
      }
      expect(searches).toBe(fields.length);

      // The dedicated buttons retain their own native Enter behaviour.
      await page.focus(`${searchRoot} > fieldset > .govuk-button-group button`);
      const response = page
        .waitForResponse(
          (result) => new URL(result.url()).pathname === '/application-codes',
        )
        .catch(() => null);
      await page.keyboard.press('Enter');
      await response;
      await page.waitForNetworkIdle();
      expect(searches).toBe(fields.length + 1);
      await page.focus(
        `${searchRoot} > fieldset > .govuk-button-group button.govuk-button--secondary`,
      );
      await page.keyboard.press('Enter');
      await page.waitForFunction(
        () =>
          (document.querySelector('#applicationCode') as HTMLInputElement)
            ?.value === '',
      );
      expect(await submissions.jsonValue()).toEqual({
        submits: 0,
        primaryClicks: 0,
      });
      expect(new URL(page.url()).pathname).toBe(scenario.path);
      // Enter on the entry's own submit button must still run its validation.
      await page.$eval(searchRoot, (element) => {
        element
          .closest('form')
          ?.querySelector<HTMLButtonElement>(
            ':scope > .govuk-button-group button[type="submit"]',
          )
          ?.focus();
      });
      await page.keyboard.press('Enter');
      await page.waitForSelector('.govuk-error-summary', { visible: true });
      expect((await submissions.jsonValue()).primaryClicks).toBe(1);
      assertNoBrowserFailures(failures);
    } finally {
      await context.close();
    }
  },
);

test('Edit entry: Enter applies wording without submitting the entry', async () => {
  const context = await browser.createBrowserContext();
  const page = await context.newPage();
  page.setDefaultTimeout(10_000);
  const scenario = {
    ...scenarios.find((item) => item.name === 'Edit entry')!,
    responses: {
      '/application-codes/by-id/100': {
        status: 200,
        body: {
          ...(fixtures['/application-codes/by-id/100'] as Record<
            string,
            unknown
          >),
          wording: {
            template: 'Test {{KeyboardValue}}',
            'substitution-key-constraints': [
              { key: 'KeyboardValue', value: '', constraint: { length: 50 } },
            ],
          },
        },
      },
    },
  };
  try {
    const failures = await preparePage(page, scenario);
    await openScenario(page, baseUrl, scenario);
    await page.evaluate(() => {
      const toggle = Array.from(
        document.querySelectorAll<HTMLButtonElement>(
          '.govuk-accordion__section-button',
        ),
      ).find((button) => button.textContent?.includes('Wording'));
      if (toggle?.getAttribute('aria-expanded') === 'false') {
        toggle.click();
      }
    });
    await page.waitForSelector('#KeyboardValue', { visible: true });
    const submissions = await page.evaluateHandle(() => {
      const form = document.querySelector(
        'app-applications-list-entry-detail > form',
      );
      const button = form?.querySelector(
        ':scope > .govuk-button-group button[type="submit"]',
      );
      if (!form || !button) {
        throw new Error('Expected the entry form and save button');
      }
      const counts = { submits: 0, primaryClicks: 0 };
      form.addEventListener('submit', () => counts.submits++);
      button.addEventListener('click', () => counts.primaryClicks++);
      return counts;
    });
    await page.type('#KeyboardValue', 'Test value');
    await page.keyboard.press('Enter');
    await page.waitForSelector('#wording-local-banner', { visible: true });
    expect(await submissions.jsonValue()).toEqual({
      submits: 0,
      primaryClicks: 0,
    });
    expect(new URL(page.url()).pathname).toBe(scenario.path);
    assertNoBrowserFailures(failures);
  } finally {
    await context.close();
  }
});
