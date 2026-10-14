import { spawnSync } from 'node:child_process';

describe('Installed HMCTS logger', () => {
  it('creates and reuses named loggers without deprecated APIs and preserves output', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--throw-deprecation',
        '-e',
        `
          const assert = require('node:assert/strict');
          const { createRequire } = require('node:module');
          const { Logger } = require('@hmcts/nodejs-logging');
          const loggingPath = require.resolve('@hmcts/nodejs-logging');
          for (const dependency of ['@hmcts/nodejs-healthcheck', '@hmcts/properties-volume']) {
            const fromDependency = createRequire(require.resolve(dependency));
            assert.equal(fromDependency.resolve('@hmcts/nodejs-logging'), loggingPath);
          }
          const logger = Logger.getLogger('patch-regression');
          assert.equal(Logger.getLogger('patch-regression'), logger);
          const other = Logger.getLogger('patch-regression-other');
          assert.notEqual(other, logger);
          for (const instance of [logger, other]) {
            instance.transports.console.level = 'info';
            instance.transports.console.json = false;
            instance.transports.console.colorize = false;
          }
          logger.debug('filtered-regression-message');
          logger.info('info-regression-message');
          logger.warn('warn-regression-message');
          logger.error('error-regression-message');
          other.info('other-regression-message');
        `,
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 10000 },
    );

    expect(result.error).toBeUndefined();
    expect(result.stderr).not.toContain('DeprecationWarning');
    expect(result.status).toBe(0);
    const output = result.stdout + result.stderr;
    expect(output).toContain('error-regression-message');
    expect(output).toContain('info-regression-message');
    expect(output).toContain('warn-regression-message');
    expect(output).toContain('other-regression-message');
    expect(output).toContain('[patch-regression]');
    expect(output).toContain('[patch-regression-other]');
    expect(output).not.toContain('filtered-regression-message');
  });
});
