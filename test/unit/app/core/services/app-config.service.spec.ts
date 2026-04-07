import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { AppConfigService } from '@services/app-config.service';

describe('AppConfigService (browser)', () => {
  let httpMock: HttpTestingController;
  let service: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(AppConfigService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('loads browser config from /app/config', async () => {
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/app/config');
    expect(req.request.method).toBe('GET');
    req.flush({
      environment: 'production',
      appInsights: {
        enabled: true,
        connectionString: 'InstrumentationKey=abc123',
      },
    });

    await loadPromise;

    expect(service.getAppConfig()).toEqual({
      environment: 'production',
      appInsights: {
        enabled: true,
        connectionString: 'InstrumentationKey=abc123',
      },
    });
    expect(service.isAppInsightsEnabled()).toBe(true);
    expect(service.getAppInsightsConnectionString()).toBe(
      'InstrumentationKey=abc123',
    );
  });

  it('falls back to disabled telemetry config when the request fails', async () => {
    const loadPromise = service.loadAppConfig();

    const req = httpMock.expectOne('/app/config');
    req.flush('boom', { status: 500, statusText: 'Server Error' });

    await expect(loadPromise).resolves.toBeUndefined();

    expect(service.getAppConfig()).toEqual({
      environment: 'development',
      appInsights: {
        enabled: false,
        connectionString: null,
      },
    });
    expect(service.isAppInsightsEnabled()).toBe(false);
  });
});

describe('AppConfigService (server)', () => {
  let service: AppConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AppConfigService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    service = TestBed.inject(AppConfigService);
  });

  it('does not fetch browser config during SSR', async () => {
    await expect(service.loadAppConfig()).resolves.toBeUndefined();

    expect(service.getAppConfig()).toEqual({
      environment: 'development',
      appInsights: {
        enabled: false,
        connectionString: null,
      },
    });
  });
});
