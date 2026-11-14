import { PLATFORM_ID, effect } from '@angular/core';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';

import {
  ApplicationCodeGetSummaryDto,
  ApplicationCodePage,
  ApplicationCodesApi,
  CourtLocationPage,
  CourtLocationsApi,
  CriminalJusticeAreaPage,
  CriminalJusticeAreasApi,
  ResultCodeGetSummaryDto,
  ResultCodePage,
  ResultCodesApi,
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

const makeApplicationCode = (
  applicationCode: string,
  title: string,
): ApplicationCodeGetSummaryDto => ({
  applicationCode,
  title,
  wording: { template: 'Synthetic wording' },
  isFeeDue: false,
  requiresRespondent: false,
  bulkRespondentAllowed: false,
});

const makeResultCodesPage = (
  pageNumber: number,
  content: ResultCodeGetSummaryDto[],
  last: boolean,
  totalElements = content.length,
): ResultCodePage => makePage(pageNumber, content, last, totalElements);

describe('ReferenceDataFacade', () => {
  let getApplicationCodes: jest.Mock;
  let getCourtLocations: jest.Mock;
  let getCriminalJusticeAreas: jest.Mock;
  let getResultCodes: jest.Mock;

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
        {
          provide: ResultCodesApi,
          useValue: { getResultCodes },
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
            [makeApplicationCode('AC001', 'Application title')],
            true,
          ) as ApplicationCodePage,
        ),
      );
    getCourtLocations = jest
      .fn()
      .mockReturnValue(
        of(
          makePage(
            0,
            [{ courtId: 1, locationCode: 'A1', name: 'Alpha Court' }],
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
    getResultCodes = jest
      .fn()
      .mockReturnValue(
        of(
          makeResultCodesPage(
            0,
            [{ resultCode: 'RC1', title: 'Granted' }],
            true,
          ),
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
      { courtId: 1, locationCode: 'A1', name: 'Alpha Court' },
    ]);
    expect(facade.applicationCodeTitles()).toEqual(['Application title']);
    expect(cjaEmissions.at(-1)).toEqual([
      { code: 'C1', description: 'Area One' },
    ]);
    expect(courtEmissions.at(-1)).toEqual([
      { courtId: 1, locationCode: 'A1', name: 'Alpha Court' },
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
            [
              {
                courtId: pageNumber + 1,
                locationCode: `A${pageNumber}`,
                name: `Court ${pageNumber}`,
              },
            ],
            pageNumber === 1,
            2,
          ) as unknown as CourtLocationPage,
        ),
    );
    getApplicationCodes.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) => {
        const content = Array.from({ length: 100 }, (_, index) =>
          makeApplicationCode(
            `AC${pageNumber * 100 + index}`,
            `Title ${pageNumber * 100 + index}`,
          ),
        );
        return of(
          makePage(
            pageNumber,
            content,
            pageNumber === 4,
            500,
          ) as ApplicationCodePage,
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
      { courtId: 1, locationCode: 'A0', name: 'Court 0' },
      { courtId: 2, locationCode: 'A1', name: 'Court 1' },
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
            : [{ courtId: 1, locationCode: 'A1', name: 'Alpha Court' }],
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
                [makeApplicationCode('AC001', 'First page title')],
                false,
                101,
              ) as ApplicationCodePage,
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
      { courtId: 1, locationCode: 'A1', name: 'Alpha Court' },
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
    expect(getResultCodes).not.toHaveBeenCalled();
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

  it('keeps the code and title of each application code and derives the titles', fakeAsync(() => {
    getApplicationCodes.mockReturnValue(
      of(
        makePage(
          0,
          [
            makeApplicationCode('AC001', 'Synthetic application one'),
            makeApplicationCode('AC002', 'Synthetic application two'),
            makeApplicationCode('AC003', 'Synthetic application one'),
          ],
          true,
        ) as ApplicationCodePage,
      ),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);

    tick();

    expect(
      facade
        .applicationCodes()
        .map(({ applicationCode, title }) => ({ applicationCode, title })),
    ).toEqual([
      { applicationCode: 'AC001', title: 'Synthetic application one' },
      { applicationCode: 'AC002', title: 'Synthetic application two' },
      { applicationCode: 'AC003', title: 'Synthetic application one' },
    ]);
    expect(facade.applicationCodeTitles()).toEqual([
      'Synthetic application one',
      'Synthetic application two',
      'Synthetic application one',
    ]);
  }));

  it('returns empty application codes without an error when the first page is empty', fakeAsync(() => {
    getApplicationCodes.mockReturnValue(
      of(makePage(0, [], true) as ApplicationCodePage),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);

    tick();

    expect(facade.applicationCodes()).toEqual([]);
    expect(facade.applicationCodeTitles()).toEqual([]);
    expect(facade.hasLoadError()).toBe(false);
  }));

  it('does not request result codes until a page asks for them', fakeAsync(() => {
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);

    tick();

    expect(getResultCodes).not.toHaveBeenCalled();
    expect(facade.resultCodes()).toEqual([]);
    expect(facade.resultCodesLoading()).toBe(false);
    expect(facade.resultCodesLoadError()).toBe(false);
  }));

  it('loads every result-code page when ensureResultCodes is called', fakeAsync(() => {
    getResultCodes.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) =>
        of(
          makeResultCodesPage(
            pageNumber,
            Array.from({ length: 100 }, (_, index) => ({
              resultCode: `RC${pageNumber * 100 + index}`,
              title: `Result ${pageNumber * 100 + index}`,
            })),
            pageNumber === 2,
            300,
          ),
        ),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    facade.ensureResultCodes();
    tick();

    expect(getResultCodes.mock.calls).toEqual(
      [0, 1, 2].map((pageNumber) => [{ pageNumber, pageSize: 100 }]),
    );
    expect(facade.resultCodes()).toHaveLength(300);
    expect(facade.resultCodes()[0]).toEqual({
      resultCode: 'RC0',
      title: 'Result 0',
    });
    expect(facade.resultCodes()[299]).toEqual({
      resultCode: 'RC299',
      title: 'Result 299',
    });
    expect(facade.resultCodesLoading()).toBe(false);
    expect(facade.hasLoadError()).toBe(false);
  }));

  it('makes one result-code request while loading and none after a successful load', fakeAsync(() => {
    const firstPage$ = new Subject<ResultCodePage>();
    getResultCodes.mockReturnValue(firstPage$);
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    facade.ensureResultCodes();
    tick();
    facade.ensureResultCodes();
    tick();

    expect(getResultCodes).toHaveBeenCalledTimes(1);
    expect(facade.resultCodesLoading()).toBe(true);

    firstPage$.next(
      makeResultCodesPage(0, [{ resultCode: 'RC1', title: 'Granted' }], true),
    );
    firstPage$.complete();
    tick();

    expect(facade.resultCodesLoading()).toBe(false);
    expect(facade.resultCodes()).toEqual([
      { resultCode: 'RC1', title: 'Granted' },
    ]);

    facade.ensureResultCodes();
    tick();

    expect(getResultCodes).toHaveBeenCalledTimes(1);
  }));

  it('sets hasLoadError and empties the result codes when a result-code page fails', fakeAsync(() => {
    getResultCodes.mockImplementation(
      ({ pageNumber = 0 }: { pageNumber?: number }) =>
        pageNumber === 0
          ? of(
              makeResultCodesPage(
                0,
                [{ resultCode: 'RC1', title: 'Granted' }],
                false,
                101,
              ),
            )
          : throwError(() => new Error('Second result-code page failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    facade.ensureResultCodes();
    tick();

    expect(facade.resultCodes()).toEqual([]);
    expect(facade.resultCodesLoading()).toBe(false);
    expect(facade.resultCodesLoadError()).toBe(true);
    expect(facade.hasLoadError()).toBe(true);
    expect(facade.hasPlaceLoadError()).toBe(false);
    expect(facade.cja()).toEqual([{ code: 'C1', description: 'Area One' }]);
  }));

  it('retries result codes when ensureResultCodes is called after a failure', fakeAsync(() => {
    getResultCodes.mockReturnValueOnce(
      throwError(() => new Error('Result codes failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();
    facade.ensureResultCodes();
    tick();

    expect(facade.resultCodesLoadError()).toBe(true);

    facade.ensureResultCodes();
    tick();

    expect(getResultCodes).toHaveBeenCalledTimes(2);
    expect(facade.resultCodes()).toEqual([
      { resultCode: 'RC1', title: 'Granted' },
    ]);
    expect(facade.resultCodesLoadError()).toBe(false);
    expect(facade.hasLoadError()).toBe(false);
  }));

  it('retries result codes on refresh once they have been requested', fakeAsync(() => {
    getResultCodes.mockReturnValueOnce(
      throwError(() => new Error('Result codes failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();
    facade.ensureResultCodes();
    tick();

    expect(facade.hasLoadError()).toBe(true);

    facade.refresh();
    tick();

    expect(getResultCodes).toHaveBeenCalledTimes(2);
    expect(facade.resultCodes()).toEqual([
      { resultCode: 'RC1', title: 'Granted' },
    ]);
    expect(facade.hasLoadError()).toBe(false);
  }));

  it('does not retry result codes on its own when called from an effect after a failure', fakeAsync(() => {
    getResultCodes.mockReturnValueOnce(
      throwError(() => new Error('Result codes failed')),
    );
    setup();
    const facade = TestBed.inject(ReferenceDataFacade);
    tick();

    TestBed.runInInjectionContext(() =>
      effect(() => facade.ensureResultCodes()),
    );
    TestBed.tick();
    tick();
    TestBed.tick();
    tick();

    expect(getResultCodes).toHaveBeenCalledTimes(1);
    expect(facade.resultCodesLoadError()).toBe(true);
  }));

  it('does not request result codes during server-side rendering', fakeAsync(() => {
    setup('server');
    const facade = TestBed.inject(ReferenceDataFacade);

    facade.ensureResultCodes();
    tick();
    facade.refresh();
    tick();

    expect(getResultCodes).not.toHaveBeenCalled();
    expect(facade.resultCodes()).toEqual([]);
    expect(facade.resultCodesLoading()).toBe(false);
    expect(facade.hasLoadError()).toBe(false);
  }));
});
