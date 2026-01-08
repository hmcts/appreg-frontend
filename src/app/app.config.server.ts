import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  CSP_NONCE,
  REQUEST_CONTEXT,
  inject,
  mergeApplicationConfig,
} from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { serverCookieInterceptor } from './shared/interceptors/server-cookie.interceptor';

// Read nonce from SSR request context for Angular nonce token
function resolveCspNonce(): string | null {
  const context = inject(REQUEST_CONTEXT, { optional: true }) as
    | { cspNonce?: unknown }
    | null;
  return typeof context?.cspNonce === 'string' ? context.cspNonce : null;
}

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverCookieInterceptor])),
    { provide: CSP_NONCE, useFactory: resolveCspNonce },
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
