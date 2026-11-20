import type { Server } from 'node:http';

import { Browser, Page, launch } from 'puppeteer';

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
          body: new URL(request.url()).pathname === '/app/config' ? '{}' : '[]',
        });
      } else {
        void request.continue();
      }
    });
  });

  afterEach(async () => {
    await page?.close();
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
      await page.$eval(signOut, (button) => button === document.activeElement),
    ).toBe(true);
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
