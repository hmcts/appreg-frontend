import { PLATFORM_ID } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import {
  ApplicationCodePage,
  ApplicationCodesApi,
  CourtLocationPage,
  CourtLocationsApi,
  CriminalJusticeAreaPage,
  CriminalJusticeAreasApi,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';

type Page<T> = {
  pageNumber: number;
  pageSize: number;
  totalElements: number;
  totalPages: number;
  elementsOnPage: number;
  last: boolean;
  content: T[];
};

const makePage = <T>(
  pageNumber: number,
  content: T[],
  last: boolean,
  totalElements = content.length,
): Page<T> => ({
  pageNumber,
  pageSize: 100,
  totalElements,
  totalPages: last ? pageNumber + 1 : pageNumber + 2,
  elementsOnPage: content.length,
  last,
  content,
});

describe('ReferenceDataFacade', () => {
  let getApplicationCodes: jest.Mock;
  let getCourtLocations: jest.Mock;
  let getCriminalJusticeAreas: jest.Mock;

  const setup = (platformId: 'browser' | 'server' = 'browser') => {
    TestBed.configureTestingModule({
      providers: [
        { provide: PLATFORM_ID, useValue: platformId },
        {
          provide: ApplicationCodesApi,
          useValue: { getApplicationCodes },
        },
        {
          provide: CourtLocationsApi,
          useValue: { getCourtLocations },
        },
        {
          provide: CriminalJusticeAreasApi,
          useValue: { getCriminalJusticeAreas },
        },
      ],
    });
  };

  beforeEach(() => {
    getApplicationCodes = jest
      .fn()
      .mockReturnValue(
        of(
          makePage(
            0,
            [{ title: 'Application title' }],
            true,
          ) as unknown as ApplicationCodePage,
        ),
      );
    getCourtLocations = jest
      .fn()
      .mockReturnValue(
        of(
          makePage(
            0,
            [{ locationCode: 'A1', name: 'Alpha Court' }],
            true,
          ) as unknown as CourtLocationPage,
        ),
      );
    getCriminalJusticeAreas = jest
      .fn()
      .mockReturnValue(
        of(
          makePage(
            0,
            [{ code: 'C1', description: 'Area One' }],
            true,
          ) as unknown as CriminalJusticeAreaPage,
        ),
      );
  });

  it('loads the three reference lists on browser startup', fakeAsync(() => {
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    const cjaEmissions: unknown[][] = [];
    const courtEmissions: unknown[][] = [];
    const cjaSubscription = facade.cja$.subscribe((items) =>
      cjaEmissions.push(items),
    );
    const courtSubscription = facade.courtLocations$.subscribe((items) =>
      courtEmissions.push(items),
    );

    tick();

    expect(getCriminalJusticeAreas).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 100,
    });
    expect(getCourtLocations).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 100,
    });
    expect(getApplicationCodes).toHaveBeenCalledWith({
      pageNumber: 0,
      pageSize: 100,
    });
    expect(facade.cja()).toEqual([{ code: 'C1', description: 'Area One' }]);
    expect(facade.courtLocations()).toEqual([
      { locationCode: 'A1', name: 'Alpha Court' },
    ]);
    expect(facade.applicationCodeTitles()).toEqual(['Application title']);
    expect(cjaEmissions.at(-1)).toEqual([
      { code: 'C1', description: 'Area One' },
    ]);
    expect(courtEmissions.at(-1)).toEqual([
      { locationCode: 'A1', name: 'Alpha Court' },
    ]);

    cjaSubscription.unsubscribe();
    courtSubscription.unsubscribe();
  }));

  it('loads every page in order and stops at each final page', fakeAsync(() => {
    getCriminalJusticeAreas.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) =>
        of(
          makePage(
            pageNumber,
            [{ code: `C${pageNumber}`, description: `Area ${pageNumber}` }],
            pageNumber === 1,
            2,
          ) as unknown as CriminalJusticeAreaPage,
        ),
    );
    getCourtLocations.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) =>
        of(
          makePage(
            pageNumber,
            [{ locationCode: `A${pageNumber}`, name: `Court ${pageNumber}` }],
            pageNumber === 1,
            2,
          ) as unknown as CourtLocationPage,
        ),
    );
    getApplicationCodes.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) => {
        const content = Array.from({ length: 100 }, (_, index) => ({
          title: `Title ${pageNumber * 100 + index}`,
        }));
        return of(
          makePage(
            pageNumber,
            content,
            pageNumber === 4,
            500,
          ) as unknown as ApplicationCodePage,
        );
      },
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);

    tick();

    expect(getCriminalJusticeAreas.mock.calls).toEqual([
      [{ pageNumber: 0, pageSize: 100 }],
      [{ pageNumber: 1, pageSize: 100 }],
    ]);
    expect(getCourtLocations.mock.calls).toEqual([
      [{ pageNumber: 0, pageSize: 100 }],
      [{ pageNumber: 1, pageSize: 100 }],
    ]);
    expect(getApplicationCodes.mock.calls).toEqual(
      [0, 1, 2, 3, 4].map((pageNumber) => [{ pageNumber, pageSize: 100 }]),
    );
    expect(facade.cja()).toEqual([
      { code: 'C0', description: 'Area 0' },
      { code: 'C1', description: 'Area 1' },
    ]);
    expect(facade.courtLocations()).toEqual([
      { locationCode: 'A0', name: 'Court 0' },
      { locationCode: 'A1', name: 'Court 1' },
    ]);
    expect(facade.applicationCodeTitles()).toHaveLength(500);
    expect(facade.applicationCodeTitles()[0]).toBe('Title 0');
    expect(facade.applicationCodeTitles()[499]).toBe('Title 499');
  }));

  it.each(['CJA', 'court locations', 'application code titles'] as const)(
    'keeps other resources available when loading %s fails',
    fakeAsync(
      (
        failedResource: 'CJA' | 'court locations' | 'application code titles',
      ) => {
        const failure = throwError(
          () => new Error('Reference data request failed'),
        );
        if (failedResource === 'CJA') {
          getCriminalJusticeAreas.mockReturnValue(failure);
        } else if (failedResource === 'court locations') {
          getCourtLocations.mockReturnValue(failure);
        } else {
          getApplicationCodes.mockReturnValue(failure);
        }
        setup();
        const facade = TestBed.inject(ReferenceDataFacade);

        tick();

        expect(facade.cja()).toEqual(
          failedResource === 'CJA'
            ? []
            : [{ code: 'C1', description: 'Area One' }],
        );
        expect(facade.courtLocations()).toEqual(
          failedResource === 'court locations'
            ? []
            : [{ locationCode: 'A1', name: 'Alpha Court' }],
        );
        expect(facade.applicationCodeTitles()).toEqual(
          failedResource === 'application code titles'
            ? []
            : ['Application title'],
        );
        expect(facade.hasLoadError()).toBe(true);
        expect(facade.hasPlaceLoadError()).toBe(
          failedResource !== 'application code titles',
        );
      },
    ),
  );

  it('returns an empty title list when a later application-code page fails', fakeAsync(() => {
    getApplicationCodes.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) =>
        pageNumber === 0
          ? of(
              makePage(
                0,
                [{ title: 'First page title' }],
                false,
                101,
              ) as unknown as ApplicationCodePage,
            )
          : throwError(() => new Error('Second application-code page failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);

    tick();

    expect(getApplicationCodes.mock.calls).toEqual([
      [{ pageNumber: 0, pageSize: 100 }],
      [{ pageNumber: 1, pageSize: 100 }],
    ]);
    expect(facade.applicationCodeTitles()).toEqual([]);
    expect(facade.hasLoadError()).toBe(true);
    expect(facade.hasPlaceLoadError()).toBe(false);
  }));

  it('clears the load error after a successful refresh', fakeAsync(() => {
    getCourtLocations.mockReturnValueOnce(
      throwError(() => new Error('Court locations failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    expect(facade.hasLoadError()).toBe(true);
    expect(facade.hasPlaceLoadError()).toBe(true);
    expect(facade.courtLocations()).toEqual([]);

    facade.refresh();
    tick();

    expect(facade.hasLoadError()).toBe(false);
    expect(facade.hasPlaceLoadError()).toBe(false);
    expect(facade.courtLocations()).toEqual([
      { locationCode: 'A1', name: 'Alpha Court' },
    ]);
  }));

  it('reloads all three resources when refreshed', fakeAsync(() => {
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    expect(getCriminalJusticeAreas).toHaveBeenCalledTimes(1);
    expect(getCourtLocations).toHaveBeenCalledTimes(1);
    expect(getApplicationCodes).toHaveBeenCalledTimes(1);

    facade.refresh();
    tick();

    expect(getCriminalJusticeAreas).toHaveBeenCalledTimes(2);
    expect(getCourtLocations).toHaveBeenCalledTimes(2);
    expect(getApplicationCodes).toHaveBeenCalledTimes(2);
  }));

  it('does not request reference data during server-side rendering', fakeAsync(() => {
    setup('server');
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    expect(getCriminalJusticeAreas).not.toHaveBeenCalled();
    expect(getCourtLocations).not.toHaveBeenCalled();
    expect(getApplicationCodes).not.toHaveBeenCalled();
    expect(facade.cja()).toEqual([]);
    expect(facade.courtLocations()).toEqual([]);
    expect(facade.applicationCodeTitles()).toEqual([]);
    expect(facade.hasLoadError()).toBe(false);
  }));
});
