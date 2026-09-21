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
import { Request } from 'cross-fetch';

import { serverCookieInterceptor } from '@interceptors/server-cookie.interceptor';

describe('serverCookieInterceptor', () => {
  describe('when REQUEST has a cookie header', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    const mockCookie = 'appreg.sid=abc.123; XSRF-TOKEN=csrf-token';
    const mockSsrRequest = new Request(
      'http://localhost/standard-applicants/ABMS',
      {
        headers: { cookie: mockCookie },
      },
    );

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([serverCookieInterceptor])),
          provideHttpClientTesting(),
          { provide: REQUEST, useValue: mockSsrRequest },
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

  describe('when REQUEST has no cookie header', () => {
    let http: HttpClient;
    let httpMock: HttpTestingController;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([serverCookieInterceptor])),
          provideHttpClientTesting(),
          {
            provide: REQUEST,
            useValue: new Request('http://localhost/standard-applicants/ABMS'),
          },
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
