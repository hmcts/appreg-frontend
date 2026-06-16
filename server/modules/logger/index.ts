import { type HmctsLogger, Logger } from '@hmcts/nodejs-logging';
import type { TelemetryClient, TraceTelemetry } from 'applicationinsights';

type LevelName = 'debug' | 'info' | 'warn' | 'error';
type LoggerWithLevels = {
  debug?: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

const SEVERITY = {
  debug: 'Verbose',
  info: 'Information',
  warn: 'Warning',
  error: 'Error',
} as const satisfies Record<
  LevelName,
  Exclude<TraceTelemetry['severity'], undefined>
>;

const toSeverity = (
  level: LevelName,
): Exclude<TraceTelemetry['severity'], undefined> => SEVERITY[level];

const stringifyArgs = (args: unknown[]): string =>
  args
    .map((a) => {
      let out: string | undefined;
      if (a instanceof Error) {
        out = a.message;
      } else if (typeof a === 'string') {
        out = a;
      } else {
        out = JSON.stringify(a);
      }
      return out;
    })
    .join(' ');

const trackExceptionSafely = (
  client: TelemetryClient | null | undefined,
  exception: Error,
): void => {
  try {
    client?.trackException({ exception });
  } catch {
    // Telemetry must not break SSR route extraction or application logging.
  }
};

const trackTraceSafely = (
  client: TelemetryClient | null | undefined,
  level: LevelName,
  args: unknown[],
): void => {
  try {
    client?.trackTrace({
      message: stringifyArgs(args),
      severity: toSeverity(level),
    });
  } catch {
    // Telemetry must not break SSR route extraction or application logging.
  }
};

/**
 * HmctsLoggerBridge — creates an HMCTS logger and mirrors its output to App Insights.
 * Uses a WeakSet to avoid double-wrapping the same logger instance.
 */
export class HmctsLoggerBridge {
  private static readonly wrapped = new WeakSet<LoggerWithLevels>();
  private static readonly LEVELS = ['debug', 'info', 'warn', 'error'] as const;

  static enable(
    name: string,
    client: TelemetryClient | null | undefined,
  ): HmctsLogger {
    const base = Logger.getLogger(name) as unknown as LoggerWithLevels;

    if (!this.wrapped.has(base)) {
      for (const level of this.LEVELS) {
        const original = base[level];
        if (!original) {
          continue;
        }

        const wrapped: typeof original = ((...args: unknown[]) => {
          const err = args.find((a) => a instanceof Error);
          if (err) {
            trackExceptionSafely(client, err);
          }

          trackTraceSafely(client, level, args);

          return original.apply(base as unknown as object, args);
        }) as typeof original;

        base[level] = wrapped;
      }

      this.wrapped.add(base);
    }

    return base as unknown as HmctsLogger;
  }
}
