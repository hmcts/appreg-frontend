import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
  withXsrfConfiguration,
} from '@angular/common/http';
import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  provideZoneChangeDetection,
} from '@angular/core';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';

import { BASE_PATH } from 'src/generated/openapi';
import { Configuration } from 'src/generated/openapi/configuration';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req.clone({ withCredentials: true }));
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(withEventReplay()),
    provideHttpClient(
      withXsrfConfiguration({
        cookieName: 'XSRF-TOKEN',
        headerName: 'X-XSRF-TOKEN',
      }),
      withInterceptors([credentialsInterceptor]),
    ),

    { provide: BASE_PATH, useValue: '' },
    {
      provide: Configuration,
      useFactory: () =>
        new Configuration({
          basePath: '',
          withCredentials: true,
        }),
    },
    { provide: BASE_PATH, useValue: '' },
    {
      provide: Configuration,
      useFactory: () =>
        new Configuration({
          basePath: '',
          withCredentials: true,
        }),
    },
  ],
};
