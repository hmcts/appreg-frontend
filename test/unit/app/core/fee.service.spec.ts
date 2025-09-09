import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { Fee } from '../../../../src/app/core/models/fee';
import {
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';
import { FeeService } from '../../../../src/app/core/services/fee.service';

describe('FeeService', () => {
  let service: FeeService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FeeService,
        ErrorBus,
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FeeService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllFee$ (default) calls /fee?page=1&size=10 and returns content[]', async () => {
    const mock: Fee[] = [
      {
        fee_id: 101,
        fee_reference: 'FEE-000101',
        fee_description: 'Standard application fee',
        fee_value: 135.5,
        fee_start_date: '2025-01-15',
        fee_end_date: null,
        fee_version: 3,
        fee_changed_by: 42,
        fee_changed_date: '2025-03-02',
        fee_user_name: 'alice.smith',
      },
      {
        fee_id: 102,
        fee_reference: 'FEE-000102',
        fee_description: 'Expedited processing',
        fee_value: 250,
        fee_start_date: '2025-02-01',
        fee_end_date: '2025-12-31',
        fee_version: 1,
        fee_changed_by: 77,
        fee_changed_date: '2025-02-05',
        fee_user_name: 'bob.jones',
      },
    ];

    const dataP = firstValueFrom(service.getAllFee$().pipe(take(1)));

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/fee' &&
        r.params.get('page') === '1' &&
        r.params.get('size') === '10',
    );
    req.flush({ content: mock, totalElements: 2, totalPages: 1 });

    await expect(dataP).resolves.toEqual(mock);
  });

  it('getAllFee$ passes query params when provided', async () => {
    const dataP = firstValueFrom(
      service
        .getAllFee$({ reference: 'FEE-000101', page: 2, size: 50 })
        .pipe(take(1)),
    );

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/fee' &&
        r.params.get('reference') === 'FEE-000101' &&
        r.params.get('page') === '2' &&
        r.params.get('size') === '50',
    );
    req.flush({ content: [], totalElements: 0, totalPages: 0 });

    await expect(dataP).resolves.toEqual([]);
  });

  it('getFeeById$ calls /fee/:id and returns data', (done) => {
    const mock: Fee = {
      fee_id: 101,
      fee_reference: 'FEE-000101',
      fee_description: 'Standard application fee',
      fee_value: 135.5,
      fee_start_date: '2025-01-15',
      fee_end_date: null,
      fee_version: 3,
      fee_changed_by: 42,
      fee_changed_date: '2025-03-02',
      fee_user_name: 'alice.smith',
    };

    service
      .getFeeById$(101)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual(mock);
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url === '/fee/101',
    );
    req.flush(mock);
  });
});
