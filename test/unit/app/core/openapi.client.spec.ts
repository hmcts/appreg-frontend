import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { ApplicationCodesApi } from '@openapi';

describe('OpenAPI client smoke (no backend)', () => {
  let http: HttpTestingController;
  let api: ApplicationCodesApi;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ApplicationCodesApi,
      ],
    });
    http = TestBed.inject(HttpTestingController);
    api = TestBed.inject(ApplicationCodesApi);
  });

  afterEach(() => http.verify());

  it('GET /application-codes', () => {
    api.getApplicationCodes({ page: 0, size: 1 }).subscribe();
    const req = http.expectOne(
      (r) => r.method === 'GET' && r.url.endsWith('/application-codes'),
    );
    req.flush([]);
  });

  it('GET /application-codes/{code}?date=…', () => {
    api
      .getApplicationCodeByCodeAndDate({
        code: 'AD99005',
        date: '2017-07-25T00:00:00Z',
      })
      .subscribe();
    const req = http.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url.endsWith('/application-codes/AD99005') &&
        r.params.get('date') === '2017-07-25T00:00:00Z',
    );
    req.flush({});
  });
});
