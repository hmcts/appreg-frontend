import { access } from 'node:fs/promises';
import pa11y from 'pa11y';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const hide = '.govuk-footer__licence-logo, .govuk-header__logotype-crown';

const DIST_DIR = 'dist/appreg-frontend/browser';

const ROOT = pathToFileURL(path.resolve(DIST_DIR)).href.replace(/\/$/, '');

function resolveFileUrl(p: string): string {
  const rel = p === '/' ? '/index.html' : p.replace(/^\//, '/');
  return `${ROOT}${rel}`;
}

async function ensurePageLoads(p: string): Promise<void> {
  const filePath = fileURLToPath(new URL(resolveFileUrl(p)));
  await access(filePath);
}

function runPa11y(p: string) {
  return pa11y(resolveFileUrl(p), { hideElements: hide });
}

function assertNoErrors(issues: Awaited<ReturnType<typeof pa11y>>['issues']) {
  const errors = issues.filter((i) => i.type === 'error');
  if (errors.length) {
    throw new Error(
      `Accessibility errors:\n${JSON.stringify(errors, null, 2)}`,
    );
  }
}

function testAccessibility(p: string): void {
  describe(`Page ${p}`, () => {
    test('should have no accessibility errors', async () => {
      await ensurePageLoads(p);
      const result = await runPa11y(p);
      expect(Array.isArray(result.issues)).toBe(true);
      assertNoErrors(result.issues);
    });
  });
}

describe('Accessibility', () => {
  testAccessibility('/');
});
