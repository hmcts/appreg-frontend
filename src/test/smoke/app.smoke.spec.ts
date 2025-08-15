import fetch from 'cross-fetch';

const BASE_URL = process.env['TEST_URL'] ?? 'http://localhost:4000';

async function waitForServer(url: string, timeoutMs = 30000, intervalMs = 500) {
  const start = Date.now();
  let lastErr: unknown = undefined;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        return res;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `Server at ${url} not reachable after ${timeoutMs}ms. Last error: ${String(lastErr)}`,
  );
}

describe('Smoke Test', () => {
  it('Home page loads', async () => {
    const res = await waitForServer(BASE_URL);
    expect(res.status).toBe(200);

    const html = await res.text();

    expect(html).toMatch(/<main[^>]*id="main-content"/);
    expect(html).toMatch(/<h1[^>]*>Default page template<\/h1>/);
    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
  });
});
