import * as applicationinsights from 'applicationinsights';
import type { TelemetryClient } from 'applicationinsights';
import config from 'config';

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
      .setAutoCollectRequests(false)
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
