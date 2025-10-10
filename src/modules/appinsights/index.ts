import { createRequire } from 'node:module';

import type { TelemetryClient } from 'applicationinsights';

const require = createRequire(import.meta.url);
const applicationinsights =
  require('applicationinsights') as typeof import('applicationinsights');

/**
 * AppInsights — singleton-style initializer + accessors.
 */
export class AppInsights {
  private static started = false;

  /** Initialise once (idempotent). Call BEFORE creating any HMCTS loggers. */
  static enable(connectionString: string): void {
    if (this.started) {
      return;
    }

    applicationinsights
      .setup(connectionString)
      .setAutoCollectConsole(true, true)
      .setAutoCollectDependencies(true)
      .setAutoCollectExceptions(true)
      .setSendLiveMetrics(true)
      .start();

    console.log('applicationinsights: ', applicationinsights);

    this.started = true;
  }

  /** Access the raw SDK namespace if you need it. */
  static sdk(): typeof applicationinsights {
    return applicationinsights;
  }

  /** Convenience: get the TelemetryClient. */
  static client(): TelemetryClient {
    console.log('defaultClient: ', applicationinsights.defaultClient);
    return applicationinsights.defaultClient;
  }
}
