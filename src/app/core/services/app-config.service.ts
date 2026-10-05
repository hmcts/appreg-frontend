import { isPlatformBrowser } from '@angular/common';
import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import type { BrowserAppConfig } from '../../../../server/app-config';

const CONFIG_PATH = '/app/config';

const DEFAULT_APP_CONFIG: BrowserAppConfig = Object.freeze({
  environment: 'development',
  appInsights: {
    enabled: false,
    connectionString: null,
  },
});

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = new HttpClient(inject(HttpBackend));

  private appConfig: BrowserAppConfig = DEFAULT_APP_CONFIG;
  private loadPromise?: Promise<void>;

  loadAppConfig(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    if (this.loadPromise) {
      return this.loadPromise;
    }

    this.loadPromise = this.fetchAppConfig();
    return this.loadPromise;
  }

  getAppConfig(): BrowserAppConfig {
    return this.appConfig;
  }

  isAppInsightsEnabled(): boolean {
    return (
      this.appConfig.appInsights.enabled &&
      typeof this.appConfig.appInsights.connectionString === 'string' &&
      this.appConfig.appInsights.connectionString.length > 0
    );
  }

  getAppInsightsConnectionString(): string | null {
    return this.appConfig.appInsights.connectionString;
  }

  private async fetchAppConfig(): Promise<void> {
    try {
      const appConfig = await firstValueFrom(
        this.http.get<Partial<BrowserAppConfig>>(CONFIG_PATH),
      );

      this.appConfig = normalizeAppConfig(appConfig);
    } catch {
      this.appConfig = DEFAULT_APP_CONFIG;
    }
  }
}

function normalizeAppConfig(
  value: Partial<BrowserAppConfig> | null | undefined,
): BrowserAppConfig {
  const environment =
    typeof value?.environment === 'string' &&
    value.environment.trim().length > 0
      ? value.environment.trim()
      : DEFAULT_APP_CONFIG.environment;
  const appInsights = value?.appInsights;
  const enabled = appInsights?.enabled === true;
  const connectionString =
    typeof appInsights?.connectionString === 'string' &&
    appInsights.connectionString.trim().length > 0
      ? appInsights.connectionString.trim()
      : null;

  return {
    environment,
    appInsights: {
      enabled: enabled && Boolean(connectionString),
      connectionString,
    },
  };
}
