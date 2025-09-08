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

  it('getAllFee$ should GET /fee and return data', async () => {
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
      {
        fee_id: 103,
        fee_reference: 'FEE-000103',
        fee_description: 'Late payment charge',
        fee_value: 50,
        fee_start_date: '2024-11-01',
        fee_end_date: null,
        fee_version: 5,
        fee_changed_by: 77,
        fee_changed_date: '2025-03-12',
        fee_user_name: 'bob.jones',
      },
      {
        fee_id: 104,
        fee_reference: 'FEE-000104',
        fee_description: 'Document handling fee',
        fee_value: 19.99,
        fee_start_date: '2025-03-01',
        fee_end_date: null,
        fee_version: 2,
        fee_changed_by: 12,
        fee_changed_date: '2025-03-10',
        fee_user_name: 'carol.ng',
      },
    ];

    const dataP = firstValueFrom(service.getAllFee$().pipe(take(1)));

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' && r.url === '/fee' && r.params.get('size') === '50',
    );
    req.flush({ content: mock });

    await expect(dataP).resolves.toEqual(mock);
  });

  it('getFeeById$ should GET /fee/:id and return data', (done) => {
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
