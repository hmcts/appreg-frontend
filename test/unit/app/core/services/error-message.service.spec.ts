import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';

import { ErrorDisplay, ErrorMessage } from '@core-types/error/http-error.types';
import { ErrorMessageService } from '@services/error-message.service';

describe('ErrorMessageService', () => {
  let svc: ErrorMessageService;
  let router: { navigateByUrl: jest.Mock };

  const makeErr = (p: {
    status: number;
    statusText?: string;
    url?: string | null;
    error?: unknown;
  }) =>
    new HttpErrorResponse({
      status: p.status,
      statusText: p.statusText ?? 'Error',
      url: p.url ?? 'https://local/unknown',
      ...(Object.prototype.hasOwnProperty.call(p, 'error')
        ? { error: p.error }
        : { error: { title: 'boom', status: p.status } }),
    });

  beforeEach(() => {
    router = { navigateByUrl: jest.fn().mockResolvedValue(true) };

    TestBed.configureTestingModule({
      providers: [ErrorMessageService, { provide: Router, useValue: router }],
    });

    svc = TestBed.inject(ErrorMessageService);
  });

  it('starts with null errorMessage', () => {
    expect(svc.errorMessage()).toBeNull();
  });

  describe('handleErrorMessage', () => {
    it('sets an error message when not ignored and error.error is not null', () => {
      const err = makeErr({
        status: 400,
        statusText: 'Bad Request',
        url: 'https://local/application-lists',
        error: { title: 'Bad Request', status: 400, detail: 'nope' },
      });

      svc.handleErrorMessage(err);

      expect(svc.errorMessage()).toEqual(
        expect.objectContaining({
          status: 400,
          statusText: 'Bad Request',
          endpoint: 'https://local/application-lists',
          detail: expect.objectContaining({
            title: 'Bad Request',
            status: 400,
            detail: 'nope',
          }),
        }),
      );
    });

    it('does not set an error message when error.error is null', () => {
      svc.clearErrorMessage(); // ensure clean state

      const err = makeErr({
        status: 500,
        url: 'https://local/something-else',
        error: null,
      });

      svc.handleErrorMessage(err);

      expect(svc.errorMessage()).toBeNull();
      expect(router.navigateByUrl).toHaveBeenCalledWith('/internal-error');
    });

    it('does not set an error message and does not navigate for ignored endpoints', () => {
      const err = makeErr({
        status: 500,
        url: 'https://local/sso/me',
        error: { title: 'gateway', status: 500 },
      });

      svc.handleErrorMessage(err);

      expect(svc.errorMessage()).toBeNull();
      expect(router.navigateByUrl).not.toHaveBeenCalled();
    });

    it('does not navigate for subscribed endpoint+status (component handles it)', () => {
      const err = makeErr({
        status: 404,
        url: 'https://local/application-lists', // subscribed with 404
        error: { title: 'Not Found', status: 404 },
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(svc.errorMessage()?.status).toBe(404);
    });

    it('navigates to /forbidden for non-subscribed 403', () => {
      const err = makeErr({
        status: 403,
        url: 'https://local/something-else',
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/forbidden');
    });

    it('navigates to /page-not-found for non-subscribed 404', () => {
      const err = makeErr({
        status: 404,
        url: 'https://local/something-else',
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/page-not-found');
    });

    it('navigates to /internal-error for non-subscribed 500', () => {
      const err = makeErr({
        status: 500,
        url: 'https://local/something-else',
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/internal-error');
    });

    it('navigates to /internal-error for non-subscribed unknown status (default case)', () => {
      const err = makeErr({
        status: 418,
        url: 'https://local/something-else',
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).toHaveBeenCalledWith('/internal-error');
    });

    it('treats regex subscribed endpoints as subscribed (no navigation)', () => {
      const id = '123e4567-e89b-12d3-a456-426614174000';
      const err = makeErr({
        status: 409,
        url: `https://local/application-lists/${id}`, // subscribed regex includes 409
        error: { title: 'Conflict', status: 409 },
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(svc.errorMessage()?.status).toBe(409);
    });

    it('strips query/hash when matching endpoints (still subscribed)', () => {
      const err = makeErr({
        status: 400,
        url: 'https://local/application-lists?x=1#y=2',
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(svc.errorMessage()?.status).toBe(400);
    });

    it('coerces non-problem-details payloads to undefined detail', () => {
      const err = makeErr({
        status: 400,
        url: 'https://local/application-lists',
        error: { notAProblem: true },
      });

      svc.handleErrorMessage(err);

      expect(svc.errorMessage()).toEqual(
        expect.objectContaining({
          status: 400,
          detail: undefined,
        }),
      );
    });

    it('handles invalid url strings safely for endpoint matching (fallback pathname parsing)', () => {
      const err = makeErr({
        status: 400,
        url: '/application-lists?x=1', // invalid absolute URL, fallback should still match
      });

      svc.handleErrorMessage(err);

      expect(router.navigateByUrl).not.toHaveBeenCalled();
      expect(svc.errorMessage()?.status).toBe(400);
    });
  });

  describe('setErrorMessage / clearErrorMessage / updateDisplayType', () => {
    it('setErrorMessage sets the signal value', () => {
      const msg: ErrorMessage = {
        status: 400,
        statusText: 'Bad Request',
        endpoint: '/x',
      };

      svc.setErrorMessage(msg);

      expect(svc.errorMessage()).toEqual(expect.objectContaining(msg));
    });

    it('clearErrorMessage clears the signal value', () => {
      svc.setErrorMessage({ status: 500, statusText: 'Err', endpoint: '/x' });
      svc.clearErrorMessage();

      expect(svc.errorMessage()).toBeNull();
    });

    it('updateDisplayType no-ops when there is no current message', () => {
      svc.clearErrorMessage();
      svc.updateDisplayType('PAGE' as ErrorDisplay);

      expect(svc.errorMessage()).toBeNull();
    });

    it('updateDisplayType updates display field when message exists', () => {
      svc.setErrorMessage({ status: 500, statusText: 'Err', endpoint: '/x' });
      svc.updateDisplayType('COMPONENT');

      expect(svc.errorMessage()).toEqual(
        expect.objectContaining({ status: 500, display: 'COMPONENT' }),
      );
    });
  });
});
