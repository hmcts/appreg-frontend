import fetch from 'cross-fetch';

const TEST_URL = process.env['TEST_URL'] || 'http://localhost:4000';

function isRedirectHtmlToLogin(html: string): boolean {
  return (
    /http-equiv="refresh"[^>]*url=\/login/i.test(html) ||
    /Redirecting to.*\/login/i.test(html)
  );
}

function expectSpaShell(html: string): void {
  // SSR markers (app.html)
  if (html.includes('<app-header') || html.includes('<app-footer')) {
    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
    expect(html).toMatch(/<main[^>]*id="main-content"/);
    return;
  }

  // CSR shell markers
  expect(html).toMatch(/<app-root[^>]*>/i);
  expect(html).toMatch(
    /\/@vite\/client|<script[^>]+src="[^"]*(main|polyfills)[^"]*\.js"[^>]*>/i,
  );
}

describe('Smoke Test', () => {
  it('home redirects to login and login serves app HTML', async () => {
    // "/" may be a server/meta redirect in CI, or SPA shell in dev
    const resHome = await fetch(`${TEST_URL}/`, {
      headers: { Accept: 'text/html' },
      redirect: 'manual',
    });

    // Some servers respond 3xx; others send meta refresh HTML with 200.
    if (resHome.status >= 300 && resHome.status < 400) {
      const location = resHome.headers.get('location');
      expect(location).not.toBeNull();

      // Accept relative or absolute redirects to /login
      expect(location).toMatch(/\/login$/);
    } else {
      expect(resHome.status).toBe(200);
      const homeHtml = await resHome.text();

      if (isRedirectHtmlToLogin(homeHtml)) {
        // CI behaviour: meta refresh redirect page
        expect(homeHtml).toMatch(/url=\/login/i);
      } else {
        // Dev behaviour: SPA shell
        expectSpaShell(homeHtml);
      }
    }

    // "/login" should serve the real app (SSR or CSR shell)
    const resLogin = await fetch(`${TEST_URL}/login`, {
      headers: { Accept: 'text/html' },
    });

    expect(resLogin.status).toBe(200);
    const loginHtml = await resLogin.text();
    expectSpaShell(loginHtml);
  });
});
