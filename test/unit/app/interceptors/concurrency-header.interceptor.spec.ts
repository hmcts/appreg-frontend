import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { IF_MATCH, ROW_VERSION } from '@context/concurrency-context';
import { concurrencyHeaderInterceptor } from '@interceptors/concurrency-header.interceptor';

describe('concurrencyHeaderInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([concurrencyHeaderInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('does not add concurrency headers when no context tokens are set', () => {
    http.delete('/application-lists/123').subscribe();

    const req = httpMock.expectOne('/application-lists/123');
    expect(req.request.headers.has('If-Match')).toBeFalsy();
    expect(req.request.headers.has('X-Row-Version')).toBeFalsy();

    req.flush({});
  });

  it('adds an If-Match header when the IF_MATCH context token is set', () => {
    const context = new HttpContext().set(IF_MATCH, 'W/"etag-v1"');

    http.put('/application-lists/123', {}, { context }).subscribe();

    const req = httpMock.expectOne('/application-lists/123');
    expect(req.request.headers.get('If-Match')).toBe('W/"etag-v1"');
    expect(req.request.headers.has('X-Row-Version')).toBeFalsy();

    req.flush({});
  });

  it('adds an X-Row-Version header when the ROW_VERSION context token is set', () => {
    const context = new HttpContext().set(ROW_VERSION, '42');

    http.delete('/application-lists/123', { context }).subscribe();

    const req = httpMock.expectOne('/application-lists/123');
    expect(req.request.headers.has('If-Match')).toBeFalsy();
    expect(req.request.headers.get('X-Row-Version')).toBe('42');

    req.flush({});
  });

  it('adds both concurrency headers and preserves existing headers', () => {
    const context = new HttpContext()
      .set(IF_MATCH, '"etag-v2"')
      .set(ROW_VERSION, '43');
    const headers = new HttpHeaders({ 'X-Trace': 'trace-123' });

    http.patch('/application-lists/123', {}, { context, headers }).subscribe();

    const req = httpMock.expectOne('/application-lists/123');
    expect(req.request.headers.get('If-Match')).toBe('"etag-v2"');
    expect(req.request.headers.get('X-Row-Version')).toBe('43');
    expect(req.request.headers.get('X-Trace')).toBe('trace-123');

    req.flush({});
  });
});
