import fetch from 'cross-fetch';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4000';

describe('Smoke Test', () => {
  it('Home page loads', async () => {
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toMatch(/<main[^>]*id="main-content"/);

    expect(html).toMatch(/<h1[^>]*>Default page template<\/h1>/);

    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
  });
});
