import { isPlatformBrowser } from '@angular/common';
import { DestroyRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import {
  ApplicationInsights,
  type ITelemetryItem,
} from '@microsoft/applicationinsights-web';
import { filter } from 'rxjs';

import { AppConfigService } from '@services/app-config.service';

export type TelemetryProperties = Record<
  string,
  string | number | boolean | null | undefined
>;

type TraceContextLike = {
  setName: (pageName: string) => void;
  setTraceId: (traceId: string) => void;
  setSpanId: (spanId: string) => void;
};

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  private readonly appConfigService = inject(AppConfigService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);

  private readonly cloudRoleName = 'hmcts applications register - frontend';

  private appInsights?: ApplicationInsights;
  private currentOperationId?: string;
  private currentOperationName = '';
  private pageTrackingStarted = false;

  initialize(): void {
    if (!isPlatformBrowser(this.platformId) || this.appInsights) {
      return;
    }

    const connectionString =
      this.appConfigService.getAppInsightsConnectionString();

    if (!this.appConfigService.isAppInsightsEnabled() || !connectionString) {
      return;
    }

    this.appInsights = new ApplicationInsights({
      config: {
        connectionString,
        disableAjaxTracking: true,
        disableFetchTracking: true,
        enableAutoRouteTracking: false,
      },
    });

    this.appInsights.addTelemetryInitializer((item: ITelemetryItem) => {
      item.tags = item.tags ?? {};
      item.tags['ai.cloud.role'] = this.cloudRoleName;

      if (this.currentOperationName) {
        item.tags['ai.operation.name'] = this.currentOperationName;
      }

      if (this.currentOperationId) {
        item.tags['ai.operation.id'] = this.currentOperationId;
      }
    });

    this.appInsights.loadAppInsights();
    this.startPageTracking();

    if (this.router.navigated) {
      this.logPageView(this.router.url);
    } else {
      this.updateOperationContext(this.router.url);
    }
  }

  logPageView(url: string = this.router.url): void {
    const path = toSanitizedPath(url);
    if (!path) {
      return;
    }

    this.updateOperationContext(path);

    this.appInsights?.trackPageView({
      name: path,
      uri: path,
      properties: {
        route: path,
      },
    });
  }

  logException(exception: Error, properties?: TelemetryProperties): void {
    const route = toSanitizedPath(
      typeof properties?.['route'] === 'string'
        ? properties['route']
        : this.router.url,
    );

    this.appInsights?.trackException(
      { exception },
      toCustomProperties({
        ...properties,
        route,
      }),
    );
  }

  logTrace(message: string, properties?: TelemetryProperties): void {
    this.appInsights?.trackTrace(
      { message },
      toCustomProperties({
        ...properties,
        route: toSanitizedPath(this.router.url),
      }),
    );
  }

  private startPageTracking(): void {
    if (this.pageTrackingStarted) {
      return;
    }

    this.pageTrackingStarted = true;

    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        this.logPageView(event.urlAfterRedirects);
      });
  }

  private updateOperationContext(url: string): void {
    const path = toSanitizedPath(url);
    if (!path) {
      return;
    }

    this.currentOperationName = path;
    this.currentOperationId = createTraceId();

    const traceContext = this.appInsights?.getTraceCtx();
    if (!isTraceContextLike(traceContext) || !this.currentOperationId) {
      return;
    }

    updateTraceContext(traceContext, {
      operationName: path,
      traceId: this.currentOperationId,
      spanId: createSpanId(),
    });
  }
}

function toCustomProperties(
  properties: TelemetryProperties,
): Record<string, string> {
  return Object.entries(properties).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      if (value === null || value === undefined || value === '') {
        return acc;
      }

      acc[key] = String(value);
      return acc;
    },
    {},
  );
}

function toSanitizedPath(url: string | null | undefined): string {
  if (!url) {
    return '';
  }

  try {
    return new URL(url, 'https://local').pathname;
  } catch {
    const queryIndex = url.indexOf('?');
    const hashIndex = url.indexOf('#');
    const cut = Math.min(
      queryIndex === -1 ? url.length : queryIndex,
      hashIndex === -1 ? url.length : hashIndex,
    );

    return url.slice(0, cut);
  }
}

function updateTraceContext(
  traceContext: TraceContextLike,
  operation: {
    operationName: string;
    traceId: string;
    spanId: string;
  },
): void {
  traceContext.setName(operation.operationName);
  traceContext.setTraceId(operation.traceId);
  traceContext.setSpanId(operation.spanId);
}

function isTraceContextLike(value: unknown): value is TraceContextLike {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const traceContext = value as Record<string, unknown>;

  return (
    typeof traceContext['setName'] === 'function' &&
    typeof traceContext['setTraceId'] === 'function' &&
    typeof traceContext['setSpanId'] === 'function'
  );
}

function createTraceId(): string {
  return createHexId(16);
}

function createSpanId(): string {
  return createHexId(8);
}

function createHexId(byteLength: number): string {
  const bytes = new Uint8Array(byteLength);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join(
    '',
  );
}
