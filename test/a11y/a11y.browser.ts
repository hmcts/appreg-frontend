import type { Page } from 'puppeteer';

import { fixtures } from './a11y.fixtures';
import type { Scenario } from './a11y.scenarios';

export async function preparePage(
  page: Page,
  scenario: Scenario,
): Promise<string[]> {
  const failures: string[] = [];
  await page.setCacheEnabled(false);
  page.on('pageerror', () => failures.push('Uncaught application error'));
  page.on('response', (response) => {
    if (
      ['script', 'stylesheet', 'font'].includes(
        response.request().resourceType(),
      ) &&
      !response.ok()
    ) {
      failures.push(
        `Asset HTTP ${response.status()} ${new URL(response.url()).pathname}`,
      );
    }
  });
  page.on('requestfailed', (request) => {
    failures.push(
      `Failed ${request.method()} ${new URL(request.url()).pathname}`,
    );
  });
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    void (async () => {
      const path = new URL(request.url()).pathname;
      if (!['fetch', 'xhr'].includes(request.resourceType())) {
        await request.continue();
        return;
      }
      const override = scenario.responses?.[path];
      const known = request.method() === 'GET' && Object.hasOwn(fixtures, path);
      if (!override && !known) {
        failures.push(`Unmocked ${request.method()} ${path}`);
      }
      await request.respond({
        status: override?.status ?? (known ? 200 : 501),
        contentType: 'application/json',
        body: JSON.stringify(override?.body ?? (known ? fixtures[path] : {})),
      });
    })().catch(() => failures.push('Request interception failed'));
  });
  if (scenario.state) {
    await page.evaluateOnNewDocument(
      (state) => history.replaceState(state, ''),
      scenario.state,
    );
  }
  return failures;
}

export async function assertPageIdentity(
  page: Page,
  scenario: Scenario,
): Promise<void> {
  await page.waitForSelector(scenario.ready, { visible: true });
  await page.waitForFunction(
    (heading) =>
      Array.from(document.querySelectorAll('h1')).some(
        (element) =>
          element.textContent?.trim() === heading &&
          element.getClientRects().length > 0 &&
          getComputedStyle(element).visibility !== 'hidden',
      ),
    {},
    scenario.heading,
  );
  expect(new URL(page.url()).pathname).toBe(scenario.path);
}

export async function openScenario(
  page: Page,
  baseUrl: string,
  scenario: Scenario,
): Promise<void> {
  const response = await page.goto(`${baseUrl}${scenario.path}`);
  if (response?.status() !== 200) {
    throw new Error(
      `Application document unavailable (${response?.status() ?? 'no response'}): ${scenario.name}`,
    );
  }
  await assertPageIdentity(page, scenario);
  await page.waitForNetworkIdle();
  if (scenario.exercise) {
    await scenario.exercise(page);
  }
  if (scenario.error) {
    await page.waitForSelector(scenario.error, { visible: true });
  } else {
    const summaries = await page.$$('.govuk-error-summary');
    for (const summary of summaries) {
      expect(await summary.isVisible()).toBe(false);
    }
  }
  await page.waitForNetworkIdle();
  await assertPageIdentity(page, scenario);
}

export function assertNoBrowserFailures(failures: string[]): void {
  if (failures.length) {
    throw new Error(`Accessibility setup failed:\n${failures.join('\n')}`);
  }
}
