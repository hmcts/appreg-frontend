import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { ApplicationCodes } from '../../../../src/app/core/models/application-codes';
import {
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';
import { ApplicationCodesService } from '../../../../src/app/core/services/application-codes.service';

describe('ApplicationCodesService', () => {
  let service: ApplicationCodesService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ApplicationCodesService,
        ErrorBus,
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(ApplicationCodesService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllApplicationCodes$ should GET /application-codes and return data', async () => {
    const mock: ApplicationCodes[] = [
      {
        acId: 1,
        applicationCode: 'ACJ',
        applicationCodeTitle: 'Adjourned — Court',
        applicationCodeWording:
          'Hearing adjourned by the court to a later date.',
        applicationLegislation: 'Courts Act 2003 s.64',
        feeDue: 'N',
        applicationCodeRespondent: 'N',
        acDestinationEmailAddress1: 'listoffice@example.gov.uk',
        acDestinationEmailAddress2: null,
        applicationCodeStartDate: '2023-01-01T00:00:00Z',
        applicationCodeEndDate: null,
        bulkRespondentAllowed: 'N',
        version: 1,
        changedBy: 1001,
        changedDate: '2023-01-10T00:00:00Z',
        userName: 'jdoe',
        acFeeReference: null,
      },
      {
        acId: 2,
        applicationCode: 'WIT',
        applicationCodeTitle: 'Withdrawn',
        applicationCodeWording:
          'Application withdrawn by applicant prior to hearing.',
        applicationLegislation: null,
        feeDue: 'N',
        applicationCodeRespondent: 'Y',
        acDestinationEmailAddress1: 'caseadmin@example.gov.uk',
        acDestinationEmailAddress2: 'archive@example.gov.uk',
        applicationCodeStartDate: '2022-06-15T09:00:00Z',
        applicationCodeEndDate: '2024-12-31T23:59:59Z',
        bulkRespondentAllowed: 'Y',
        version: 3,
        changedBy: 1002,
        changedDate: '2024-11-20T00:00:00Z',
        userName: 'asmith',
        acFeeReference: 'FEE000000001',
      },
      {
        acId: 3,
        applicationCode: 'DIS',
        applicationCodeTitle: 'Dismissed',
        applicationCodeWording: 'Case dismissed due to lack of prosecution.',
        applicationLegislation: 'Criminal Justice Act 2003',
        feeDue: 'Y',
        applicationCodeRespondent: 'N',
        acDestinationEmailAddress1: null,
        acDestinationEmailAddress2: null,
        applicationCodeStartDate: '2021-03-01T00:00:00Z',
        applicationCodeEndDate: null,
        bulkRespondentAllowed: 'N',
        version: 5,
        changedBy: 1010,
        changedDate: '2025-02-01T00:00:00Z',
        userName: 'system',
        acFeeReference: 'FEE000000002',
      },
    ];

    const dataP = firstValueFrom(
      service.getAllApplicationCodes$().pipe(take(1)),
    );

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/application-codes' &&
        r.params.get('size') === '50',
    );
    req.flush({ content: mock });

    await expect(dataP).resolves.toEqual(mock);
  });

  it('getApplicationCodeById$ should GET /application-codes/:id and return data', (done) => {
    const mock: ApplicationCodes = {
      acId: 1,
      applicationCode: 'ACJ',
      applicationCodeTitle: 'Adjourned — Court',
      applicationCodeWording: 'Hearing adjourned by the court to a later date.',
      applicationLegislation: 'Courts Act 2003 s.64',
      feeDue: 'N',
      applicationCodeRespondent: 'N',
      acDestinationEmailAddress1: 'listoffice@example.gov.uk',
      acDestinationEmailAddress2: null,
      applicationCodeStartDate: '2023-01-01T00:00:00Z',
      applicationCodeEndDate: null,
      bulkRespondentAllowed: 'N',
      version: 1,
      changedBy: 1001,
      changedDate: '2023-01-10T00:00:00Z',
      userName: 'jdoe',
      acFeeReference: null,
    };

    service
      .getApplicationCodeById$(1)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual(mock);
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url === '/application-codes/1',
    );
    req.flush(mock);
  });
});
