import { readFileSync } from 'node:fs';
import type { Server } from 'node:http';

import { Browser, Page, launch } from 'puppeteer';

import { startStaticSpaServer } from './a11y.server';

describe('Organisation prototype keyboard journey', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let baseUrl: string;
  let writes = 0;
  const listId = '123e4567-e89b-12d3-a456-426655440000';
  const entryId = '123e4567-e89b-12d3-a456-426655440001';
  const productionOrder = JSON.parse(
    readFileSync(
      'wiremock/__files/fixtures/prototypes/production-order-code.json',
      'utf8',
    ),
  );
  const wording = productionOrder.wording;

  beforeAll(async () => {
    ({ server, baseUrl } = await startStaticSpaServer());
    browser = await launch({ headless: true });
    page = await browser.newPage();
    page.setDefaultTimeout(5000);
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (request.resourceType() === 'document') {
        void request.respond({
          contentType: 'text/html',
          body: readFileSync(
            'dist/appreg-frontend/browser/index.csr.html',
            'utf8',
          ),
        });
      } else if (['fetch', 'xhr'].includes(request.resourceType())) {
        const path = new URL(request.url()).pathname;
        if (path.includes('/application-lists') && request.method() !== 'GET') {
          writes++;
        }
        let body: unknown = {};
        if (path.endsWith(`/application-lists/${listId}`)) {
          body = {
            id: listId,
            status: 'OPEN',
            date: '2026-10-22',
            time: '10:00',
          };
        } else if (path.endsWith(`/entries/${entryId}`)) {
          body = {
            id: entryId,
            listId,
            applicationCode: 'SW99032',
            lodgementDate: '2026-10-22',
            wording,
          };
        } else if (path.endsWith('/application-codes')) {
          body = {
            content: [
              { applicationCode: 'SW99032', title: 'Example production order' },
            ],
            totalPages: 1,
          };
        } else if (path.includes('/application-codes/')) {
          body = {
            applicationCode: 'SW99032',
            title: productionOrder.title,
            wording,
            requiresRespondent: true,
          };
        }
        void request.respond({
          contentType: 'application/json',
          body: JSON.stringify(body),
        });
      } else {
        void request.continue();
      }
    });
  });

  afterAll(async () => {
    await page?.close();
    await browser?.close();
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    }
  });

  async function activate(text: string): Promise<void> {
    await page.waitForFunction(
      (label) =>
        Array.from(document.querySelectorAll('button')).some(
          (button) => button.textContent?.trim() === label,
        ),
      {},
      text,
    );
    const handle = await page.evaluateHandle(
      (label) =>
        Array.from(document.querySelectorAll('button')).find(
          (button) => button.textContent?.trim() === label,
        ) ?? null,
      text,
    );
    const button = handle.asElement();
    if (!button) {
      throw new Error(`Button not found: ${text}`);
    }
    await button.focus();
    await page.keyboard.press('Enter');
    await handle.dispose();
  }

  async function expectFocus(selector: string): Promise<void> {
    try {
      await page.waitForFunction(
        (target) => document.activeElement?.matches(target),
        {},
        selector,
      );
    } catch {
      const state = await page.evaluate(() => ({
        active: document.activeElement?.outerHTML,
        heading: document.querySelector('app-organisations-prototype h1')
          ?.textContent,
        fields: Array.from(
          document.querySelectorAll('app-organisations-prototype input'),
        ).map((input) => input.id),
      }));
      throw new Error(
        `Expected focus on ${selector}: ${JSON.stringify(state)}`,
      );
    }
  }

  async function openPanel(accordion: string, index: number): Promise<void> {
    const selector = `button[aria-controls="${accordion}-content-${index}"]`;
    if (
      await page.$eval(
        selector,
        (button) => button.getAttribute('aria-expanded') !== 'true',
      )
    ) {
      await page.click(selector);
    }
  }

  it.each([
    ['create-entry', 'accordion-create'],
    [`update-entry/${entryId}`, 'accordion-update'],
  ])(
    'uses the existing Wording and Respondent sections inside %s',
    async (route, accordion) => {
      writes = 0;
      await page.setViewport({ width: 1280, height: 900 });
      await page.goto(`${baseUrl}/applications-list/${listId}/${route}`);
      await page.waitForSelector(`#${accordion}`);
      await page.waitForNetworkIdle();
      expect(
        await page.$('button[aria-controls="entry-prototype"]'),
      ).toBeNull();
      if (route === 'create-entry') {
        await openPanel(accordion, 2);
        await page.type('#applicationCode', 'SW99032');
        await page.type('#lodgement-date-day', '1');
        await page.type('#lodgement-date-month', '1');
        await page.type('#lodgement-date-year', '2026');
        await activate('Search');
        await page.waitForSelector('#codes-table');
        await activate('Add code');
        await page.waitForNetworkIdle();
      }
      await openPanel(accordion, 3);
      await page.waitForSelector('#No-of-accounts', { visible: true });
      await page.focus('#No-of-accounts');
      await expectFocus('#No-of-accounts');
      await page.$eval('#No-of-accounts', (input) => input.select());
      await page.keyboard.type('2');
      await page.keyboard.press('Tab');
      await openPanel(accordion, 4);
      expect(
        await page.$$('app-multiple-respondents app-organisation-section'),
      ).toHaveLength(1);
      await activate('Add another organisation');
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            'app-multiple-respondents app-organisation-section',
          ).length === 2,
      );
      await openPanel(accordion, 4);
      await page.focus('#respondent-org-name');
      await page.keyboard.type('Example Bank');
      await page.focus('#respondent-org-address-line-1');
      await page.keyboard.type('Example bank address');
      await page.focus('app-multiple-respondents section button');
      await page.keyboard.press('Enter');
      await expectFocus('#respondent-card-0');
      await page.focus('#respondent-extra-1-org-name');
      await page.keyboard.type('Example Network');
      await page.focus('#respondent-extra-1-org-address-line-1');
      await page.keyboard.type('Example address');
      await page.focus('app-multiple-respondents section button');
      await page.keyboard.press('Enter');
      await expectFocus('#respondent-card-1');
      expect(
        await page.$$('app-multiple-respondents .govuk-summary-card'),
      ).toHaveLength(2);
      expect(await page.$$('app-multiple-respondents input')).toHaveLength(0);
      // Change one respondent while the other respondent remains visible as a card.
      await page.focus('#respondent-card-1 .govuk-summary-card__actions a');
      await page.keyboard.press('Enter');
      await expectFocus('#respondent-extra-1-org-name');
      const editActions = await page.$eval(
        'app-multiple-respondents section .govuk-button-group',
        (actions) => actions.textContent,
      );
      expect(editActions).toContain('Cancel changes');
      expect(editActions).not.toContain('Remove');
      expect(editActions).not.toContain('Cancel adding respondent');
      await page.keyboard.type(' updated');
      await page.focus('app-multiple-respondents section button');
      await page.keyboard.press('Enter');
      await expectFocus('#respondent-card-1');
      expect(
        await page.$eval('#respondent-card-0', (card) => card.textContent),
      ).toContain('Example Bank');
      expect(
        await page.$eval('#respondent-card-1', (card) => card.textContent),
      ).toContain('Example Network updated');
      const save =
        route === 'create-entry' ? 'Create entry' : 'Save complete application';
      expect(
        await page.$$eval(
          'button',
          (buttons, label) =>
            buttons.find((button) => button.textContent?.trim() === label)
              ?.disabled,
          save,
        ),
      ).toBe(true);
      await activate('Add another organisation');
      await expectFocus('#respondent-extra-2-org-name');
      expect(await page.$eval('#No-of-accounts', (input) => input.value)).toBe(
        '3',
      );
      // Keep the middle respondent, including its contact fields, when changing the count.
      await openPanel(accordion, 3);
      await page.focus('#No-of-accounts');
      await expectFocus('#No-of-accounts');
      await page.$eval('#No-of-accounts', (input) => input.select());
      await page.keyboard.type('1');
      await page.keyboard.press('Tab');
      await openPanel(accordion, 4);
      expect(
        await page.$('[aria-label="Confirm respondent removal"]'),
      ).toBeNull();
      expect(
        await page.$$('app-multiple-respondents .govuk-summary-card'),
      ).toHaveLength(2);
      expect(
        await page.$$('app-multiple-respondents app-organisation-section'),
      ).toHaveLength(1);
      await page.click(
        '#respondent-card-0 .govuk-summary-card__actions li:last-child a',
      );
      await expectFocus('#remove-respondents-heading');
      await activate('Keep respondent');
      await expectFocus('#respondent-card-0');
      expect(await page.$eval('#No-of-accounts', (input) => input.value)).toBe(
        '3',
      );
      expect(
        await page.$eval('#respondent-card-1', (card) => card.textContent),
      ).toContain('Example address');
      const remove = await page.$(
        '#respondent-card-0 .govuk-summary-card__actions li:last-child a',
      );
      await remove?.focus();
      await page.keyboard.press('Enter');
      await expectFocus('#remove-respondents-heading');
      await activate('Remove respondent');
      await expectFocus('#respondent-card-1');
      expect(await page.$('#respondent-card-0')).toBeNull();
      expect(
        await page.$eval('#respondent-card-1', (card) => card.textContent),
      ).toContain('Example Network updated');
      expect(await page.$eval('#No-of-accounts', (input) => input.value)).toBe(
        '2',
      );
      // Remove a middle editing section while keeping both surrounding respondents.
      expect(
        await page.$eval(
          '[aria-labelledby="multiple-respondent-2"]',
          (section) => section.textContent,
        ),
      ).toContain('Cancel adding respondent');
      await page.type(
        '#respondent-extra-2-org-name',
        'Example middle organisation',
      );
      await activate('Add another organisation');
      await expectFocus('#respondent-extra-3-org-name');
      await page.keyboard.type('Example final organisation');
      await page.click(
        '[aria-labelledby="multiple-respondent-2"] button.govuk-button--secondary',
      );
      await expectFocus('#remove-respondents-heading');
      await activate('Remove respondent');
      await expectFocus('#respondent-card-1');
      expect(
        await page.$('[aria-labelledby="multiple-respondent-2"]'),
      ).toBeNull();
      expect(
        await page.$eval(
          '#respondent-extra-3-org-name',
          (input) => input.value,
        ),
      ).toBe('Example final organisation');
      expect(
        await page.$eval('#respondent-card-1', (card) => card.textContent),
      ).toContain('Example Network updated');
      expect(await page.$eval('#No-of-accounts', (input) => input.value)).toBe(
        '2',
      );
      // Typing, leaving and applying Wording never resize respondent sections.
      await openPanel(accordion, 3);
      await page.focus('#No-of-accounts');
      await page.$eval('#No-of-accounts', (input) => input.select());
      await page.keyboard.type('1');
      expect(
        await page.$('[aria-label="Confirm respondent removal"]'),
      ).toBeNull();
      await page.keyboard.type('2');
      expect(
        await page.$('[aria-label="Confirm respondent removal"]'),
      ).toBeNull();
      expect(
        await page.$$eval(
          'app-multiple-respondents section, app-multiple-respondents .govuk-summary-card',
          (rows) => rows.length,
        ),
      ).toBe(2);
      await page.keyboard.press('Tab');
      await page.waitForFunction(
        () =>
          document.querySelectorAll(
            'app-multiple-respondents section, app-multiple-respondents .govuk-summary-card',
          ).length === 2,
      );
      expect(
        await page.$('[aria-label="Confirm respondent removal"]'),
      ).toBeNull();
      await activate('Apply wording');
      expect(
        await page.$$(
          'app-multiple-respondents section, app-multiple-respondents .govuk-summary-card',
        ),
      ).toHaveLength(2);
      expect(await page.$eval('#No-of-accounts', (input) => input.value)).toBe(
        '12',
      );
      await page.setViewport({ width: 375, height: 812 });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
      expect(writes).toBe(0);
    },
  );

  it('supports wording-driven forms, safe removal and editing by keyboard', async () => {
    await page.goto(`${baseUrl}/prototypes/organisations`);
    await page.waitForSelector('#respondent-1-org-name');
    await page.focus('#respondent-1-org-name');
    await page.keyboard.type('Example Organisation A');
    await page.focus('#account-count');
    await page.$eval('#account-count', (input) => input.select());
    await page.keyboard.type('2');
    expect(await page.$eval('#account-count', (input) => input.value)).toBe(
      '2',
    );
    await activate('Update respondents');
    await expectFocus('#respondent-2-org-name');
    await page.keyboard.type('Example Organisation B');
    await page.focus('#respondent-2-org-address-line-1');
    await page.keyboard.type('Example address B');
    await activate('Add another respondent');
    await expectFocus('#respondent-3-org-name');
    await activate('Continue');
    await expectFocus('.govuk-error-summary');
    await page.focus('.govuk-error-summary a');
    await page.keyboard.press('Enter');
    await expectFocus('#respondent-3-org-name');
    await page.keyboard.type('Example Organisation C');

    // Reducing the wording count never silently discards entered details.
    await page.focus('#account-count');
    await page.$eval('#account-count', (input) => input.select());
    await page.keyboard.type('1');
    await activate('Update respondents');
    await expectFocus('#remove-heading');
    await activate('Keep respondents');
    await expectFocus('#account-count');
    expect(await page.$eval('#account-count', (input) => input.value)).toBe(
      '3',
    );
    expect(
      await page.$eval(
        '#respondent-2-org-address-line-1',
        (input) => input.value,
      ),
    ).toBe('Example address B');

    await page.focus('app-organisations-prototype section button');
    await page.keyboard.press('Enter');
    await expectFocus('#remove-heading');
    await activate('Remove respondents');
    await expectFocus('#respondents-heading');
    expect(
      await page.$$eval('input[id$="-org-name"]', (inputs) =>
        inputs.map((input) => input.value),
      ),
    ).toEqual(['Example Organisation B', 'Example Organisation C']);
    expect(await page.$eval('#account-count', (input) => input.value)).toBe(
      '2',
    );
    await page.setViewport({ width: 375, height: 812 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await activate('Continue');
    await expectFocus('#prototype-heading');
    await page.focus('.govuk-summary-list a');
    await page.keyboard.press('Enter');
    await expectFocus('#respondent-2-org-name');
    await page.keyboard.type(' updated');
    await activate('Continue');
    await page.waitForSelector('.govuk-summary-list');
    expect(
      await page.$eval('.govuk-summary-list', (list) => list.textContent),
    ).toContain('Example Organisation B updated');
    expect(
      await page.$eval('.govuk-summary-list', (list) => list.textContent),
    ).toContain('Example address B');
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page.reload();
    await page.waitForSelector('app-organisations-prototype input');
    expect(await page.$eval('#account-count', (input) => input.value)).toBe(
      '1',
    );
    expect(
      await page.$eval('input[id$="-org-name"]', (input) => input.value),
    ).toBe('');
  });
});
