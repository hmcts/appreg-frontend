<<<<<<< HEAD
import pa11y from "pa11y";
import fetch from "cross-fetch";

const BASE_URL = process.env["BASE_URL"] || "http://localhost:4000";
const hide = ".govuk-footer__licence-logo, .govuk-header__logotype-crown";

type Pa11yResult = Awaited<ReturnType<typeof pa11y>>;
type Pa11yIssue = Pa11yResult["issues"][number];

async function ensurePageLoads(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: "manual" });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      `Unexpected redirect on ${path} → ${res.headers.get("location")}`,
=======
import pa11y from 'pa11y';
import fetch from 'cross-fetch';

const BASE_URL = process.env['BASE_URL'] || 'http://localhost:4000';
const hide = '.govuk-footer__licence-logo, .govuk-header__logotype-crown';

type Pa11yResult = Awaited<ReturnType<typeof pa11y>>;
type Pa11yIssue = Pa11yResult['issues'][number];

async function ensurePageLoads(path: string): Promise<void> {
  const res = await fetch(`${BASE_URL}${path}`, { redirect: 'manual' });
  if (res.status >= 300 && res.status < 400) {
    throw new Error(
      `Unexpected redirect on ${path} → ${res.headers.get('location')}`,
>>>>>>> 38048e2 (Rebasing Code)
    );
  }
  if (res.status >= 500) {
    throw new Error(`Server error (${res.status}) on ${path}`);
  }
}

function runPa11y(path: string): Promise<Pa11yResult> {
  return pa11y(`${BASE_URL}${path}`, { hideElements: hide });
}

function assertNoErrors(issues: Pa11yIssue[]): void {
<<<<<<< HEAD
  const errors = issues.filter((i: Pa11yIssue) => i.type === "error");
=======
  const errors = issues.filter((i: Pa11yIssue) => i.type === 'error');
>>>>>>> 38048e2 (Rebasing Code)
  if (errors.length > 0) {
    throw new Error(
      `Accessibility errors:\n${JSON.stringify(errors, null, 2)}`,
    );
  }
}

function testAccessibility(path: string): void {
  describe(`Page ${path}`, () => {
<<<<<<< HEAD
    test("should have no accessibility errors", async () => {
=======
    test('should have no accessibility errors', async () => {
>>>>>>> 38048e2 (Rebasing Code)
      await ensurePageLoads(path);
      const result = await runPa11y(path);
      expect(Array.isArray(result.issues)).toBe(true);
      assertNoErrors(result.issues);
    });
  });
}

<<<<<<< HEAD
describe("Accessibility", () => {
  testAccessibility("/");
=======
describe('Accessibility', () => {
  testAccessibility('/');
>>>>>>> 38048e2 (Rebasing Code)
});
