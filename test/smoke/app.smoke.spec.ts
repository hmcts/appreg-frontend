import fetch from 'cross-fetch';

const TEST_URL = process.env['TEST_URL'] || 'http://localhost:4000';

function expectHtmlShell(html: string): void {
  // SSR markers
  if (html.includes('<app-header') || html.includes('<app-footer')) {
    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
    expect(html).toMatch(/<main[^>]*id="main-content"/);
    return;
  }

  // CSR shell markers (dev server / non-SSR hosting)
  expect(html).toMatch(/<app-root[^>]*>/i);
  // allow either Vite dev or built bundle references
  expect(html).toMatch(/\/@vite\/client|main\.js|polyfills\.js/i);
}

describe('Smoke Test', () => {
  it('serves HTML for home and login', async () => {
    const resHome = await fetch(`${TEST_URL}/`, {
      headers: { Accept: 'text/html' },
    });
    expect(resHome.status).toBe(200);
    expectHtmlShell(await resHome.text());

    const resLogin = await fetch(`${TEST_URL}/login`, {
      headers: { Accept: 'text/html' },
    });
    expect(resLogin.status).toBe(200);
    expectHtmlShell(await resLogin.text());
  });
});
