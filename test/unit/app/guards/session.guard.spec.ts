import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { SessionService } from '../../../../src/app/core/session.service';
import { sessionGuard } from '../../../../src/app/guards/session.guard';

type RefreshMock = jest.Mock<Promise<boolean>, []>;

describe('sessionGuard (browser platform)', () => {
  let router: Router;
  let refreshMock: RefreshMock;

  beforeEach(() => {
    refreshMock = jest.fn<Promise<boolean>, []>();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        {
          provide: SessionService,
          useValue: { refresh: refreshMock } as Pick<SessionService, 'refresh'>,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('allows activation when session.refresh() resolves true', async () => {
    refreshMock.mockResolvedValue(true);

    // get proper snapshots to satisfy CanActivateFn signature
    const state = router.routerState.snapshot;
    const route = state.root;

    const result = await TestBed.runInInjectionContext(() =>
      sessionGuard(route, state),
    );

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(result).toBe(true);
  });

  it('redirects to /login when session.refresh() resolves false', async () => {
    refreshMock.mockResolvedValue(false);

    const originalCreateUrlTree = router.createUrlTree.bind(router);
    const expected: UrlTree = originalCreateUrlTree(['/login']);

    const createSpy = jest
      .spyOn(router, 'createUrlTree')
      .mockReturnValue(expected);

    const state = router.routerState.snapshot;
    const route = state.root;

    const result = await TestBed.runInInjectionContext(() =>
      sessionGuard(route, state),
    );

    expect(refreshMock).toHaveBeenCalledTimes(1);
    expect(createSpy).toHaveBeenCalledWith(['/login']);
    expect(result).toBe(expected);
  });
});

describe('sessionGuard (server platform)', () => {
  let router: Router;
  let refreshMock: RefreshMock;

  beforeEach(() => {
    refreshMock = jest.fn<Promise<boolean>, []>();

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      providers: [
        { provide: PLATFORM_ID, useValue: 'server' },
        {
          provide: SessionService,
          useValue: { refresh: refreshMock } as Pick<SessionService, 'refresh'>,
        },
      ],
    });

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('returns true on non-browser and does not call refresh() or createUrlTree()', async () => {
    const createSpy = jest.spyOn(router, 'createUrlTree');

    const state = router.routerState.snapshot;
    const route = state.root;

    const result = await TestBed.runInInjectionContext(() =>
      sessionGuard(route, state),
    );

    expect(result).toBe(true);
    expect(refreshMock).not.toHaveBeenCalled();
    expect(createSpy).not.toHaveBeenCalled();
  });
});
