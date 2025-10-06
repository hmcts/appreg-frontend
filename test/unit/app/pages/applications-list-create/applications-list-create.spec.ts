import { NO_ERRORS_SCHEMA, PLATFORM_ID, TransferState } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { ApplicationsListCreate } from '../../../../../src/app/pages/applications-list-create/applications-list-create';
import {
  ApplicationListsApi,
  CourtLocationsApi,
  CriminalJusticeAreasApi,
} from '../../../../../src/generated/openapi';

describe('ApplicationsListCreate', () => {
  let fixture: ComponentFixture<ApplicationsListCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListCreate],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: 'browser' },
        TransferState,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { data: { nationalCourtHouses: [] } },
            params: of({}),
            queryParams: of({}),
          },
        },
      ],
      schemas: [NO_ERRORS_SCHEMA],
    })
      // Avoid HttpClient by stubbing OpenAPI services with plain objects
      .overrideProvider(ApplicationListsApi, {
        useValue: { createApplicationList: () => of({ id: 123 }) },
      })
      .overrideProvider(CourtLocationsApi, {
        useValue: {
          getCourtLocations: () =>
            of({
              content: [],
              pageNumber: 0,
              pageSize: 0,
              totalElements: 0,
              elementsOnPage: 0,
            }),
        },
      })
      .overrideProvider(CriminalJusticeAreasApi, {
        useValue: {
          getCriminalJusticeAreas: () =>
            of({
              content: [],
              pageNumber: 0,
              pageSize: 0,
              totalElements: 0,
              elementsOnPage: 0,
            }),
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(ApplicationsListCreate);
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });
});
