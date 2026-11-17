import { HttpClient, HttpContext } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ROUTER_CONFIGURATION } from '@angular/router';

import { appConfig } from '../../../src/app/app.config';

import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { AppConfigService } from '@core/services/app-config.service';
import { TelemetryService } from '@core/services/telemetry.service';
import * as moduleRecovery from '@core/util/global-module-load-error-listener';
import { Configuration } from '@openapi';

// Angular locale files are ESM .js, outside this Jest project's transform rules.
jest.mock('@angular/common/locales/en-GB', () => ({
  __esModule: true,
  default: ['en-GB'],
}));

describe('appConfig', () => {
  it('initialises configuration and telemetry and preserves history on cancelled navigation', async () => {
    const install = jest
      .spyOn(moduleRecovery, 'installGlobalModuleLoadErrorListener')
      .mockImplementation();
    const config = { loadAppConfig: jest.fn().mockResolvedValue(undefined) };
    const telemetry = { initialize: jest.fn(), logTrace: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        ...appConfig.providers,
        provideHttpClientTesting(),
        { provide: AppConfigService, useValue: config },
        { provide: TelemetryService, useValue: telemetry },
      ],
    });
    try {
      const init = TestBed.inject(ApplicationInitStatus);
      init.runInitializers();
      await init.donePromise;
      expect(config.loadAppConfig).toHaveBeenCalledTimes(1);
      expect(telemetry.initialize).toHaveBeenCalledTimes(1);
      expect(
        TestBed.inject(ROUTER_CONFIGURATION).canceledNavigationResolution,
      ).toBe('computed');
      expect(TestBed.inject(Configuration).withCredentials).toBe(true);

      const recovery = {
        attemptsInWindow: 1,
        errorType: 'ChunkLoadError',
        maxAttempts: 2,
        reloadAttempted: true,
        windowMs: 60_000,
      };
      install.mock.calls[0][0]?.logRecovery?.(recovery);
      expect(telemetry.logTrace).toHaveBeenCalledWith(
        'Frontend asset load error recovery',
        recovery,
      );

      TestBed.inject(HttpClient).get('/example').subscribe();
      const http = TestBed.inject(HttpTestingController);
      const request = http.expectOne('/example');
      expect(request.request.withCredentials).toBe(true);
      request.flush({});

      TestBed.inject(HttpClient)
        .delete('/application-lists/synthetic-list', {
          context: new HttpContext()
            .set(IF_MATCH, '"synthetic-version"')
            .set(ROW_VERSION, '1'),
        })
        .subscribe();
      const deletion = http.expectOne('/application-lists/synthetic-list');
      expect(deletion.request.headers.get('If-Match')).toBe(
        '"synthetic-version"',
      );
      expect(deletion.request.headers.get('X-Row-Version')).toBe('1');
      expect(deletion.request.withCredentials).toBe(true);
      deletion.flush(null, { status: 204, statusText: 'No Content' });
      http.verify();
    } finally {
      install.mockRestore();
    }
  });
});
