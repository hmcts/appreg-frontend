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
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { errorInterceptor } from './core/interceptors/error.interceptor';

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
    provideApi(''),
  ],
};
