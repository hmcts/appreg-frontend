import { registerLocaleData } from '@angular/common';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import localeEnGb from '@angular/common/locales/en-GB';
import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';
import { AppConfigService } from './core/services/app-config.service';
import { TelemetryErrorHandler } from './core/services/telemetry-error-handler.service';
import { TelemetryService } from './core/services/telemetry.service';

import { BASE_PATH, Configuration, provideApi } from '@openapi';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

registerLocaleData(localeEnGb);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAppInitializer(() => {
      const appConfigService = inject(AppConfigService);
      const telemetryService = inject(TelemetryService);

      return appConfigService
        .loadAppConfig()
        .then(() => telemetryService.initialize());
    }),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([credentialsInterceptor, errorInterceptor]),
    ),
    // Override default en-US to en-GB
    { provide: LOCALE_ID, useValue: 'en-GB' },
    { provide: BASE_PATH, useValue: '' },
    {
      provide: Configuration,
      useFactory: () =>
        new Configuration({
          basePath: '',
          withCredentials: true,
        }),
    },
    { provide: ErrorHandler, useExisting: TelemetryErrorHandler },
    provideApi(''),
  ],
};
