import * as applicationinsights from 'applicationinsights';
import type { TelemetryClient } from 'applicationinsights';
import config from 'config';

import { toPathnameOnlyUrl } from '../../../src/app/core/util/to-pathname-only-url';

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
      .setAzureMonitorOptions({
        spanProcessors: [queryStringSanitizingSpanProcessor],
      })
      .setAutoCollectRequests(true)
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

type TelemetrySpan = {
  attributes?: Record<string, unknown>;
  kind?: number;
};

// OpenTelemetry uses 1 for incoming server calls and 2 for outgoing client calls.
const SERVER_SPAN_KIND = 1;
const CLIENT_SPAN_KIND = 2;

const queryStringSanitizingSpanProcessor = {
  forceFlush: () => Promise.resolve(),
  // Sanitize on start before live metrics observe the span, and again on end
  // before the batch exporter sends it in case another processor changed it.
  onEnd: sanitizeHttpTelemetrySpan,
  onStart: sanitizeHttpTelemetrySpan,
  shutdown: () => Promise.resolve(),
};

function sanitizeHttpTelemetrySpan(span: TelemetrySpan): void {
  if (span.kind !== SERVER_SPAN_KIND && span.kind !== CLIENT_SPAN_KIND) {
    return;
  }

  const attributes = span.attributes;
  if (!attributes) {
    return;
  }

  const fullUrl = attributes['url.full'] ?? attributes['http.url'];
  if (typeof fullUrl === 'string') {
    const sanitizedUrl = toQueryFreeUrl(fullUrl);
    // Cover both current and legacy OpenTelemetry HTTP attribute names. This
    // changes only the telemetry copy; the real backend request is untouched.
    attributes['url.full'] = sanitizedUrl;
    attributes['http.url'] = sanitizedUrl;
  }

  if (typeof attributes['http.target'] === 'string') {
    attributes['http.target'] = toPathnameOnlyUrl(attributes['http.target']);
  }

  delete attributes['url.query'];
}

function toQueryFreeUrl(url: string): string {
  try {
    const parsedUrl = new URL(url);
    return `${parsedUrl.origin}${parsedUrl.pathname}`;
  } catch {
    return toPathnameOnlyUrl(url);
  }
}
