import { provideHttpClient, withInterceptors } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { take } from 'rxjs/operators';

import { NationalCourtHouse } from '../../../../src/app/core/models/national-court-house';
import {
  ErrorBus,
  apiInterceptor,
} from '../../../../src/app/core/services/api-client.service';
import { NationalCourtHouseService } from '../../../../src/app/core/services/national-court-houses.service';

describe('CourtLocationsService', () => {
  let service: NationalCourtHouseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        NationalCourtHouseService,
        ErrorBus,
        provideHttpClient(withInterceptors([apiInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(NationalCourtHouseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('getAllCourtLocations$ should GET /national-court-houses and return data', async () => {
    const mock: NationalCourtHouse[] = [
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
    const mock: NationalCourtHouse = {
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
});
