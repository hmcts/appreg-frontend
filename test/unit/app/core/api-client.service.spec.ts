import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import {
  ApiClient,
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';

describe('ApiClient + apiInterceptor', () => {
  let client: ApiClient;
  let httpMock: HttpTestingController;
  let bus: ErrorBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApiClient,
        ErrorBus,
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    client = TestBed.inject(ApiClient);
    httpMock = TestBed.inject(HttpTestingController);
    bus = TestBed.inject(ErrorBus);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('GET: builds params/headers and sets withCredentials', (done) => {
    const params = { a: 1, b: 'x', c: null, skip: undefined };
    const headers = { 'X-Test': '1' };

    client
      .get<{ ok: boolean }>('/things', { params, headers })
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual({ ok: true });
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne((r) => r.url === '/things');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('a')).toBe('1');
    expect(req.request.params.get('b')).toBe('x');
    expect(req.request.params.has('c')).toBe(false);
    expect(req.request.headers.get('X-Test')).toBe('1');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ ok: true });
  });

  it('POST: sends body and sets withCredentials', (done) => {
    const body = { name: 'alice' };

    client
      .post<{ id: number }>('/users', body, { headers: { 'X-Role': 'admin' } })
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual({ id: 42 });
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne('/users');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(body);
    expect(req.request.headers.get('X-Role')).toBe('admin');
    expect(req.request.withCredentials).toBe(true);
    req.flush({ id: 42 });
  });

  it('PUT/PATCH/DELETE call through correctly', () => {
    client.put('/u/1', { n: 1 }).subscribe();
    client.patch('/u/1', { n: 2 }).subscribe();
    client.delete('/u/1').subscribe();

    const reqs = httpMock.match('/u/1');
    expect(reqs).toHaveLength(3);

    const methods = reqs.map((r) => r.request.method);
    expect(methods).toEqual(expect.arrayContaining(['PUT', 'PATCH', 'DELETE']));
    reqs.forEach((r) => expect(r.request.withCredentials).toBe(true));

    reqs.forEach((r) => r.flush({}));
  });

  it('Interceptor: emits user-friendly message for 0 (network) and rethrows ApiError', async () => {
    const dataP = firstValueFrom(client.get('/network').pipe(take(1)).pipe());
    const msgP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne('/network');
    expect(req.request.method).toBe('GET');
    req.error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error',
    });

    await expect(dataP).rejects.toEqual(expect.objectContaining({ status: 0 }));
    await expect(msgP).resolves.toMatch(/Unable to load resource/i);
  });

  it('Interceptor: 404 -> "Resource not found" and rethrows ApiError', async () => {
    const dataP = firstValueFrom(client.get('/missing').pipe(take(1)));
    const msgP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne('/missing');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    await expect(dataP).rejects.toEqual(
      expect.objectContaining({ status: 404 }),
    );
    await expect(msgP).resolves.toMatch(/Resource not found/i);
  });

  it('Interceptor: 500 -> "Server error."', async () => {
    const dataP = firstValueFrom(client.get('/boom').pipe(take(1)));
    const msgP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne('/boom');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    await expect(dataP).rejects.toEqual(
      expect.objectContaining({ status: 500 }),
    );
    await expect(msgP).resolves.toMatch(/Server error\./i);
  });
});
