import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

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

  it('getAllCourtLocations() should GET /court-locations and return data', async () => {
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

    const promise = service.getAllCourtLocations();
    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
    const data = await promise;
    expect(data).toEqual(mock);
  });

  it('getCourtLocationById() should GET /court-locations/:id and return data', async () => {
    const mock: CourtHouse = {
      id: 7,
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

    const promise = service.getCourtLocationById(7);
    const req = httpMock.expectOne('/court-locations/7');
    expect(req.request.method).toBe('GET');
    req.flush(mock);
    const data = await promise;
    expect(data).toEqual(mock);
  });

  it('maps 404 for getCourtLocationById', async () => {
    const promise = service.getCourtLocationById(9999999);
    const req = httpMock.expectOne('/court-locations/9999999');
    expect(req.request.method).toBe('GET');
    req.flush('Not found', { status: 404, statusText: 'Not Found' });

    await expect(promise).rejects.toMatchObject({
      status: 404,
      message: {
        error: 'Court location not found',
        status: 404,
        message: expect.any(String),
      },
    });
  });

  it('should map network error (status 0) for getAllCourtLocations()', async () => {
    const promise = service.getAllCourtLocations();
    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.flush('Unknown Error', { status: 0, statusText: 'Unknown Error' });

    await expect(promise).rejects.toMatchObject({
      status: 0,
      message: {
        error: 'Unable to load court location. Please try again later',
        status: 0,
        message: expect.any(String),
      },
    });
  });

  it('maps 500 error for getAllCourtLocations', async () => {
    const promise = service.getAllCourtLocations();
    const req = httpMock.expectOne('/court-locations');
    expect(req.request.method).toBe('GET');
    req.flush('Server error', { status: 500, statusText: 'Server Error' });

    await expect(promise).rejects.toMatchObject({
      status: 500,
      message: {
        error: 'Server error',
        status: 500,
        message: expect.any(String),
      },
    });
  });
});
