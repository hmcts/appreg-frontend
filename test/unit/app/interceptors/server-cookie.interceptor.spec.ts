import {
  HttpClient,
  HttpHeaders,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { REQUEST } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { serverCookieInterceptor } from '@interceptors/server-cookie.interceptor';

describe('serverCookieInterceptor', () => {
  describe('when REQUEST has a cookie header', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    const mockCookie = 'SID=abc.123; Path=/; Secure; HttpOnly; SameSite=Lax';
    const mockExpressReq = {
      headers: {
        cookie: mockCookie,
      },
    };

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          // Register the interceptor under test
          provideHttpClient(withInterceptors([serverCookieInterceptor])),
          // Use the testing backend
          provideHttpClientTesting(),
          // Provide the SSR REQUEST token with a cookie
          { provide: REQUEST, useValue: mockExpressReq },
        ],
      });
      http = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('forwards the cookie header to outgoing requests', () => {
      http.get('/application-lists').subscribe();

      const req = httpMock.expectOne('/application-lists');
      expect(req.request.headers.get('cookie')).toBe(mockCookie);

      req.flush({ ok: true });
    });

    it('preserves existing headers while adding cookie', () => {
      const headers = new HttpHeaders({ 'X-Trace': 'abc' });

      http.get('/ping', { headers }).subscribe();

      const req = httpMock.expectOne('/ping');
      expect(req.request.headers.get('X-Trace')).toBe('abc');
      expect(req.request.headers.get('cookie')).toBe(mockCookie);

      req.flush({ ok: true });
    });
  });

  describe('when REQUEST is not provided', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([serverCookieInterceptor])),
          provideHttpClientTesting(),
          // NOTE: no REQUEST provider here on purpose
        ],
      });
      http = TestBed.inject(HttpClient);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => httpMock.verify());

    it('does not set a cookie header', () => {
      http.get('/health').subscribe();

      const req = httpMock.expectOne('/health');
      expect(req.request.headers.has('cookie')).toBeFalsy();

      req.flush({ status: 'OK' });
    });
  });
});
