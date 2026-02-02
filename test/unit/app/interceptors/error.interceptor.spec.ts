import { HttpErrorResponse, HttpRequest } from '@angular/common/http';
import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';

import { errorInterceptor } from '@interceptors/error.interceptor';
import { ErrorMessageService } from '@services/error-message.service';

describe('errorInterceptor', () => {
  let router: { navigate: jest.Mock };
  let errorHandler: { handleError: jest.Mock };
  let errorMessageService: { handleErrorMessage: jest.Mock };

  const req = new HttpRequest('GET', '/test');

  beforeEach(() => {
    router = { navigate: jest.fn().mockResolvedValue(true) };
    errorHandler = { handleError: jest.fn() };
    errorMessageService = { handleErrorMessage: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: ErrorMessageService, useValue: errorMessageService },
      ],
    });
  });

  function runInterceptorWithError(error: unknown) {
    return TestBed.runInInjectionContext(() =>
      errorInterceptor(req, () => throwError(() => error)),
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
      url: '/api/foo',
      error: { detail: 'boom' },
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e: unknown) => {
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

        expect(router.navigate).not.toHaveBeenCalled();
        expect(errorMessageService.handleErrorMessage).not.toHaveBeenCalled();
        expect(errorHandler.handleError).not.toHaveBeenCalled();

        done();
      },
    });
  });
});
