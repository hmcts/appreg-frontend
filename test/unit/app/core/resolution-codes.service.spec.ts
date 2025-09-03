import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { ResolutionCodes } from '../../../../src/app/core/models/resolution-codes';
import {
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';
import { ResolutionCodesService } from '../../../../src/app/core/services/resolution-codes.service';

describe('CourtLocationsService', () => {
  let service: ResolutionCodesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ResolutionCodesService,
        ErrorBus,
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ResolutionCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllResolutionCodes$ should GET /resolution-codes and return data', async () => {
    const mock: ResolutionCodes[] = [
      {
        rc_id: 1,
        resolution_code: 'ACJ',
        resolution_code_title: 'Adjourned — Court',
        resolution_code_wording:
          'Hearing adjourned by the court to a later date.',
        resolution_legislation: 'Courts Act 2003 s.64',
        rc_destination_email_address_1: 'listoffice@example.gov.uk',
        rc_destination_email_address_2: null,
        resolution_code_start_date: '2023-01-01T00:00:00Z',
        resolution_code_end_date: null,
        version: 1,
        changed_by: 1001,
        changed_date: '2023-01-10',
        user_name: 'jdoe',
      },
      {
        rc_id: 2,
        resolution_code: 'WIT',
        resolution_code_title: 'Withdrawn',
        resolution_code_wording:
          'Application withdrawn by applicant prior to hearing.',
        resolution_legislation: null,
        rc_destination_email_address_1: 'caseadmin@example.gov.uk',
        rc_destination_email_address_2: 'archive@example.gov.uk',
        resolution_code_start_date: '2022-06-15T09:00:00Z',
        resolution_code_end_date: '2024-12-31T23:59:59Z',
        version: 3,
        changed_by: 1002,
        changed_date: '2024-11-20',
        user_name: 'asmith',
      },
      {
        rc_id: 3,
        resolution_code: 'DIS',
        resolution_code_title: 'Dismissed',
        resolution_code_wording: 'Case dismissed due to lack of prosecution.',
        resolution_legislation: 'Criminal Justice Act 2003',
        rc_destination_email_address_1: null,
        rc_destination_email_address_2: null,
        resolution_code_start_date: '2021-03-01T00:00:00Z',
        resolution_code_end_date: null,
        version: 5,
        changed_by: 1010,
        changed_date: '2025-02-01',
        user_name: 'system',
      },
    ];

    const dataP = firstValueFrom(
      service.getAllResolutionCodes$().pipe(take(1)),
    );

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/resolution-codes' &&
        r.params.get('size') === '50',
    );
    req.flush({ content: mock });

    await expect(dataP).resolves.toEqual(mock);
  });

  it('getResolutionCodeById$ should GET /resolution-codes/:id and return data', (done) => {
    const mock: ResolutionCodes = {
      rc_id: 1,
      resolution_code: 'ACJ',
      resolution_code_title: 'Adjourned — Court',
      resolution_code_wording:
        'Hearing adjourned by the court to a later date.',
      resolution_legislation: 'Courts Act 2003 s.64',
      rc_destination_email_address_1: 'listoffice@example.gov.uk',
      rc_destination_email_address_2: null,
      resolution_code_start_date: '2023-01-01T00:00:00Z',
      resolution_code_end_date: null,
      version: 1,
      changed_by: 1001,
      changed_date: '2023-01-10',
      user_name: 'jdoe',
    };

    service
      .getResolutionCodeById$(1)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual(mock);
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url === '/resolution-codes/1',
    );
    req.flush(mock);
  });
});
