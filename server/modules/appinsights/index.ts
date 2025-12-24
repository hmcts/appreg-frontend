import { createRequire } from 'node:module';

import type { TelemetryClient } from 'applicationinsights';
import config from 'config';

const require = createRequire(import.meta.url);
const applicationinsights =
  require('applicationinsights') as typeof import('applicationinsights');

/**
 * AppInsights — singleton-style initializer + accessors.
 */
export class AppInsights {
  private static started = false;

  /** Initialise once (idempotent). */
  static enable(): void {
    if (this.started) {
      return;
    }

    const connectionString = config.get<string>(
      'secrets.appreg.app-insights-connection-string-fe',
    );

    applicationinsights
      .setup(connectionString)
      .setAutoCollectConsole(true, true)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setSendLiveMetrics(true)
      .start();

    this.started = true;
  }

  /** Access the raw SDK namespace if you need it. */
  static sdk(): typeof applicationinsights {
    return applicationinsights;
  }

  /** Convenience: get the TelemetryClient. */
  static client(): TelemetryClient {
    return applicationinsights.defaultClient;
  }
}
