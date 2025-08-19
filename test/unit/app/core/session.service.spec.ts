import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { SessionService } from '../../../../src/app/core/session.service';

type FetchFn = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
type FetchArgs = Parameters<FetchFn>;
type FetchRet = ReturnType<FetchFn>;

describe('SessionService (browser platform)', () => {
  let service: SessionService;
  let fetchMock: jest.Mock<FetchRet, FetchArgs>;

  // Preserve whatever fetch the environment already has
  const originalFetch: typeof fetch | undefined =
    (globalThis as { fetch?: typeof fetch }).fetch;

  beforeEach(() => {
    fetchMock = jest.fn<FetchRet, FetchArgs>();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    if (originalFetch) {
      (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
    jest.resetAllMocks();
  });

  it('starts unauthenticated and toggles via setAuthenticated()', () => {
    expect(service.isAuthenticated()).toBe(false);

    service.setAuthenticated(true);
    expect(service.isAuthenticated()).toBe(true);

    service.setAuthenticated(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refresh() authenticates when /sso/me returns 2xx', async () => {
    fetchMock.mockResolvedValue({ status: 204 } as Response);

    const ok = await service.refresh();

    expect(ok).toBe(true);
    expect(service.isAuthenticated()).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('refresh() deauths on non-2xx (e.g. 401)', async () => {
    service.setAuthenticated(true);
    fetchMock.mockResolvedValue({ status: 401 } as Response);

    const ok = await service.refresh();

    expect(ok).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refresh() deauths on 5xx', async () => {
    fetchMock.mockResolvedValue({ status: 500 } as Response);

    const ok = await service.refresh();

    expect(ok).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('refresh() deauths on network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));

    const ok = await service.refresh();

    expect(ok).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
  });

  it('issues the request with hardened options', async () => {
    fetchMock.mockResolvedValue({ status: 200 } as Response);

    await service.refresh();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/sso/me');
    expect(opts).toEqual(expect.objectContaining({
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual',
      headers: expect.objectContaining({ accept: 'application/json' }),
    }));
  });
});

describe('SessionService (server platform)', () => {
  let service: SessionService;
  let fetchMock: jest.Mock<FetchRet, FetchArgs>;

  const originalFetch: typeof fetch | undefined =
    (globalThis as { fetch?: typeof fetch }).fetch;

  beforeEach(() => {
    fetchMock = jest.fn<FetchRet, FetchArgs>();
    (globalThis as { fetch: typeof fetch }).fetch = fetchMock as unknown as typeof fetch;

    TestBed.configureTestingModule({
      providers: [
        SessionService,
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    });

    service = TestBed.inject(SessionService);
  });

  afterEach(() => {
    if (originalFetch) {
      (globalThis as { fetch: typeof fetch }).fetch = originalFetch;
    } else {
      delete (globalThis as { fetch?: typeof fetch }).fetch;
    }
    jest.resetAllMocks();
  });

  it('refresh() short-circuits on non-browser and sets unauthenticated', async () => {
    service.setAuthenticated(true);

    const ok = await service.refresh();

    expect(ok).toBe(false);
    expect(service.isAuthenticated()).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
