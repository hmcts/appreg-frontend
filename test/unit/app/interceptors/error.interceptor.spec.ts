import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { ErrorHandler, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

import { errorInterceptor } from '@interceptors/error.interceptor';
import { ErrorMessageService } from '@services/error-message.service';
import { TelemetryService } from '@services/telemetry.service';

describe('errorInterceptor', () => {
  let router: { navigate: jest.Mock };
  let errorHandler: { handleError: jest.Mock };
  let errorMessageService: { handleErrorMessage: jest.Mock };
  let telemetryService: { logException: jest.Mock };
  let platformId: 'browser' | 'server';

  const req = new HttpRequest('GET', '/test?user=alice');

  beforeEach(() => {
    platformId = 'browser';
    router = { navigate: jest.fn().mockResolvedValue(true) };
    errorHandler = { handleError: jest.fn() };
    errorMessageService = { handleErrorMessage: jest.fn() };
    telemetryService = { logException: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useFactory: () => platformId },
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: ErrorMessageService, useValue: errorMessageService },
        { provide: TelemetryService, useValue: telemetryService },
      ],
    });
  });

  function runInterceptorWithError(
    error: unknown,
    request: HttpRequest<unknown> = req,
  ) {
    return TestBed.runInInjectionContext(() =>
      errorInterceptor(request, () => throwError(() => error)),
    );
  }

  it('navigates to /login on 401 and reports to ErrorHandler', (done) => {
    const err = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/foo',
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'HttpRequestFailure',
            message: 'HTTP GET /test failed with 401 Unauthorized',
          }),
          expect.objectContaining({
            requestMethod: 'GET',
            requestUrl: '/test',
            responseUrl: '/api/foo',
            statusCode: 401,
            statusText: 'Unauthorized',
          }),
        );

        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith(['/login']);

        expect(errorMessageService.handleErrorMessage).not.toHaveBeenCalled();

        expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);

        done();
      },
    });
  });

  it('delegates to ErrorMessageService on non-401 HttpErrorResponse and reports to ErrorHandler', (done) => {
    const err = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: '/api/foo?query=1',
      error: { detail: 'boom', correlationId: 'correlation-123' },
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e: unknown) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'HttpRequestFailure',
            message: 'HTTP GET /test failed with 500 Server Error',
          }),
          expect.objectContaining({
            requestMethod: 'GET',
            requestUrl: '/test',
            responseUrl: '/api/foo',
            statusCode: 500,
            statusText: 'Server Error',
            correlationId: 'correlation-123',
          }),
        );

        expect(router.navigate).not.toHaveBeenCalled();

        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledTimes(1);
        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledWith(
          err,
        );

        expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);

        done();
      },
    });
  });

  it('does not navigate to /login on 401 during SSR', (done) => {
    platformId = 'server';
    TestBed.resetTestingModule();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useFactory: () => platformId },
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: ErrorMessageService, useValue: errorMessageService },
        { provide: TelemetryService, useValue: telemetryService },
      ],
    });

    const err = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/foo',
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e) => {
        expect(e).toBe(err);
        expect(router.navigate).not.toHaveBeenCalled();
        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledTimes(1);
        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledWith(
          err,
        );
        expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);
        done();
      },
    });
  });

  it('does nothing for non-HttpErrorResponse errors (still rethrows)', (done) => {
    const err = new Error('nope');

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e: unknown) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(errorMessageService.handleErrorMessage).not.toHaveBeenCalled();
        expect(errorHandler.handleError).not.toHaveBeenCalled();

        done();
      },
    });
  });
});
