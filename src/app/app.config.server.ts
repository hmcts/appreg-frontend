import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, mergeApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';

import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';
import { serverCookieInterceptor } from './interceptors/server-cookie.interceptor';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    provideHttpClient(withInterceptors([serverCookieInterceptor])),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
