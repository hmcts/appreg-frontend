import type { Server } from 'node:http';

import { Browser, Page, launch } from 'puppeteer';

import { fixtures } from './a11y.fixtures';
import { startStaticSpaServer } from './a11y.server';

describe('Date legends and navigation focus in a browser', () => {
  let browser: Browser;
  let page: Page;
  let server: Server;
  let baseUrl: string;

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
    page = await browser.newPage();
    await page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['fetch', 'xhr'].includes(request.resourceType())) {
        void request.respond({
          contentType: 'application/json',
          body: JSON.stringify(fixtures[new URL(request.url()).pathname] ?? {}),
        });
      } else {
        void request.continue();
      }
    });
  });

  afterEach(async () => {
    await page?.close();
  });

  it.each(['/applications', '/reports'])(
    'keeps decorative separators out of the accessibility tree on %s',
    async (path) => {
      await page.goto(`${baseUrl}${path}`);
      await page.waitForSelector('hr.govuk-section-break');
      await page.waitForNetworkIdle();
      expect(
        await page.$$eval('hr', (separators) =>
          separators.every(
            (separator) => separator.getAttribute('aria-hidden') === 'true',
          ),
        ),
      ).toBe(true);
      const session = await page.createCDPSession();
      const { nodes } = await session.send('Accessibility.getFullAXTree');
      expect(
        nodes.filter(
          (node) => !node.ignored && node.role?.value === 'separator',
        ),
      ).toEqual([]);
      await session.detach();
    },
  );

  it('skips navigation with the keyboard on initial load and after SPA navigation', async () => {
    await page.goto(`${baseUrl}/applications`);
    const skipLink = '.govuk-skip-link';
    await page.waitForSelector(`${skipLink}[data-govuk-skip-link-init]`);
    await page.waitForNetworkIdle();

    const skipToMain = async (path: string) => {
      await page.keyboard.press('Tab');
      expect(
        await page.$eval(skipLink, (link) => {
          const rect = link.getBoundingClientRect();
          return {
            focused: document.activeElement === link,
            visible: rect.width > 0 && rect.height > 0 && rect.top >= 0,
            href: link.getAttribute('href'),
          };
        }),
      ).toEqual({ focused: true, visible: true, href: `${path}#main-content` });
      await page.keyboard.press('Enter');
      expect(
        await page.$eval(
          '#main-content',
          (main) => main === document.activeElement,
        ),
      ).toBe(true);
      expect(new URL(page.url()).pathname).toBe(path);
      await page.keyboard.press('Tab');
      expect(
        await page.$eval('#main-content', (main) =>
          main.contains(document.activeElement),
        ),
      ).toBe(true);
    };

    await skipToMain('/applications');
    await page.click('a[routerlink="/reports"]');
    await page.waitForSelector('app-reports');
    await page.waitForNetworkIdle();
    expect(
      await page.evaluate(() => ({
        focused: document.activeElement === document.body,
        tabindex: document.body.getAttribute('tabindex'),
        scrollY: window.scrollY,
      })),
    ).toEqual({ focused: true, tabindex: null, scrollY: 0 });
    await skipToMain('/reports');
    // Skip-link activation adds a fragment history entry before the page entry.
    await page.goBack();
    await page.goBack();
    await page.waitForSelector('app-applications');
    await page.waitForNetworkIdle();
    await skipToMain('/applications');
  });

  it.each([375, 1280])(
    'preserves date label typography and layout at %ipx without a heading',
    async (width) => {
      await page.setViewport({ width, height: 900 });
      await page.goto(`${baseUrl}/applications`);
      await page.waitForSelector('app-date-input legend');
      await page.evaluate(() => document.fonts.ready);

      const appearance = await page.$eval('app-date-input', (input) => {
        const legend = input.querySelector('legend')!;
        const measure = () => {
          const text = legend.firstElementChild ?? legend;
          const style = getComputedStyle(text);
          return {
            fontFamily: style.fontFamily,
            fontSize: style.fontSize,
            fontWeight: style.fontWeight,
            lineHeight: style.lineHeight,
            color: style.color,
            boxes: [
              legend,
              input.querySelector('.govuk-hint')!,
              input.querySelector('.govuk-date-input')!,
            ].map((element) => {
              const { x, y, width, height } = element.getBoundingClientRect();
              return { x, y, width, height };
            }),
          };
        };
        const headings = legend.querySelectorAll(
          'h1, h2, h3, h4, h5, h6, [role="heading"]',
        ).length;
        const current = measure();
        // Reconstruct the previous markup to check visual parity in the same browser.
        const heading = document.createElement('h1');
        heading.className = 'govuk-fieldset__heading';
        heading.textContent = legend.textContent;
        legend.replaceChildren(heading);
        return { headings, current, previous: measure() };
      });

      expect(appearance.headings).toBe(0);
      expect(appearance.current).toEqual(appearance.previous);
    },
  );

  it('gives keyboard-focused sign out the same visible focus styles as navigation links', async () => {
    await page.goto(`${baseUrl}/applications`);
    const signOut = 'form[action="/sso/logout"] button';
    const reports = 'a[routerlink="/reports"]';
    await page.waitForSelector(signOut, { visible: true });
    // Finish startup requests before testing keyboard focus.
    await page.waitForNetworkIdle();
    expect(await page.$('[data-component="error-summary"]')).toBeNull();
    const background = await page.$eval(
      signOut,
      (button) => getComputedStyle(button).backgroundColor,
    );
    expect(background).toBe('rgba(0, 0, 0, 0)');

    const focusStyles = (selector: string) =>
      page.$eval(selector, (element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          boxShadow: style.boxShadow,
          outline: style.outline,
        };
      });
    await page.focus(reports);
    const expected = await focusStyles(reports);
    await page.keyboard.press('Tab');
    expect(
      await page.$eval(signOut, (button) => ({
        signOutFocused: button === document.activeElement,
        activeElement: document.activeElement?.outerHTML,
      })),
    ).toEqual(expect.objectContaining({ signOutFocused: true }));
    expect(expected.background).toBe('rgb(255, 221, 0)');
    expect(expected.boxShadow).not.toBe('none');
    expect(await focusStyles(signOut)).toEqual(expected);
    expect(
      await page.$eval(signOut, (button) => {
        const form = button.form!;
        return {
          method: form.method,
          csrf: !!form.querySelector('input[name="_csrf"]'),
        };
      }),
    ).toEqual({ method: 'post', csrf: true });
  });
});
