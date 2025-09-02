import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { CourtHouse } from '../../../../src/app/core/models/court-house';
import {
  API_BASE_URL,
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';
import { CourthouseService } from '../../../../src/app/core/services/court-locations.service';

describe('CourtLocationsService', () => {
  let service: CourthouseService;
  let httpMock: HttpTestingController;
  let bus: ErrorBus;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        CourthouseService,
        ErrorBus,
        { provide: API_BASE_URL, useValue: '' },
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(CourthouseService);
    httpMock = TestBed.inject(HttpTestingController);
    bus = TestBed.inject(ErrorBus);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllCourtLocations$ should GET /national-court-houses and return data', async () => {
    const mock: CourtHouse[] = [
      {
        id: 1,
        name: 'court 1',
        welshName: '',
        courtType: 'court type',
        courtLocationCode: 'acode',
        startDate: '2023/01/01',
        endDate: '2023/12/31',
      },
      {
        id: 2,
        name: 'court 2',
        welshName: '',
        courtType: 'court type',
        courtLocationCode: 'acode',
        startDate: '2023/01/01',
        endDate: '2023/12/31',
      },
    ];

    const dataP = firstValueFrom(service.getAllCourtLocations$().pipe(take(1)));

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/national-court-houses' &&
        r.params.get('size') === '50',
    );
    req.flush({ content: mock });

    await expect(dataP).resolves.toEqual(mock);
  });

  it('getCourtLocationById$ should GET /national-court-houses/:id and return data', (done) => {
    const mock: CourtHouse = {
      id: 20,
      name: 'court 1',
      welshName: '',
      courtType: 'court type',
      courtLocationCode: 'acode',
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

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url === '/national-court-houses/20',
    );
    req.flush(mock);
  });

  it('on 404, getCourtLocationById$ returns null and emits error$', async () => {
    const dataP = firstValueFrom(
      service.getCourtLocationById$(9999999).pipe(take(1)),
    );
    const errP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne(
      (r) => r.method === 'GET' && r.url === '/national-court-houses/9999999',
    );
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toBeNull();
    expect(msg).toMatch(/Court location not found/i);
  });

  it('on network error (0), getAllCourtLocations$ returns [] and emits error$', async () => {
    const dataP = firstValueFrom(service.getAllCourtLocations$().pipe(take(1)));
    const errP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/national-court-houses' &&
        r.params.get('size') === '50',
    );
    req.error(new ProgressEvent('error'), {
      status: 0,
      statusText: 'Unknown Error',
    });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toEqual([]);
    expect(msg).toMatch(/Unable to load court location. Please try again later/i);
  });

  it('on 500, getAllCourtLocations$ returns [] and emits error$', async () => {
    const dataP = firstValueFrom(service.getAllCourtLocations$().pipe(take(1)));
    const errP = firstValueFrom(bus.error$.pipe(take(1)));

    const req = httpMock.expectOne(
      (r) =>
        r.method === 'GET' &&
        r.url === '/national-court-houses' &&
        r.params.get('size') === '50',
    );
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    const [data, msg] = await Promise.all([dataP, errP]);
    expect(data).toEqual([]);
    expect(msg).toMatch(/Server error/i);
  });
});
