import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { API_BASE_URL } from '../../../../src/app/api-base-url.token';
import { CourtHouse } from '../../../../src/app/core/models/court-house';
import { CourthouseService } from '../../../../src/app/core/services/court-locations.service';

describe('CourtLocationsService', () => {
  let service: CourthouseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CourthouseService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '' }, // base URL
      ],
    });
    service = TestBed.inject(CourthouseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllCourtLocations$ should GET /court-locations and return data', (done) => {
    const mock: CourtHouse[] = [
      {
        id: 1,
        name: 'court 1',
        welshName: '',
        courtType: 'court type',
        courtLocationCode: 'acode',
        addressLines: ['line 1', 'line 2'],
        postcode: 'AB1 2CD',
        telephoneNo: 1234567890,
        startDate: '2023/01/01',
        endDate: '2023/12/31',
      },
      {
        id: 2,
        name: 'court 2',
        welshName: '',
        courtType: 'court type',
        courtLocationCode: 'acode',
        addressLines: ['line 1', 'line 2'],
        postcode: 'AB1 2CD',
        telephoneNo: 1234567890,
        startDate: '2023/01/01',
        endDate: '2023/12/31',
      },
    ];

    service
      .getAllCourtLocations$()
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual(mock);
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  it('getCourtLocationById$ should GET /court-locations/:id and return data', (done) => {
    const mock: CourtHouse = {
      id: 20,
      name: 'court 1',
      welshName: '',
      courtType: 'court type',
      courtLocationCode: 'acode',
      addressLines: ['line 1', 'line 2'],
      postcode: 'AB1 2CD',
      telephoneNo: 1234567890,
      startDate: '2023/01/01',
      endDate: '2023/12/31',
    };

    service
      .getCourtLocationById$(20)
      .pipe(take(1))
      .subscribe({
        next: (data) => {
          expect(data).toEqual(mock);
          done();
        },
        error: done,
      });

    const req = httpMock.expectOne('/court-locations/7');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
  });

  // 404
  it('on 404, getCourtLocationById$ returns null and emits error$', async () => {
    const dataP = firstValueFrom(
      service.getCourtLocationById$(9999999).pipe(take(1)),
    );
    const errP = firstValueFrom(service.error$.pipe(take(1)));

    const req = httpMock.expectOne('/court-locations/9999999');
    expect(req.request.method).toBe('GET');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toBeNull();
    expect(msg).toMatch(/court location not found/i);
  });

  // 0
  it('on network error (0), getAllCourtLocations$ returns [] and emits error$', async () => {
    const dataP = firstValueFrom(service.getAllCourtLocations$().pipe(take(1)));
    const errP = firstValueFrom(service.error$.pipe(take(1)));

    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error',
    });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toEqual([]);
    // match the actual message your service returns
    expect(msg).toMatch(
      /Unable to load court location. Please try again later/i,
    );
  });

  // 500
  it('on 500, getAllCourtLocations$ returns [] and emits error$', async () => {
    const dataP = firstValueFrom(service.getAllCourtLocations$().pipe(take(1)));
    const errP = firstValueFrom(service.error$.pipe(take(1)));

    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toEqual([]);
    expect(msg).toMatch(/Server error./i);
  });
});
