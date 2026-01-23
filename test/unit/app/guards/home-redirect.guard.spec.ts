import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';

import { homeRedirectGuard } from '@guards/home-redirect.guard';
import { SessionService } from '@services/session.service';

describe('homeRedirectGuard', () => {
  let router: jest.Mocked<Pick<Router, 'parseUrl'>>;
  let session: jest.Mocked<Pick<SessionService, 'refresh'>>;

  // Dummy args required by CanActivateFn signature
  const route = {} as ActivatedRouteSnapshot;
  const state = {} as RouterStateSnapshot;

  beforeEach(() => {
    router = {
      parseUrl: jest.fn(),
    };

    session = {
      refresh: jest.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: SessionService, useValue: session },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  it('returns /login when not running in the browser (server platform)', async () => {
    const loginTree = {} as UrlTree;
    router.parseUrl.mockReturnValue(loginTree);

    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });

    const result = await TestBed.runInInjectionContext(() =>
      homeRedirectGuard(route, state),
    );

    expect(session.refresh).not.toHaveBeenCalled();
    expect(router.parseUrl).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(loginTree);
  });

  it('redirects to /applications-list when authenticated (browser platform)', async () => {
    const appsTree = {} as UrlTree;
    router.parseUrl.mockReturnValue(appsTree);
    session.refresh.mockResolvedValue(true);

    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'browser' });

    const result = await TestBed.runInInjectionContext(() =>
      homeRedirectGuard(route, state),
    );

    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledWith('/applications-list');
    expect(result).toBe(appsTree);
  });

  it('redirects to /login when not authenticated (browser platform)', async () => {
    const loginTree = {} as UrlTree;
    router.parseUrl.mockReturnValue(loginTree);
    session.refresh.mockResolvedValue(false);

    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'browser' });

    const result = await TestBed.runInInjectionContext(() =>
      homeRedirectGuard(route, state),
    );

    expect(session.refresh).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledTimes(1);
    expect(router.parseUrl).toHaveBeenCalledWith('/login');
    expect(result).toBe(loginTree);
  });
});
