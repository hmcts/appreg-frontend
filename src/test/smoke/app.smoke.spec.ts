<<<<<<< HEAD
import fetch from "cross-fetch";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4000";

describe("Smoke Test", () => {
  it("Home page loads", async () => {
=======
import fetch from 'cross-fetch';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4000';

describe('Smoke Test', () => {
  it('Home page loads', async () => {
>>>>>>> 38048e2 (Rebasing Code)
    const res = await fetch(`${BASE_URL}/`);
    expect(res.status).toBe(200);

    const html = await res.text();
    expect(html).toMatch(/<main[^>]*id="main-content"/);

    expect(html).toMatch(/<h1[^>]*>Default page template<\/h1>/);

<<<<<<< HEAD
    expect(html).toContain("<app-header");
    expect(html).toContain("<app-footer");
=======
    expect(html).toContain('<app-header');
    expect(html).toContain('<app-footer');
>>>>>>> 38048e2 (Rebasing Code)
  });
});
