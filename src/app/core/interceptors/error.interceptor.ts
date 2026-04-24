import { isPlatformBrowser } from '@angular/common';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { ErrorHandler, PLATFORM_ID, inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { ErrorMessageService } from '@services/error-message.service';
import { TelemetryService } from '@services/telemetry.service';
import { toSanitizedPath } from '@util/sanitized-path';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const errorHandler = inject(ErrorHandler);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const errorMessageService = inject(ErrorMessageService);
  const telemetryService = inject(TelemetryService);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        telemetryService.logException(
          toTelemetryError(req, error),
          buildTelemetryProperties(req, error),
        );

        if (error.status === 401 && isPlatformBrowser(platformId)) {
          void router.navigate(['/login']);
        } else {
          errorMessageService.handleErrorMessage(error);
        }

        errorHandler.handleError(error);
      }

      return throwError(() => error);
    }),
  );
};

function buildTelemetryProperties(
  req: HttpRequest<unknown>,
  error: HttpErrorResponse,
): Record<string, string | number | undefined> {
  return {
    requestMethod: req.method,
    requestUrl: toSanitizedPath(req.urlWithParams),
    responseUrl: toSanitizedPath(error.url ?? req.urlWithParams),
    statusCode: error.status,
    statusText: error.statusText,
    correlationId: getCorrelationId(error),
  };
}

function getCorrelationId(error: HttpErrorResponse): string | undefined {
  for (const headerName of [
    'x-correlation-id',
    'correlation-id',
    'x-request-id',
    'request-id',
    'traceparent',
  ]) {
    const headerValue = error.headers.get(headerName);
    if (headerValue) {
      return headerValue;
    }
  }

  const responseBody: unknown = error.error;
  if (!responseBody || typeof responseBody !== 'object') {
    return undefined;
  }

  const correlationId = (responseBody as Record<string, unknown>)[
    'correlationId'
  ];

  return typeof correlationId === 'string' && correlationId.length > 0
    ? correlationId
    : undefined;
}

function toTelemetryError(
  req: HttpRequest<unknown>,
  error: HttpErrorResponse,
): Error {
  const trackedError = new Error(
    `HTTP ${req.method} ${toSanitizedPath(req.urlWithParams)} failed with ${error.status} ${error.statusText}`,
  );

  trackedError.name = 'HttpRequestFailure';

  return trackedError;
}
