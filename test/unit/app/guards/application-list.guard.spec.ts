import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  RedirectCommand,
  Router,
  provideRouter,
} from '@angular/router';
import { firstValueFrom, isObservable, of, throwError } from 'rxjs';

import { routes } from '../../../../src/app/app.routes';

import { applicationListGuard } from '@guards/application-list.guard';
import { ApplicationListsApi } from '@openapi';

describe('applicationListGuard', () => {
  const listId = '123e4567-e89b-12d3-a456-426655440000';
  const getApplicationList = jest.fn();

  beforeEach(() => {
    getApplicationList.mockReset().mockReturnValue(of({ id: listId }));
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationListsApi, useValue: { getApplicationList } },
      ],
    });
  });

  async function runGuard(id: string | null = listId) {
    const route = new ActivatedRouteSnapshot();
    route.params = id === null ? {} : { id };
    const router = TestBed.inject(Router);
    const result = TestBed.runInInjectionContext(() =>
      applicationListGuard(route, router.routerState.snapshot),
    );
    return isObservable(result) ? firstValueFrom(result) : result;
  }

  function expectRedirect(result: unknown) {
    expect(result).toBeInstanceOf(RedirectCommand);
    const redirect = result as RedirectCommand;
    expect(TestBed.inject(Router).serializeUrl(redirect.redirectTo)).toBe(
      '/applications-list',
    );
    expect(redirect.navigationBehaviorOptions?.replaceUrl).toBe(true);
  }

  it.each(['490f5-d5a82', 'atesID2', '', null])(
    'redirects malformed ID %s without a lookup',
    async (id) => {
      expectRedirect(await runGuard(id));
      expect(getApplicationList).not.toHaveBeenCalled();
    },
  );

  it.each([listId, listId.toUpperCase()])(
    'allows an existing list %s',
    async (id) => {
      expect(await runGuard(id)).toBe(true);
      expect(getApplicationList).toHaveBeenCalledWith(
        { listId: id },
        'body',
        false,
        { transferCache: false },
      );
    },
  );

  it('redirects when the list does not exist', async () => {
    getApplicationList.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    expectRedirect(await runGuard());
  });

  it.each([0, 400, 401, 403, 409, 500, 503])(
    'preserves page error handling for status %s',
    async (status) => {
      getApplicationList.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status })),
      );
      expect(await runGuard()).toBe(true);
    },
  );

  it('does not make authenticated API requests during SSR', async () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    expect(await runGuard()).toBe(true);
    expect(getApplicationList).not.toHaveBeenCalled();
  });

  it.each([
    ':id',
    ':id/delete',
    ':id/close',
    ':id/create-entry',
    ':id/update-entry/:entryId',
    ':id/:entryId/delete',
    ':id/create-entry/change-payment-reference',
    ':id/update-entry/:entryId/change-payment-reference',
    ':id/bulk-upload',
    ':id/result-selected',
    ':id/update-officials',
    ':id/update-notes/:entryId',
    ':id/update-officials/confirm',
    ':id/move',
    ':id/move/confirm',
    ':id/bulk-update-fee',
    ':id/bulk-update-fee/confirm',
    ':id/bulk-update-fee/change-payment-reference',
  ])('protects the %s route', (path) => {
    const route = routes
      .find((item) => item.path === 'applications-list')
      ?.children?.find((item) => item.path === path);
    expect(route?.canActivate).toContain(applicationListGuard);
  });

  it.each(['', 'create'])(
    'does not require an existing list for the %s route',
    (path) => {
      const route = routes
        .find((item) => item.path === 'applications-list')
        ?.children?.find((item) => item.path === path);
      expect(route).toBeDefined();
      expect(route?.canActivate ?? []).not.toContain(applicationListGuard);
    },
  );
});
