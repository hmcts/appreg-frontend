import fetch from 'cross-fetch';

const TEST_URL = process.env['TEST_URL'] || 'http://localhost:4000';

describe('Smoke Test', () => {
  it('Home page loads', async () => {
    const res = await fetch(`${TEST_URL}/`);
    expect(res.status).toBe(200);

    const html = await res.text();

    expect(html).toMatch(/<main[^>]*id="main-content"/);
    expect(html).toMatch(/<h1[^>]*>Sign in<\/h1>/);
    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
  });
});
