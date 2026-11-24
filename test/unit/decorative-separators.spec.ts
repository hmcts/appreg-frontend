import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

// Check every template, including conditional form sections not rendered on landing pages.
const templates = readdirSync('src/app', { recursive: true })
  .filter((path) => path.endsWith('.html'))
  .map((path) => ({
    path,
    separators:
      readFileSync(join('src/app', path), 'utf8').match(/<hr\b[^>]*>/g) ?? [],
  }))
  .filter(({ separators }) => separators.length > 0);

describe('decorative section breaks (ARCPOC-1989)', () => {
  it('finds section breaks to validate', () => {
    expect(templates.length).toBeGreaterThan(0);
  });

  it.each(templates)(
    '$path hides its decorative separators',
    ({ separators }) => {
      for (const separator of separators) {
        expect(separator).toMatch(/\baria-hidden="true"/);
      }
    },
  );
});
