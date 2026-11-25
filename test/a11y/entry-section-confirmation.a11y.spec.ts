import type { Server } from 'node:http';

import { type Browser, launch } from 'puppeteer';

import {
  assertNoBrowserFailures,
  openScenario,
  preparePage,
} from './a11y.browser';
import { entry, entryId, listId } from './a11y.fixtures';
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

test.each(['Applicant', 'Officials'])(
  '%s save focuses visible local feedback and keeps subsequent Tab within the section',
  async (heading) => {
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    page.setDefaultTimeout(10_000);
    // A short viewport exercises sections longer than the visible page.
    await page.setViewport({ width: 800, height: 400 });
    const scenario = {
      ...scenarios.find((item) => item.name === 'Edit entry')!,
      responses: {
        [`/application-lists/${listId}/entries/${entryId}`]: {
          status: 200,
          body: entry,
        },
      },
    };
    try {
      const failures = await preparePage(page, scenario);
      await openScenario(page, baseUrl, scenario);
      const section = heading.toLowerCase();
      await page.evaluate((sectionName) => {
        const toggle = document
          .querySelector(`app-${sectionName}-section`)
          ?.closest('.govuk-accordion__section')
          ?.querySelector<HTMLButtonElement>(
            '.govuk-accordion__section-button',
          );
        if (!toggle) {
          throw new Error(`Missing accordion toggle for ${sectionName}`);
        }
        if (toggle.getAttribute('aria-expanded') === 'false') {
          toggle.click();
        }
      }, section);
      const buttonText =
        heading === 'Applicant'
          ? 'Update applicant'
          : 'Save recording officials';
      for (let attempt = 0; attempt < 2; attempt++) {
        await page.evaluate(
          ({ section, buttonText }) => {
            const button = Array.from(
              document.querySelectorAll<HTMLButtonElement>(
                `app-${section}-section button`,
              ),
            ).find((element) => element.textContent?.trim() === buttonText)!;
            button.focus();
          },
          { section, buttonText },
        );
        await page.keyboard.press('Enter');
        const bannerId = `${section}-save-banner`;
        await page.waitForFunction(
          (id) => {
            const banner = document.getElementById(id);
            if (!banner || document.activeElement !== banner) {
              return false;
            }
            const bounds = banner.getBoundingClientRect();
            return bounds.top >= 0 && bounds.bottom <= innerHeight;
          },
          {},
          bannerId,
        );
        expect(await page.$('app-success-banner')).toBeNull();
        expect(await page.$(`#${bannerId} .moj-alert__heading`)).toBeNull();
        await page.keyboard.press('Tab');
        expect(
          await page.evaluate((id) => {
            const panel = document
              .getElementById(id)
              ?.closest('.govuk-accordion__section-content');
            return (
              !!panel &&
              !panel.hasAttribute('hidden') &&
              panel.contains(document.activeElement)
            );
          }, bannerId),
        ).toBe(true);
        await page.keyboard.press('Enter');
        await page.waitForSelector(`#${bannerId}`, { hidden: true });
        expect(
          await page.evaluate(() =>
            document.activeElement?.textContent?.trim(),
          ),
        ).toBe(buttonText);
      }
      assertNoBrowserFailures(failures);
    } finally {
      await context.close();
    }
  },
);
