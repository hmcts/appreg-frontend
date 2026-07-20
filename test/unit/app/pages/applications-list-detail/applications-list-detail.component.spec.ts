import {
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { ApplicationsListDetail } from '@components/applications-list-detail/applications-list-detail.component';
import { ApplicationsListDetailState } from '@components/applications-list-detail/util/applications-list-detail.state';
import {
  getResultCodes,
  joinResultCodes,
  mapEntrySummaryRows,
} from '@components/applications-list-detail/util/map-entry-summary-rows';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { PdfService } from '@core/services/pdf.service';
import { Row } from '@core-types/table/row.types';
import {
  Applicant,
  ApplicationListEntriesApi,
  ApplicationListGetDetailDto,
  ApplicationListGetPrintDto,
  ApplicationListStatus,
  ApplicationListsApi,
  BulkActionPreviewResponseDto,
  BulkActionSelectionType,
  BulkActionType,
  CriminalJusticeAreaGetDto,
  EntryGetSummaryDto,
  EntryIdsDto,
  EntryPage,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { getProblemText } from '@util/http-error-to-text';
import { MojButtonMenu } from '@util/moj-button-menu';
import { formatPersonName } from '@util/string-helpers';

const flushSignalEffects = async (
  fixture?: ComponentFixture<ApplicationsListDetail>,
): Promise<void> => {
  if (fixture) {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await Promise.resolve();
    fixture.detectChanges();
    return;
  }
  await Promise.resolve();
};

type DetailSignalStateAccessor = {
  detailSignalState: {
    patch: (p: Partial<ApplicationsListDetailState>) => void;
  };
};

type PrintRequestSignalAccessor = {
  printRequest: {
    set: (value: { id: string; mode: 'page' | 'continuous' } | null) => void;
  };
};

type PlaceFieldsStatePatch = {
  cjaSearch?: string | null;
  cja?: CriminalJusticeAreaGetDto[];
};

type PlaceFieldsSignalStateAccessor = {
  signalState: { patch: (p: Partial<PlaceFieldsStatePatch>) => void };
};

type PrintHelpersAccessor = {
  filterEntriesToPrint(
    dto: ApplicationListGetPrintDto,
  ): Promise<ApplicationListGetPrintDto | undefined>;
  handlePrintPage(dto: ApplicationListGetPrintDto): Promise<void>;
  handlePrintContinuous(dto: ApplicationListGetPrintDto): Promise<void>;
};

type BulkPreviewAccessor = {
  getBulkPreview(
    action: BulkActionType,
  ): Promise<BulkActionPreviewResponseDto | null>;
};

describe('ApplicationsListDetail', () => {
  let fixture: ComponentFixture<ApplicationsListDetail>;
  let component: ApplicationsListDetail;

  const apiStub: jest.Mocked<
    Pick<
      ApplicationListsApi,
      'getApplicationList' | 'updateApplicationList' | 'printApplicationList'
    >
  > = {
    getApplicationList: jest.fn(),
    updateApplicationList: jest.fn(),
    printApplicationList: jest.fn(),
  };

  const entriesApiStub: jest.Mocked<
    Pick<
      ApplicationListEntriesApi,
      | 'getApplicationListEntries'
      | 'getApplicationListEntryIds'
      | 'getBulkResultApplicationListEntriesByJobId'
      | 'applicationListEntryBulkActionPreview'
    >
  > = {
    getApplicationListEntries: jest.fn(),
    getApplicationListEntryIds: jest.fn(),
    getBulkResultApplicationListEntriesByJobId: jest.fn(),
    applicationListEntryBulkActionPreview: jest.fn(),
  };

  const menuStub: jest.Mocked<Pick<MojButtonMenu, 'initAll'>> = {
    initAll: jest.fn(),
  };

  const pdfStub: jest.Mocked<
    Pick<
      PdfService,
      | 'generatePagedApplicationListPdf'
      | 'generateContinuousApplicationListsPdf'
    >
  > = {
    generatePagedApplicationListPdf: jest.fn(),
    generateContinuousApplicationListsPdf: jest.fn(),
  };

  const refFacadeStub: Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'> = {
    courtLocations$: of([]),
    cja$: of([] as CriminalJusticeAreaGetDto[]),
  };

  let historyStateSpy: jest.SpyInstance;

  const vm = () => component.vm();

  const patchDetailState = (p: Partial<ApplicationsListDetailState>): void => {
    (component as unknown as DetailSignalStateAccessor).detailSignalState.patch(
      p,
    );
  };

  const patchPlaceFieldsState = (p: Partial<PlaceFieldsStatePatch>): void => {
    (component as unknown as PlaceFieldsSignalStateAccessor).signalState.patch(
      p,
    );
  };

  beforeEach(async () => {
    const row = {
      id: 'id-1',
      location: 'LOC1',
      description: '',
      status: 'OPEN' as const,
    };

    historyStateSpy = jest
      .spyOn(globalThis.history, 'state', 'get')
      .mockReturnValue({ row });

    const dto = {
      entriesCount: 0,
    } as unknown as ApplicationListGetDetailDto;

    apiStub.getApplicationList.mockReturnValue(
      of(
        new HttpResponse<ApplicationListGetDetailDto>({
          status: 200,
          body: dto,
          headers: new HttpHeaders({ ETag: '"etag-v1"' }),
        }),
      ),
    );

    apiStub.printApplicationList.mockReturnValue(
      of({
        entries: [{ id: 'entry-1' }, { id: 'entry-2' }],
      } as ApplicationListGetPrintDto) as unknown as ReturnType<
        ApplicationListsApi['printApplicationList']
      >,
    );

    const respondent: Applicant = {
      organisation: {
        name: 'Acme',
        contactDetails: {
          addressLine1: '123 Street',
          addressLine2: null,
          addressLine3: null,
          addressLine4: null,
          addressLine5: null,
          postcode: 'AB12 3CD',
          phone: null,
          mobile: null,
          email: null,
        },
      },
    };

    const entry: EntryGetSummaryDto = {
      id: 'abc',
      sequenceNumber: 7,
      accountNumber: '',
      applicant: undefined,
      respondent,
      applicationTitle: 'Land Registry Appeal',
      isFeeRequired: true,
      isResulted: false,
      status: ApplicationListStatus.OPEN,
    };

    const entriesPage: EntryPage = {
      pageNumber: 1,
      pageSize: 10,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      elementsOnPage: 1,
      sort: { orders: [] },
      content: [entry],
    };

    entriesApiStub.getApplicationListEntries.mockReturnValue(
      of(
        new HttpResponse<EntryPage>({
          status: 200,
          body: entriesPage,
          headers: new HttpHeaders(),
        }),
      ),
    );
    entriesApiStub.getApplicationListEntryIds.mockReturnValue(
      of({
        ids: ['abc'],
      } as EntryIdsDto) as unknown as ReturnType<
        ApplicationListEntriesApi['getApplicationListEntryIds']
      >,
    );

    await TestBed.configureTestingModule({
      imports: [ApplicationsListDetail],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: ApplicationListsApi, useValue: apiStub },
        { provide: ApplicationListEntriesApi, useValue: entriesApiStub },
        { provide: MojButtonMenu, useValue: menuStub },
        { provide: PdfService, useValue: pdfStub },
        { provide: ReferenceDataFacade, useValue: refFacadeStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListDetail);
    component = fixture.componentInstance;

    fixture.detectChanges();
    await flushSignalEffects(fixture);
  });

  afterEach(() => {
    historyStateSpy?.mockRestore();
    jest.clearAllMocks();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders tabs with correct selection', () => {
    const appsTab = fixture.debugElement.query(By.css('#tab_applications'));
    const detailsTab = fixture.debugElement.query(By.css('#tab_list-details'));

    expect(appsTab).toBeTruthy();
    expect(detailsTab).toBeTruthy();

    expect(appsTab.nativeElement.getAttribute('aria-selected')).toBe('true');
    expect(detailsTab.nativeElement.getAttribute('aria-selected')).toBe(
      'false',
    );
  });

  it('shows success banner when updateDone is true', async () => {
    patchDetailState({ updateDone: true });
    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-success-banner')),
    ).toBeTruthy();
  });

  it('shows error summary when errorSummary has items', async () => {
    patchDetailState({
      errorSummary: [{ href: '#x', text: 'Error' }],
      updateInvalid: true,
      errorHint: 'There is a problem',
    });

    await flushSignalEffects(fixture);

    expect(
      fixture.debugElement.query(By.css('app-error-summary')),
    ).toBeTruthy();
  });

  it('disables Other location when Court is chosen (PlaceFieldsBase disabler)', () => {
    component.form.controls.court.setValue('LOC123');
    fixture.detectChanges();

    expect(component.form.controls.location.disabled).toBe(true);

    const otherLoc = fixture.debugElement.query(
      By.css('app-text-input[formControlName="location"]'),
    );
    if (otherLoc?.componentInstance) {
      expect(otherLoc.componentInstance.disabledState?.()).toBe(true);
    }
  });

  it('resetErrorSummary patches detailSignalState with default values', () => {
    const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');

    component['resetErrorSummary']();

    expect(patchSpy).toHaveBeenCalledWith({
      errorSummary: [],
      errorHint: '',
      preserveErrorSummaryOnLoad: false,
      updateInvalid: false,
    });
  });

  describe('mapEntrySummaryRows', () => {
    it('maps the API shape into selected rows', () => {
      const dto = [
        {
          id: 'entry-1',
          sequenceNumber: 42,
          accountNumber: 'ACC-123',
          applicant: {
            organisation: {
              name: 'Applicant Org',
              contactDetails: {
                postcode: 'AA1 1AA',
              },
            },
          },
          respondent: {
            organisation: {
              name: 'Respondent Org',
              contactDetails: {
                postcode: 'BB2 2BB',
              },
            },
          },
          applicationTitle: 'Some application title',
          isFeeRequired: true,
          resulted: [
            {
              resultCode: 'COST',
              title: 'Costs granted',
            },
          ],
        },
      ] as unknown as EntryGetSummaryDto[];

      const result = mapEntrySummaryRows(dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'entry-1',
        sequenceNumber: 42,
        accountNumber: 'ACC-123',
        applicant: 'Applicant Org',
        respondent: 'Respondent Org',
        postCode: 'BB2 2BB',
        title: 'Some application title',
        feeReq: 'Yes',
        resulted: 'COST',
      });
    });

    it('uses person names when person data exists', () => {
      const dto = [
        {
          id: 'entry-2',
          sequenceNumber: 7,
          accountNumber: null,
          applicant: {
            person: {
              name: {
                lastName: 'Brown',
                firstName: 'Alex',
                middleName: 'J',
                title: 'Mr',
              },
            },
          },
          respondent: {
            person: {
              name: {
                lastName: 'Green',
                firstName: 'Sam',
                title: null,
              },
              contactDetails: {
                postcode: 'CC3 3CC',
              },
            },
          },
          applicationTitle: 'Another title',
          isFeeRequired: false,
          resulted: [
            {
              resultCode: 'COST',
              title: 'Costs granted',
            },
          ],
        },
      ] as unknown as EntryGetSummaryDto[];

      const result = mapEntrySummaryRows(dto);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: 'entry-2',
        sequenceNumber: 7,
        accountNumber: '',
        applicant: 'Alex Brown',
        respondent: 'Sam Green',
        postCode: 'CC3 3CC',
        title: 'Another title',
        feeReq: 'No',
        resulted: 'COST',
      });
    });
  });

  describe('result code helpers', () => {
    it('getResultCodes returns all codes when resulted is a string array', () => {
      const entry = {
        id: 'entry-1',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: ['COST', 'ADJ'],
      } as unknown as EntryGetSummaryDto;

      expect(getResultCodes(entry)).toEqual(['COST', 'ADJ']);
    });

    it('getResultCodes returns all codes when resulted is an object array', () => {
      const entry = {
        id: 'entry-1b',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: [
          { resultCode: 'COST', title: 'Costs granted' },
          { resultCode: 'ADJ', title: 'Adjourned' },
        ],
      } as unknown as EntryGetSummaryDto;

      expect(getResultCodes(entry)).toEqual(['COST', 'ADJ']);
    });

    it('getResultCodes returns a single-item array for the legacy result object shape', () => {
      const entry = {
        id: 'entry-2',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: true,
        status: ApplicationListStatus.OPEN,
        resulted: [
          {
            resultCode: 'COST',
            title: 'Costs granted',
          },
        ],
      } as unknown as EntryGetSummaryDto;

      expect(getResultCodes(entry)).toEqual(['COST']);
    });

    it('getResultCodes returns an empty array when no result code is present', () => {
      const entry = {
        id: 'entry-3',
        applicationTitle: 'Title',
        isFeeRequired: false,
        isResulted: false,
        status: ApplicationListStatus.OPEN,
      } as EntryGetSummaryDto;

      expect(getResultCodes(entry)).toEqual([]);
    });

    it('joinResultCodes joins trimmed codes and ignores blank values', () => {
      expect(joinResultCodes([' COST ', '', '  ', 'ADJ'])).toBe('COST, ADJ');
    });
  });

  describe('filterEntriesToPrint', () => {
    const printHelpers = (): PrintHelpersAccessor =>
      component as unknown as PrintHelpersAccessor;

    it('returns only entries whose row ids are selected', async () => {
      patchDetailState({ selectedIds: new Set(['entry-1', 'entry-3']) });
      entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
        of({
          entryIds: ['entry-1', 'entry-3'],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
        >,
      );

      const dto = {
        entries: [{ id: 'entry-1' }, { id: 'entry-2' }, { id: 'entry-3' }],
      } as ApplicationListGetPrintDto;

      const result = await printHelpers().filterEntriesToPrint(dto);

      expect(result).toEqual({
        ...dto,
        entries: [{ id: 'entry-1' }, { id: 'entry-3' }],
      });
    });

    it('returns the dto with an empty entries array when nothing is selected', async () => {
      patchDetailState({ selectedIds: new Set<string>() });
      entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
        of({
          entryIds: [],
        }) as unknown as ReturnType<
          ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
        >,
      );

      const dto = {
        entries: [{ id: 'entry-1' }, { id: 'entry-2' }],
      } as ApplicationListGetPrintDto;

      const result = await printHelpers().filterEntriesToPrint(dto);

      expect(result).toEqual({
        ...dto,
        entries: [],
      });
    });
  });

  describe('handlePrintPage', () => {
    const printHelpers = (): PrintHelpersAccessor =>
      component as unknown as PrintHelpersAccessor;

    it('patches an error and does not generate a pdf when there are no entries', async () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const dto = { entries: [] } as unknown as ApplicationListGetPrintDto;

      await printHelpers().handlePrintPage(dto);

      expect(pdfStub.generatePagedApplicationListPdf).not.toHaveBeenCalled();
      expect(patchSpy).toHaveBeenCalledWith({
        errorSummary: [
          { text: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint },
        ],
      });
    });

    it('generates a paged pdf when entries are present', async () => {
      const dto = {
        entries: [{ id: 'entry-1' }],
      } as ApplicationListGetPrintDto;

      await printHelpers().handlePrintPage(dto);

      expect(pdfStub.generatePagedApplicationListPdf).toHaveBeenCalledWith(
        dto,
        {
          crestUrl: '/assets/govuk-crest.png',
        },
      );
    });

    it('patches a retry error when pdf generation fails', async () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const dto = {
        entries: [{ id: 'entry-1' }],
      } as ApplicationListGetPrintDto;

      pdfStub.generatePagedApplicationListPdf.mockRejectedValueOnce(
        new Error('pdf failed'),
      );

      await printHelpers().handlePrintPage(dto);

      expect(patchSpy).toHaveBeenCalledWith({
        errorSummary: [
          { text: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry },
        ],
      });
    });

    it('keeps pdfLoading true until page PDF generation completes', async () => {
      let resolvePdf: (() => void) | undefined;
      const pendingPdf = new Promise<void>((resolve) => {
        resolvePdf = resolve;
      });
      pdfStub.generatePagedApplicationListPdf.mockReturnValueOnce(pendingPdf);

      patchDetailState({
        selectedIds: new Set(['entry-1']),
        selectedRows: [
          {
            id: 'entry-1',
            applicant: 'Applicant 1',
            respondent: 'Respondent 1',
            title: 'Title 1',
            location: 'LOC1',
            feeReq: 'Yes',
            resulted: 'No',
            status: 'OPEN',
          },
        ],
      });
      entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
        of({
          entryIds: ['entry-1'],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
        >,
      );
      component.id = 'list-123';
      component.onPrintPageClick();
      fixture.detectChanges();
      await Promise.resolve();
      fixture.detectChanges();

      expect(vm().pdfLoading).toBe(true);

      resolvePdf?.();
      await pendingPdf;
      await flushSignalEffects(fixture);

      expect(vm().pdfLoading).toBe(false);
    });
  });

  describe('handlePrintContinuous', () => {
    const printHelpers = (): PrintHelpersAccessor =>
      component as unknown as PrintHelpersAccessor;

    it('patches an error and does not generate a pdf when there are no entries', async () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const dto = { entries: [] } as unknown as ApplicationListGetPrintDto;

      await printHelpers().handlePrintContinuous(dto);

      expect(
        pdfStub.generateContinuousApplicationListsPdf,
      ).not.toHaveBeenCalled();
      expect(patchSpy).toHaveBeenCalledWith({
        errorSummary: [
          { text: APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint },
        ],
      });
    });

    it('generates a continuous pdf when entries are present', async () => {
      const dto = {
        entries: [{ id: 'entry-1' }],
      } as ApplicationListGetPrintDto;

      await printHelpers().handlePrintContinuous(dto);

      expect(
        pdfStub.generateContinuousApplicationListsPdf,
      ).toHaveBeenCalledWith([dto], false);
    });

    it('patches a generic error when pdf generation fails', async () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const dto = {
        entries: [{ id: 'entry-1' }],
      } as ApplicationListGetPrintDto;

      pdfStub.generateContinuousApplicationListsPdf.mockRejectedValueOnce(
        new Error('pdf failed'),
      );

      await printHelpers().handlePrintContinuous(dto);

      expect(patchSpy).toHaveBeenCalledWith({
        errorSummary: [
          { text: APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric },
        ],
      });
    });
  });

  describe('onPrintContinuousClick', () => {
    it('clears notifications and sets a continuous print request when id exists', () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );

      component.id = 'list-123';

      component.onPrintContinuousClick();

      expect(patchSpy).toHaveBeenCalledWith({
        updateDone: false,
        updateInvalid: false,
        errorHint: '',
        errorSummary: [],
        createDone: false,
        bulkUploadDone: false,
        preserveErrorSummaryOnLoad: false,
        moveDone: false,
        updateOfficialsDone: false,
        updateFeesDone: false,
      });
      expect(setSpy).toHaveBeenCalledWith({
        id: 'list-123',
        mode: 'continuous',
      });
    });

    it('clears notifications and does not set a print request when id is missing', () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );

      component.id = '';

      component.onPrintContinuousClick();

      expect(patchSpy).toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('onPrintPageClick', () => {
    it('clears notifications and sets a page print request when id exists', () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );

      component.id = 'list-123';

      component.onPrintPageClick();

      expect(patchSpy).toHaveBeenCalledWith({
        updateDone: false,
        updateInvalid: false,
        errorHint: '',
        errorSummary: [],
        createDone: false,
        bulkUploadDone: false,
        preserveErrorSummaryOnLoad: false,
        moveDone: false,
        updateOfficialsDone: false,
        updateFeesDone: false,
      });
      expect(setSpy).toHaveBeenCalledWith({
        id: 'list-123',
        mode: 'page',
      });
    });

    it('clears notifications and does not set a print request when id is missing', () => {
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );

      component.id = '';

      component.onPrintPageClick();

      expect(patchSpy).toHaveBeenCalled();
      expect(setSpy).not.toHaveBeenCalled();
    });
  });

  describe('printRequest effect', () => {
    it('calls print api, clears the request, filters selected entries, and routes page mode to handlePrintPage', async () => {
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );
      const handlePrintPageSpy = jest
        .spyOn(
          component as unknown as {
            handlePrintPage(dto: ApplicationListGetPrintDto): Promise<void>;
          },
          'handlePrintPage',
        )
        .mockResolvedValue();
      const handlePrintContinuousSpy = jest
        .spyOn(
          component as unknown as {
            handlePrintContinuous(
              dto: ApplicationListGetPrintDto,
            ): Promise<void>;
          },
          'handlePrintContinuous',
        )
        .mockResolvedValue();

      patchDetailState({ selectedIds: new Set(['entry-1']) });
      entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
        of({
          entryIds: ['entry-1'],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
        >,
      );

      (component as unknown as PrintRequestSignalAccessor).printRequest.set({
        id: 'list-123',
        mode: 'page',
      });
      await flushSignalEffects(fixture);

      expect(apiStub.printApplicationList).toHaveBeenCalledWith(
        { listId: 'list-123' },
        undefined,
        undefined,
        {
          transferCache: false,
        },
      );
      expect(setSpy).toHaveBeenCalledWith(null);
      expect(handlePrintPageSpy).toHaveBeenCalledWith({
        entries: [{ id: 'entry-1' }],
      });
      expect(handlePrintContinuousSpy).not.toHaveBeenCalled();
    });

    it('calls print api, clears the request, filters selected entries, and routes continuous mode to handlePrintContinuous', async () => {
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );
      const handlePrintPageSpy = jest
        .spyOn(
          component as unknown as {
            handlePrintPage(dto: ApplicationListGetPrintDto): Promise<void>;
          },
          'handlePrintPage',
        )
        .mockResolvedValue();
      const handlePrintContinuousSpy = jest
        .spyOn(
          component as unknown as {
            handlePrintContinuous(
              dto: ApplicationListGetPrintDto,
            ): Promise<void>;
          },
          'handlePrintContinuous',
        )
        .mockResolvedValue();

      patchDetailState({ selectedIds: new Set(['entry-2']) });
      entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
        of({
          entryIds: ['entry-2'],
        } as BulkActionPreviewResponseDto) as unknown as ReturnType<
          ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
        >,
      );

      (component as unknown as PrintRequestSignalAccessor).printRequest.set({
        id: 'list-123',
        mode: 'continuous',
      });
      await flushSignalEffects(fixture);

      expect(apiStub.printApplicationList).toHaveBeenCalledWith(
        { listId: 'list-123' },
        undefined,
        undefined,
        {
          transferCache: false,
        },
      );
      expect(setSpy).toHaveBeenCalledWith(null);
      expect(handlePrintContinuousSpy).toHaveBeenCalledWith({
        entries: [{ id: 'entry-2' }],
      });
      expect(handlePrintPageSpy).not.toHaveBeenCalled();
    });

    it('clears the request and patches errorSummary when the print api fails', async () => {
      const requestError = new HttpErrorResponse({
        status: 500,
        statusText: 'Server Error',
        error: { detail: 'Print failed' },
      });
      const setSpy = jest.spyOn(
        (component as unknown as PrintRequestSignalAccessor).printRequest,
        'set',
      );
      const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');

      apiStub.printApplicationList.mockReturnValueOnce(
        throwError(() => requestError),
      );

      (component as unknown as PrintRequestSignalAccessor).printRequest.set({
        id: 'list-123',
        mode: 'page',
      });
      await flushSignalEffects(fixture);

      expect(setSpy).toHaveBeenCalledWith(null);
      expect(patchSpy).toHaveBeenCalledWith({
        errorSummary: [
          {
            text: getProblemText(requestError),
          },
        ],
      });
    });
  });

  describe('formatPersonName', () => {
    it('returns null when applicant or name is missing', () => {
      expect(formatPersonName()).toBeNull();
      expect(formatPersonName({} as Applicant)).toBeNull();
    });

    it('formats title, forenames, and surname', () => {
      const applicant = {
        person: {
          name: {
            lastName: 'Smith',
            firstName: 'John',
            middleName: 'Paul',
            title: 'Mr',
          },
        },
      } as Applicant;

      expect(formatPersonName(applicant)).toBe('John Smith');
    });

    it('skips missing forenames', () => {
      const applicant = {
        person: {
          name: {
            lastName: 'Smith',
            firstName: 'John',
            title: 'Mr',
          },
        },
      } as Applicant;

      expect(formatPersonName(applicant)).toBe('John Smith');
    });
  });

  it('maps a 400 close error from navigation state onto the detail page', async () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      closeError: {
        status: 400,
        title: 'List cannot be closed',
        detail: 'All applications must have a Paid or Remitted Fee status.',
      },
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'close') {
          return 'error';
        }
        if (key === 'code') {
          return '400';
        }
        return null;
      });

    (
      component as unknown as {
        setCloseErrorFromNavigation(): void;
      }
    ).setCloseErrorFromNavigation();

    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorHint).toBe('There is a problem');
    expect(vm().errorSummary).toEqual([
      {
        id: 'status-close',
        href: '#status',
        text: 'All applications must have a Paid or Remitted Fee status.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  it('maps move errors from navigation state onto the detail page', async () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      moveError: 'Unable to move applications right now.',
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'move') {
          return 'error';
        }
        return null;
      });

    (
      component as unknown as {
        setMoveErrorFromNavigation(): void;
      }
    ).setMoveErrorFromNavigation();

    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorHint).toBe('There is a problem');
    expect(vm().errorSummary).toEqual([
      {
        id: '',
        href: '',
        text: 'Unable to move applications right now.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  it('maps fee update errors from navigation state onto the detail page', async () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      updateFeeError: 'Unable to update fees right now.',
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'updateFee') {
          return 'error';
        }
        return null;
      });

    (
      component as unknown as {
        setUpdateFeeErrorFromNavigation(): void;
      }
    ).setUpdateFeeErrorFromNavigation();

    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorHint).toBe('There is a problem');
    expect(vm().errorSummary).toEqual([
      {
        id: '',
        href: '',
        text: 'Unable to update fees right now.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  it('sets moveDone when moveEntriesSuccessful query param is true', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'moveEntriesSuccessful') {
          return 'true';
        }
        return null;
      });

    component.setSuccessBanner();

    expect(vm().moveDone).toBe(true);
  });

  it('sets updateFeesDone when bulkFeeUpdateSuccessful query param is true', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'bulkFeeUpdateSuccessful') {
          return 'true';
        }
        return null;
      });

    component.setSuccessBanner();

    expect(vm().updateFeesDone).toBe(true);
  });

  it('sets bulk upload success banner text and job id from navigation state', () => {
    historyStateSpy.mockReturnValue({
      row: {
        id: 'id-1',
        location: 'LOC1',
        description: '',
        status: 'OPEN',
      },
      msg: '3 records created.',
      jobId: 'job-123',
    });

    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key) => {
        if (key === 'bulkUploadSuccess') {
          return 'true';
        }
        return null;
      });

    component.setSuccessBanner();

    expect(vm().bulkUploadDone).toBe(true);
    expect(vm().bulkUploadBannerText).toBe('3 records created.');
    expect(component.bulkUploadJobId()).toBe('job-123');
  });

  it('preserves returned close errors when the detail page reload completes', async () => {
    patchDetailState({
      updateInvalid: true,
      errorSummary: [
        {
          id: 'status-close',
          href: '#status',
          text: 'All applications must have a Paid or Remitted Fee status.',
        },
      ],
      preserveErrorSummaryOnLoad: true,
    });

    component.id = 'list-123';
    component.loadListDetailsInfo();
    await flushSignalEffects(fixture);

    expect(vm().updateInvalid).toBe(true);
    expect(vm().errorSummary).toEqual([
      {
        id: 'status-close',
        href: '#status',
        text: 'All applications must have a Paid or Remitted Fee status.',
      },
    ]);
    expect(vm().preserveErrorSummaryOnLoad).toBe(true);
  });

  describe('onTabSelected', () => {
    it('should reset error summary when applications tab has validation issues', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [{ text: 'Something went wrong' }],
        updateInvalid: false,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetSpy = jest.spyOn(
        component as unknown as { resetErrorSummary(): void },
        'resetErrorSummary',
      );

      component.onTabSelected('applications');

      expect(resetSpy).toHaveBeenCalled();
    });

    it('should reset success banner when applications tab has no errors but updateDone is true', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [] as ErrorItem[],
        updateInvalid: false,
        updateDone: true,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetBannerSpy = jest.spyOn(
        component as unknown as { resetSuccessBanner(): void },
        'resetSuccessBanner',
      );

      component.onTabSelected('applications');

      expect(resetBannerSpy).toHaveBeenCalled();
    });

    it('should NOT reset error summary when a different tab is selected', () => {
      jest.spyOn(component, 'vm').mockReturnValue({
        errorSummary: [{ text: 'Something went wrong' }],
        updateInvalid: true,
        preserveErrorSummaryOnLoad: false,
      } as ApplicationsListDetailState);

      const resetSpy = jest.spyOn(
        component as unknown as { resetErrorSummary(): void },
        'resetErrorSummary',
      );

      component.onTabSelected('details');

      expect(resetSpy).not.toHaveBeenCalled();
    });
  });

  it('ResetSuccessBanner should reset success banners', () => {
    const patchSpy = jest.spyOn(component['detailSignalState'], 'patch');

    (
      component as unknown as { resetSuccessBanner(): void }
    ).resetSuccessBanner();

    expect(patchSpy).toHaveBeenCalledWith({
      updateDone: false,
      updateOfficialsDone: false,
    });
  });

  it('onPageChange patches page + preserves selectedIds + triggers load', () => {
    const loadSpy = jest
      .spyOn(component, 'loadListDetailsInfo')
      .mockImplementation(() => undefined);

    patchDetailState({
      selectedIds: new Set(['a', 'b']),
      selectedRows: [{ id: 'a' } as Row],
    });

    component.onPageChange(3);

    expect(vm().currentPage).toBe(3);
    expect(vm().selectedIds).toEqual(new Set(['a', 'b']));
    expect(vm().selectedRows).toEqual([]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('onPageChange preserves selectedIds when all matching rows are selected', () => {
    const loadSpy = jest
      .spyOn(component, 'loadListDetailsInfo')
      .mockImplementation(() => undefined);

    patchDetailState({
      selectedIds: new Set(['a', 'b']),
      allMatchingSelected: true,
      selectedRows: [{ id: 'a' } as Row],
    });

    component.onPageChange(2);

    expect(vm().currentPage).toBe(2);
    expect(vm().selectedIds).toEqual(new Set(['a', 'b']));
    expect(vm().selectedRows).toEqual([]);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  it('onSortChange stores the UI sort key, resets to page 0, and reloads data', () => {
    const loadSpy = jest
      .spyOn(component, 'loadListDetailsInfo')
      .mockImplementation(() => undefined);
    patchDetailState({ currentPage: 5 });

    component.onSortChange({ key: 'title', direction: 'desc' });

    expect(vm().sortField).toEqual({
      key: 'title',
      direction: 'desc',
    });
    expect(vm().currentPage).toBe(0);
    expect(loadSpy).toHaveBeenCalledTimes(1);
  });

  describe('onUpdateFeeButtonClick', () => {
    it('shows an error when all selected applications do not require fees', async () => {
      const navigateSpy = jest.spyOn(TestBed.inject(Router), 'navigate');
      jest
        .spyOn(component as unknown as BulkPreviewAccessor, 'getBulkPreview')
        .mockResolvedValue({
          action: BulkActionType.UPDATE_FEE_DETAILS,
          limit: 2000,
          selectedCount: 1,
          eligibleCount: 0,
          ineligibleCount: 1,
          entryIds: ['entry-1'],
          entries: [],
        });

      await component.onUpdateFeeButtonClick();

      expect(vm().errorSummary).toEqual([
        {
          text: 'Cannot update application(s) that do not require a fee',
          href: '',
          id: '',
        },
      ]);
      expect(navigateSpy).not.toHaveBeenCalledWith(
        ['bulk-update-fee'],
        expect.anything(),
      );
    });

    it('filters out fee-exempt rows before navigating to bulk fee update', async () => {
      const navigateSpy = jest
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);
      jest
        .spyOn(component as unknown as BulkPreviewAccessor, 'getBulkPreview')
        .mockResolvedValue({
          action: BulkActionType.UPDATE_FEE_DETAILS,
          limit: 2000,
          selectedCount: 2,
          eligibleCount: 1,
          ineligibleCount: 1,
          entryIds: ['entry-2'],
          entries: [
            {
              id: 'entry-2',
              applicant: {
                organisation: {
                  name: 'Applicant 2',
                  contactDetails: { addressLine1: 'Applicant address' },
                },
              },
              respondent: {
                organisation: {
                  name: 'Respondent 2',
                  contactDetails: { addressLine1: 'Respondent address' },
                },
              },
              applicationTitle: 'Title 2',
              isFeeRequired: true,
              isResulted: true,
              resulted: [{ resultCode: 'ADJ', title: 'Adjourned' }],
              status: ApplicationListStatus.OPEN,
            },
          ],
        });

      await component.onUpdateFeeButtonClick();

      expect(navigateSpy).toHaveBeenCalledTimes(1);
      const [commands, navigationExtras] = navigateSpy.mock.calls[0];
      expect(commands).toEqual(['bulk-update-fee']);
      expect(navigationExtras?.relativeTo).toBe(TestBed.inject(ActivatedRoute));
      expect(navigationExtras?.state).toEqual({
        removedApplicationsWarning: true,
        entriesToUpdateFee: [
          {
            id: 'entry-2',
            applicant: 'Applicant 2',
            respondent: 'Respondent 2',
            title: 'Title 2',
            feeRequired: 'Yes',
            resulted: 'ADJ',
          },
        ],
      });
    });

    it('sets removedApplicationsWarning to false when every selected row requires a fee', async () => {
      const navigateSpy = jest
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);
      jest
        .spyOn(component as unknown as BulkPreviewAccessor, 'getBulkPreview')
        .mockResolvedValue({
          action: BulkActionType.UPDATE_FEE_DETAILS,
          limit: 2000,
          selectedCount: 1,
          eligibleCount: 1,
          ineligibleCount: 0,
          entryIds: ['entry-2'],
          entries: [
            {
              id: 'entry-2',
              applicant: {
                organisation: {
                  name: 'Applicant 2',
                  contactDetails: { addressLine1: 'Applicant address' },
                },
              },
              respondent: {
                organisation: {
                  name: 'Respondent 2',
                  contactDetails: { addressLine1: 'Respondent address' },
                },
              },
              applicationTitle: 'Title 2',
              isFeeRequired: true,
              isResulted: true,
              resulted: [{ resultCode: 'ADJ', title: 'Adjourned' }],
              status: ApplicationListStatus.OPEN,
            },
          ],
        });

      await component.onUpdateFeeButtonClick();

      expect(navigateSpy).toHaveBeenCalledTimes(1);
      const [commands, navigationExtras] = navigateSpy.mock.calls[0];
      expect(commands).toEqual(['bulk-update-fee']);
      expect(navigationExtras?.relativeTo).toBe(TestBed.inject(ActivatedRoute));
      expect(navigationExtras?.state).toEqual({
        removedApplicationsWarning: false,
        entriesToUpdateFee: [
          {
            id: 'entry-2',
            applicant: 'Applicant 2',
            respondent: 'Respondent 2',
            title: 'Title 2',
            feeRequired: 'Yes',
            resulted: 'ADJ',
          },
        ],
      });
    });
  });

  describe('onBulkUploadBannerClick', () => {
    it('loads uploaded entry ids, patches selection, and opens bulk fee update', async () => {
      entriesApiStub.getBulkResultApplicationListEntriesByJobId.mockReturnValue(
        of(['entry-1', 'entry-2']) as never,
      );
      component.bulkUploadJobId.set('job-123');

      const updateFeeSpy = jest
        .spyOn(component, 'onUpdateFeeButtonClick')
        .mockResolvedValue();

      await component.onBulkUploadBannerClick();

      expect(
        entriesApiStub.getBulkResultApplicationListEntriesByJobId,
      ).toHaveBeenCalledWith({ jobId: 'job-123' });
      expect(vm().selectedIds).toEqual(new Set(['entry-1', 'entry-2']));
      expect(updateFeeSpy).toHaveBeenCalled();
    });

    it('shows an error when no uploaded entry ids are returned', async () => {
      entriesApiStub.getBulkResultApplicationListEntriesByJobId.mockReturnValue(
        of([]) as never,
      );
      component.bulkUploadJobId.set('job-123');

      const updateFeeSpy = jest
        .spyOn(component, 'onUpdateFeeButtonClick')
        .mockResolvedValue();

      await component.onBulkUploadBannerClick();

      expect(vm().errorSummary).toEqual([
        { text: 'Failed to get new bulk uploaded applications' },
      ]);
      expect(updateFeeSpy).not.toHaveBeenCalled();
    });

    it('shows the backend error and hides the banner when loading uploaded ids fails', async () => {
      const httpError = new HttpErrorResponse({
        status: 500,
        statusText: 'boom',
      });

      entriesApiStub.getBulkResultApplicationListEntriesByJobId.mockReturnValue(
        throwError(() => httpError) as never,
      );
      patchDetailState({ bulkUploadDone: true });
      component.bulkUploadJobId.set('job-123');

      await component.onBulkUploadBannerClick();

      expect(vm().bulkUploadDone).toBe(false);
      expect(vm().errorSummary).toEqual([
        { text: 'Failed to get new bulk uploaded applications' },
      ]);
    });
  });

  describe('noEntries', () => {
    it('is false while loading', () => {
      patchDetailState({ isLoading: true, updateInvalid: false, rows: [] });
      expect(component.noEntries).toBe(false);
    });

    it('is false when updateInvalid is true', () => {
      patchDetailState({ isLoading: false, updateInvalid: true, rows: [] });
      expect(component.noEntries).toBe(false);
    });

    it('is true when not loading, not invalid, and no rows', () => {
      patchDetailState({ isLoading: false, updateInvalid: false, rows: [] });
      expect(component.noEntries).toBe(true);
    });
  });

  describe('loadListDetailsInfo', () => {
    it('calls API with listId, page (0-based), size; patches rows, clears errors, updates selection', async () => {
      component.id = 'list-123';

      patchDetailState({
        currentPage: 1,
        pageSize: 10,
        sortField: { key: 'sequenceNumber', direction: 'asc' },
        selectedIds: new Set(['stale-id']),
      });

      const dto = {
        entriesCount: 1,
      } as unknown as ApplicationListGetDetailDto;

      apiStub.getApplicationList.mockReturnValueOnce(
        of(
          new HttpResponse<ApplicationListGetDetailDto>({
            status: 200,
            body: dto,
            headers: new HttpHeaders({ ETag: '"etag-v2"' }),
          }),
        ),
      );

      component.loadListDetailsInfo();
      await flushSignalEffects(fixture);

      expect(entriesApiStub.getApplicationListEntries).toHaveBeenCalledWith(
        expect.objectContaining({
          listId: 'list-123',
          pageNumber: 1,
          pageSize: 10,
          sort: ['sequenceNumber,asc'],
        }),
        'response',
        false,
        { transferCache: false },
      );

      expect(apiStub.getApplicationList).toHaveBeenNthCalledWith(
        2,
        {
          listId: 'list-123',
          pageNumber: 1,
          pageSize: 10,
        },
        'response',
        false,
        { transferCache: false },
      );

      expect(vm().isLoading).toBe(false);
      expect(vm().updateInvalid).toBe(false);
      expect(vm().errorHint).toBe('');
      expect(vm().errorSummary).toEqual([]);

      expect(vm().rows).toEqual([
        {
          id: 'abc',
          sequenceNumber: 7,
          accountNumber: '',
          applicant: null,
          respondent: 'Acme',
          postCode: 'AB12 3CD',
          title: 'Land Registry Appeal',
          feeReq: 'Yes',
          resulted: '',
        },
      ]);

      expect(vm().selectedIds.has('stale-id')).toBe(true);
      expect(vm().selectedRows).toEqual([]);
      expect(vm().totalPages).toBe(0);
    });

    it('sets error state on API failure', async () => {
      component.id = 'list-123';

      apiStub.getApplicationList.mockReturnValueOnce(
        throwError(
          () => new HttpErrorResponse({ status: 500, statusText: 'boom' }),
        ),
      );

      patchDetailState({ selectedIds: new Set(['x', 'y']) });

      component.loadListDetailsInfo();
      await flushSignalEffects(fixture);

      expect(vm().updateInvalid).toBe(true);
      expect(vm().rows).toEqual([]);
      expect(vm().totalPages).toBe(0);
      expect(vm().selectedIds.size).toBe(0);
      expect(vm().errorSummary.length).toBeGreaterThan(0);
    });
  });

  it('setSuccessBanner: sets createDone to true when listCreated=true', () => {
    const route = TestBed.inject(ActivatedRoute);
    const routeSpy = jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockReturnValue('true');

    component.setSuccessBanner();

    expect(routeSpy).toHaveBeenCalledWith('listCreated');
    expect(component.vm().createDone).toBe(true);
  });

  it('setSuccessBanner: sets createDone to false when listCreated=false', () => {
    const route = TestBed.inject(ActivatedRoute);
    const routeSpy = jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockReturnValue('false');

    component.setSuccessBanner();

    expect(routeSpy).toHaveBeenCalledWith('listCreated');
    expect(component.vm().createDone).toBe(false);
  });

  it('setSuccessBanner: sets updateOfficialsDone when updateOfficialsSuccessful=true', () => {
    const route = TestBed.inject(ActivatedRoute);
    jest
      .spyOn(route.snapshot.queryParamMap, 'get')
      .mockImplementation((key: string) =>
        key === 'updateOfficialsSuccessful' ? 'true' : null,
      );

    component.setSuccessBanner();

    expect(component.vm().updateOfficialsDone).toBe(true);
  });

  it('openUpdate: navigates with state & queryParams', async () => {
    const router = TestBed.inject(Router);
    const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

    component.id = 'list-9';

    await component.openUpdate({
      id: 'entry-123',
      applicant: 'Alice',
      respondent: 'Bob',
      title: 'Case XYZ',
    });

    expect(navSpy).toHaveBeenCalledWith(
      ['/applications-list', 'list-9', 'update-entry', 'entry-123'],
      {
        state: {
          appListId: 'list-9',
          resultApplicantContext: {
            applicant: 'Alice',
            respondent: 'Bob',
            title: 'Case XYZ',
          },
        },
      },
    );
  });

  it('onSelectedRowsChange: patches selectedRows in state', () => {
    const rows: Row[] = [{ id: 'id-1', resulted: 'No' } as unknown as Row];
    component.onSelectedRowsChange(rows);
    expect(vm().selectedRows).toEqual(rows);
  });

  it('onSelectedIdsChange patches selected ids and allMatchingSelected', () => {
    patchDetailState({
      rows: [
        { id: 'id-1', title: 'One' } as Row,
        { id: 'id-2', title: 'Two' } as Row,
      ],
      totalEntries: 2,
    });

    component.onSelectedIdsChange(new Set(['id-1', 'id-2']));

    expect(vm().selectedIds).toEqual(new Set(['id-1', 'id-2']));
    expect(vm().selectedRows).toEqual([]);
    expect(vm().allMatchingSelected).toBe(true);
  });

  it('onHeaderSelectAllChange selects all matching rows when checked', () => {
    const selectAllSpy = jest.spyOn(component, 'onSelectAllMatchingClick');

    component.onHeaderSelectAllChange(true);

    expect(selectAllSpy).toHaveBeenCalledTimes(1);
  });

  it('onHeaderSelectAllChange clears selection when unchecked', () => {
    patchDetailState({
      selectedIds: new Set(['id-1']),
      selectedRows: [{ id: 'id-1' } as Row],
      isSelectingAll: true,
      allMatchingSelected: true,
    });

    component.onHeaderSelectAllChange(false);

    expect(vm().selectedIds.size).toBe(0);
    expect(vm().selectedRows).toEqual([]);
    expect(vm().isSelectingAll).toBe(false);
    expect(vm().allMatchingSelected).toBe(false);
  });

  it('onSelectAllMatchingClick selects visible rows as a filter selection', () => {
    patchDetailState({
      rows: [{ id: 'abc', title: 'Visible row' } as Row],
      totalEntries: 2,
      getFilters: { applicantName: 'Smith' },
    });
    component.id = 'list-123';

    component.onSelectAllMatchingClick();

    expect(entriesApiStub.getApplicationListEntryIds).not.toHaveBeenCalled();
    expect(vm().selectedIds).toEqual(new Set(['abc']));
    expect(vm().selectedRows).toEqual([{ id: 'abc', title: 'Visible row' }]);
    expect(vm().allMatchingSelected).toBe(true);
    expect(vm().isFilterSelection).toBe(true);
  });

  it('tracks excluded visible rows when a filter selection is edited', () => {
    patchDetailState({
      rows: [
        { id: 'abc', title: 'Visible row' } as Row,
        { id: 'def', title: 'Visible row 2' } as Row,
      ],
      totalEntries: 4,
    });
    component.id = 'list-123';

    component.onSelectAllMatchingClick();
    component.onSelectedIdsChange(new Set(['abc']));

    expect(vm().excludedEntryIds).toEqual(new Set(['def']));
    expect(component.selectedCount).toBe(3);
    expect(component.tableSelectedIds()).toEqual(new Set(['abc']));
  });

  it('requests a bulk preview using filter selection and excluded ids', async () => {
    jest.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
      of({
        action: BulkActionType.RESULT_SELECTED,
        limit: 2000,
        selectedCount: 1,
        eligibleCount: 1,
        ineligibleCount: 0,
        entryIds: ['abc'],
        entries: [],
      } as BulkActionPreviewResponseDto) as unknown as ReturnType<
        ApplicationListEntriesApi['applicationListEntryBulkActionPreview']
      >,
    );
    patchDetailState({
      isFilterSelection: true,
      getFilters: { applicantName: 'Smith' },
      excludedEntryIds: new Set(['def']),
    });
    component.id = 'list-123';

    await component.onResultButtonClick();

    expect(
      entriesApiStub.applicationListEntryBulkActionPreview,
    ).toHaveBeenCalledWith({
      listId: 'list-123',
      applicationListEntryBulkActionPreviewRequestDto: {
        action: BulkActionType.RESULT_SELECTED,
        selection: {
          selectionType: BulkActionSelectionType.FILTER,
          filter: { applicantName: 'Smith' },
          excludedEntryIds: ['def'],
        },
      },
    });
  });

  it('reports the specific message when a bulk preview exceeds the row limit', async () => {
    entriesApiStub.applicationListEntryBulkActionPreview.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 413 })),
    );
    patchDetailState({ selectedIds: new Set(['abc']) });
    component.id = 'list-123';

    await component.onResultButtonClick();

    expect(vm().errorSummary).toEqual([
      {
        text: 'Affected rows exceeds 2000. Please reduce the number of rows selected',
      },
    ]);
  });

  it('onSearchStarted clears selection', () => {
    patchDetailState({
      rows: [{ id: 'abc', title: 'Visible row' } as Row],
      totalEntries: 2,
      selectedIds: new Set(['abc']),
      selectedRows: [{ id: 'abc', title: 'Visible row' } as Row],
      getFilters: { applicantName: 'Old' },
    });
    component.id = 'list-123';

    component.onSearchStarted({ applicantName: 'New' });

    expect(vm().selectedIds.size).toBe(0);
    expect(vm().selectedRows).toEqual([]);
    expect(vm().getFilters).toEqual({ applicantName: 'New' });
    expect(vm().isSelectingAll).toBe(false);
  });

  it('prefillFromApi: sets listRow when navigation state row is missing', () => {
    component.listRow = undefined;
    component['etag'] = '"etag-v2"';

    const dto = {
      id: 'list-123',
      date: '2026-03-01',
      time: '09:30:00',
      courtName: 'Bristol',
      description: 'Morning list',
      entriesCount: 4,
      status: 'OPEN',
      version: 7,
    } as unknown as ApplicationListGetDetailDto;

    component['prefillFromApi'](dto);

    expect(component.listRow).toEqual({
      id: 'list-123',
      date: '2026-03-01',
      time: '09:30',
      location: 'Bristol',
      description: 'Morning list',
      entries: 4,
      status: 'OPEN',
      deletable: true,
      etag: '"etag-v2"',
      rowVersion: '7',
    });
    expect(component.entryCount).toBe(4);
  });

  describe('onResultButtonClick', () => {
    it('navigates to result-selected with selected  applications', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      patchDetailState({
        selectedRows: [
          {
            sequenceNumber: 1,
            applicant: 'A',
            respondent: 'R',
            title: 'T1',
            resulted: 'Yes',
          },
          {
            sequenceNumber: 2,
            applicant: 'B',
            respondent: 'S',
            title: 'T2',
            resulted: 'No',
          },
        ],
      });

      jest
        .spyOn(
          component as unknown as { getBulkPreview: jest.Mock },
          'getBulkPreview',
        )
        .mockResolvedValue({
          entries: [
            { id: 'entry-1', sequenceNumber: 1, applicationTitle: 'T1' },
            { id: 'entry-2', sequenceNumber: 2, applicationTitle: 'T2' },
          ],
        } as never);

      await component.onResultButtonClick();

      expect(navSpy).toHaveBeenCalledTimes(1);

      expect(navSpy).toHaveBeenCalledWith(
        ['result-selected'],
        expect.objectContaining({
          state: {
            resultingApplications: [
              {
                id: 'entry-1',
                sequenceNumber: 1,
                applicant: null,
                respondent: null,
                title: 'T1',
              },
              {
                id: 'entry-2',
                sequenceNumber: 2,
                applicant: null,
                respondent: null,
                title: 'T2',
              },
            ],
          },
        }),
      );
    });

    it('resolves rows across pages when selected ids exceed visible rows', async () => {
      const router = TestBed.inject(Router);
      const navSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);

      jest
        .spyOn(
          component as unknown as { getBulkPreview: jest.Mock },
          'getBulkPreview',
        )
        .mockResolvedValue({
          entries: [
            { id: 'entry-1', sequenceNumber: 1, applicationTitle: 'First' },
            { id: 'entry-2', sequenceNumber: 2, applicationTitle: 'Second' },
          ],
        } as never);

      entriesApiStub.getApplicationListEntries.mockReturnValueOnce(
        of({
          pageNumber: 0,
          pageSize: 10,
          totalElements: 2,
          totalPages: 1,
          first: true,
          last: true,
          elementsOnPage: 2,
          sort: { orders: [] },
          content: [
            {
              id: 'entry-1',
              sequenceNumber: 1,
              accountNumber: '',
              applicant: undefined,
              respondent: undefined,
              applicationTitle: 'First',
              isFeeRequired: true,
              isResulted: false,
              status: ApplicationListStatus.OPEN,
            },
            {
              id: 'entry-2',
              sequenceNumber: 2,
              accountNumber: '',
              applicant: undefined,
              respondent: undefined,
              applicationTitle: 'Second',
              isFeeRequired: false,
              isResulted: false,
              status: ApplicationListStatus.OPEN,
            },
          ],
        } as EntryPage) as unknown as ReturnType<
          ApplicationListEntriesApi['getApplicationListEntries']
        >,
      );

      patchDetailState({
        selectedIds: new Set(['entry-1', 'entry-2']),
        selectedRows: [
          { id: 'entry-1', sequenceNumber: 1, title: 'First' } as Row,
        ],
        totalEntries: 2,
        totalPages: 1,
      });

      await component.onResultButtonClick();

      expect(navSpy).toHaveBeenCalledWith(
        ['result-selected'],
        expect.objectContaining({
          state: {
            resultingApplications: expect.arrayContaining([
              expect.objectContaining({ id: 'entry-1', sequenceNumber: 1 }),
              expect.objectContaining({ id: 'entry-2', sequenceNumber: 2 }),
            ]),
          },
        }),
      );
    });
  });

  it('can patch place fields state (sanity)', async () => {
    patchPlaceFieldsState({
      cjaSearch: 'ABC - Something',
      cja: [{ code: 'DEF' } as CriminalJusticeAreaGetDto],
    });
    await flushSignalEffects(fixture);

    // no assertion required; just ensures accessor doesn’t break
    expect(true).toBe(true);
  });
});
