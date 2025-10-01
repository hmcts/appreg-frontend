import { PLATFORM_ID, TransferState } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApplicationsListCreate } from '../../../../../src/app/pages/applications-list-create/applications-list-create';
import {
  CourtLocationPage,
  CourtLocationsApi,
  CriminalJusticeAreaPage,
  CriminalJusticeAreasApi,
} from '../../../../../src/generated/openapi';

class CourtLocationsApiStub {
  getCourtLocations(..._args: unknown[]) {
    void _args;
    const page: CourtLocationPage = {
      content: [],
      pageNumber: 0,
      pageSize: 0,
      totalElements: 0,
      elementsOnPage: 0,
    };
    return of(page);
  }
}
class CriminalJusticeAreasApiStub {
  getCriminalJusticeAreas(..._args: unknown[]) {
    void _args;
    const page: CriminalJusticeAreaPage = {
      content: [],
      pageNumber: 0,
      pageSize: 0,
      totalElements: 0,
      elementsOnPage: 0,
    };
    return of(page);
  }
}

const activatedRouteStub = {
  snapshot: { data: { nationalCourtHouses: [] } },
  params: of({}),
  queryParams: of({}),
};

beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [ApplicationsListCreate],
    providers: [
      provideRouter([]),
      { provide: ActivatedRoute, useValue: activatedRouteStub },
      TransferState,
      { provide: PLATFORM_ID, useValue: 'browser' },
      { provide: CourtLocationsApi, useClass: CourtLocationsApiStub },
      {
        provide: CriminalJusticeAreasApi,
        useClass: CriminalJusticeAreasApiStub,
      },
    ],
  }).compileComponents();
});

it('should create', () => {
  const fixture = TestBed.createComponent(ApplicationsListCreate);
  expect(fixture.componentInstance).toBeTruthy();
});
