import { Logger } from '@hmcts/nodejs-logging';
import type { TelemetryClient } from 'applicationinsights';

import { HmctsLoggerBridge } from '../../../../server/modules/logger';

// Mock @hmcts/nodejs-logging
jest.mock('@hmcts/nodejs-logging', () => {
  const store = new Map<string, unknown>();
  return {
    Logger: {
      _getLogger: (name: string) => {
        if (!store.has(name)) {
          store.set(name, {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          });
        }
        return store.get(name);
      },
      get getLogger() {
        return this._getLogger;
      },
      set getLogger(value) {
        this._getLogger = value;
      },
    },
  };
});

// Types-only import after the mock
const newClient = (): TelemetryClient =>
  ({
    trackException: jest.fn(),
    trackTrace: jest.fn(),
  }) as unknown as TelemetryClient;

describe('HmctsLoggerBridge', () => {
  it('wraps base logger once and preserves original calls', () => {
    const name = 'wrap-once';
    const base = Logger.getLogger(name);
    const originalInfo = base.info;

    const client = newClient();
    const trackTrace = jest.spyOn(client as never, 'trackTrace');
    const trackException = jest.spyOn(client as never, 'trackException');

    const logger = HmctsLoggerBridge.enable(name, client);

    const args = ['hello', { a: 1 }];
    logger.info(...args);

    expect(originalInfo).toHaveBeenCalledWith(...args);

    expect(trackTrace).toHaveBeenCalledTimes(1);
    const traceArg = trackTrace.mock.calls[0][0];
    expect(traceArg).toMatchObject({
      message: 'hello {"a":1}',
      severity: 'Information',
    });

    expect(trackException).not.toHaveBeenCalled();
  });

  it('records exception and uses error severity', () => {
    const name = 'err-case';
    const client = newClient();
    const trackTrace = jest.spyOn(client as never, 'trackTrace');
    const trackException = jest.spyOn(client as never, 'trackException');

    const logger = HmctsLoggerBridge.enable(name, client);

    const err = new Error('boom');
    logger.error('failed', err);

    expect(trackException).toHaveBeenCalledTimes(1);
    expect(trackException.mock.calls[0][0]).toEqual({ exception: err });

    expect(trackTrace).toHaveBeenCalledTimes(1);
    expect(trackTrace.mock.calls[0][0]).toMatchObject({
      message: 'failed boom',
      severity: 'Error',
    });
  });

  it('is idempotent: calling enable() twice does not re-wrap', () => {
    const name = 'idempotent';
    const base = Logger.getLogger(name);

    const client = newClient();
    HmctsLoggerBridge.enable(name, client);
    const infoAfterFirst = base.info;

    HmctsLoggerBridge.enable(name, client);
    const infoAfterSecond = base.info;

    expect(infoAfterSecond).toBe(infoAfterFirst);
  });

  it('maps severities correctly for all levels', () => {
    const name = 'all-levels';
    const client = newClient();
    const trackTrace = jest.spyOn(client as never, 'trackTrace');

    const logger = HmctsLoggerBridge.enable(name, client);

    logger.debug?.('d');
    logger.info('i');
    logger.warn('w');
    logger.error('e');

    const severities = trackTrace.mock.calls.map(
      (c) => (c[0] as { severity: string }).severity,
    );
    if (logger.debug) {
      expect(severities[0]).toBe('Verbose');
      expect(severities.slice(1)).toEqual(['Information', 'Warning', 'Error']);
    } else {
      expect(severities).toEqual(['Information', 'Warning', 'Error']);
    }
  });

  it('stringifies non-string args into the message', () => {
    const name = 'stringify';
    const client = newClient();
    const trackTrace = jest.spyOn(client as never, 'trackTrace');

    const logger = HmctsLoggerBridge.enable(name, client);
    logger.info('start', { k: 'v' }, 42, true, null);

    const { message } = trackTrace.mock.calls[0][0];
    expect(message).toBe('start {"k":"v"} 42 true null');
  });
});
