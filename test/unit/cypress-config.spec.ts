import * as fs from 'node:fs';
import * as path from 'node:path';
import { runInNewContext } from 'node:vm';

describe('Cypress deployment data', () => {
  it('generates core upload rows from base data without changing other fixtures', async () => {
    const module = { exports: {} };
    const noop = jest.fn();
    // Exercise the actual configuration without browser plugins or vault access.
    const dependencies: Record<string, unknown> = {
      'node:fs': fs,
      'node:path': path,
      cypress: { defineConfig: (config: unknown) => config },
      '@bahmutov/cypress-esbuild-preprocessor': noop,
      '@badeball/cypress-cucumber-preprocessor': {
        addCucumberPreprocessorPlugin: noop,
      },
      '@badeball/cypress-cucumber-preprocessor/esbuild': {
        createEsbuildPlugin: noop,
      },
      'pdf-parse': {},
      config: { has: () => false },
      '@hmcts/properties-volume': { addFromAzureVault: noop },
    };
    runInNewContext(
      fs.readFileSync(path.resolve('cypress.config.js'), 'utf8'),
      {
        module,
        require: (name: string) => dependencies[name],
        process: { env: {}, stdout: { write: noop }, stderr: { write: noop } },
        __dirname: process.cwd(),
      },
    );
    let buildCsv!: (args: { fileName: string; suffix: string }) => string;
    const config = module.exports as {
      e2e: {
        setupNodeEvents: (
          on: (
            event: string,
            tasks: { buildBulkUploadCsv: typeof buildCsv },
          ) => void,
          config: { env: object },
        ) => Promise<unknown>;
      };
    };
    await config.e2e.setupNodeEvents(
      (event, tasks) => {
        if (event === 'task') {
          buildCsv = tasks.buildBulkUploadCsv;
        }
      },
      { env: {} },
    );

    const coreCsv = buildCsv({
      fileName: 'bulk-upload-entries-fee-not-required.csv',
      suffix: '123456',
    });
    const rows = coreCsv
      .split('\n')
      .slice(1)
      .map((row) => row.split('|'));
    expect(rows.map((row) => row[0])).toEqual(['BGAS', 'Total']);
    expect(rows.map((row) => row[17])).toEqual(['EF99023', 'EF99007']);
    expect(rows.map((row) => row[16])).toEqual(['AC-123456-1', 'AC-123456-2']);
    expect(rows.every((row) => row.length === 20)).toBe(true);
    expect(
      buildCsv({ fileName: 'bulk-upload-entries.csv', suffix: '123456' }),
    ).toContain('BGAS||Greenfield Finance');
    expect(
      buildCsv({
        fileName: 'bulk-upload-entries-fee-required.csv',
        suffix: '123456',
      }),
    ).toContain('|RE99001|');
  });
});
