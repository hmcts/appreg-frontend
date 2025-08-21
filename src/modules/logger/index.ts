import { type HmctsLogger, Logger } from '@hmcts/nodejs-logging';
import type { TelemetryClient } from 'applicationinsights';

type LevelName = 'debug' | 'info' | 'warn' | 'error';
type LoggerWithLevels = {
  debug?: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const toSeverity = (level: LevelName): 0 | 1 | 2 | 3 =>
  level === 'debug' ? 0 : level === 'info' ? 1 : level === 'warn' ? 2 : 3;

const stringifyArgs = (args: unknown[]): string =>
  args
    .map((a) =>
      a instanceof Error
        ? a.message
        : typeof a === 'string'
          ? a
          : JSON.stringify(a),
    )
    .join(' ');

/**
 * HmctsLoggerBridge — creates an HMCTS logger and mirrors its output to App Insights.
 * Uses a WeakSet to avoid double-wrapping the same logger instance.
 */
export class HmctsLoggerBridge {
  private static wrapped = new WeakSet<LoggerWithLevels>();

  static enable(name: string, client: TelemetryClient): HmctsLogger {
    const base = Logger.getLogger(name) as unknown as LoggerWithLevels;

    if (!this.wrapped.has(base)) {
      (['debug', 'info', 'warn', 'error'] as const).forEach((level) => {
        const original = base[level];
        if (!original) {
          return;
        }

        const wrapped = ((...args: unknown[]) => {
          const err = args.find((a) => a instanceof Error);
          if (err) {
            client.trackException({ exception: err });
          }

          client.trackTrace({
            message: stringifyArgs(args),
            severity: toSeverity(level),
          });

          return original.apply(base as unknown as object, args);
        }) as typeof original;

        base[level] = wrapped;
      });

      this.wrapped.add(base);
    }

    return base as unknown as HmctsLogger;
  }
}
