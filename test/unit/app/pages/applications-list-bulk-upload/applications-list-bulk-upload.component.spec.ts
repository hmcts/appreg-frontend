import {
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { EMPTY, Subject, from, of, throwError } from 'rxjs';

import { ApplicationsListBulkUpload } from '@components/applications-list-detail/applications-list-bulk-upload/applications-list-bulk-upload.component';
import { ApplicationsListBulkUploadState } from '@components/applications-list-detail/applications-list-bulk-upload/util/applications-list-bulk-upload.state';
import {
  ApplicationListEntriesApi,
  JobAcknowledgement,
  JobStatus2 as JobStatus,
  JobType,
  ReportsApi,
} from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';

describe('ApplicationsListBulkUpload', () => {
  let component: ApplicationsListBulkUpload;
  let fixture: ComponentFixture<ApplicationsListBulkUpload>;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        id: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      }),
      queryParamMap: convertToParamMap({}),
    },
  };

  const blob = new Blob([''], { type: 'text/csv' });
  const file = new File([blob], 'test.csv', { type: 'text/csv' });

  const incorrectBlob = new Blob([''], { type: 'application/pdf' });
  const incorrectFile = new File([incorrectBlob], 'test.pdf', {
    type: 'application/pdf',
  });

  const actionsApiMock = {
    bulkUploadApplicationListEntries: jest.fn(),
  };

  const jobPollingFacadeMock = {
    watchJob: jest.fn(),
  };

  const reportsApiMock = {
    downloadReport: jest.fn(),
  };

  const terminalJob = (
    overrides: Partial<PolledJobStatus>,
  ): PolledJobStatus => ({
    id: 'job-1',
    rawStatus: 'SUCCEEDED',
    state: 'succeeded',
    isTerminal: true,
    createdCount: 3,
    errorCount: null,
    totalCount: 3,
    message: null,
    raw: {},
    ...overrides,
  });

  const startBulkUploadPolling = (jobId = 'job-1'): void => {
    (
      component as unknown as {
        startBulkUploadPolling(jobId: string): void;
      }
    ).startBulkUploadPolling(jobId);
  };

  type BulkUploadSignalStateAccessor = {
    bulkUploadSignalState: {
      patch: (p: Partial<ApplicationsListBulkUploadState>) => void;
    };
  };

  const getState = (comp: ApplicationsListBulkUpload) => comp.vm();
  const patchState = (
    comp: ApplicationsListBulkUpload,
    patch: Partial<ApplicationsListBulkUploadState>,
  ): void => {
    (
      comp as unknown as BulkUploadSignalStateAccessor
    ).bulkUploadSignalState.patch(patch);
  };

  const flushSignalEffects = async (
    testFixture: ComponentFixture<ApplicationsListBulkUpload>,
  ): Promise<void> => {
    testFixture.detectChanges();
    await Promise.resolve();
    await Promise.resolve();
    testFixture.detectChanges();
  };

  beforeEach(async () => {
    jobPollingFacadeMock.watchJob.mockReturnValue(EMPTY);

    await TestBed.configureTestingModule({
      imports: [ApplicationsListBulkUpload],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApplicationListEntriesApi, useValue: actionsApiMock },
        { provide: ReportsApi, useValue: reportsApiMock },
        { provide: JobPollingFacade, useValue: jobPollingFacadeMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListBulkUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onExportErrorFilesClick', () => {
    it('shows an error when there is no failed upload job to export', () => {
      component.onExportErrorFilesClick();

      expect(reportsApiMock.downloadReport).not.toHaveBeenCalled();
      expect(getState(component).errorSummary).toEqual([
        {
          text: 'Unable to export file. If you believe this was in error, please contact support.',
        },
      ]);
    });

    it('downloads the failed upload CSV when the report API succeeds', () => {
      const response = new HttpResponse({
        body: new Blob(['error'], { type: 'text/csv' }),
      });
      reportsApiMock.downloadReport.mockReturnValue(of(response));
      (component as unknown as { jobId: string }).jobId = 'job-1';
      const saveCsvSpy = jest.spyOn(
        component as unknown as {
          saveCsv: (value: HttpResponse<Blob>) => void;
        },
        'saveCsv',
      );

      component.onExportErrorFilesClick();

      expect(reportsApiMock.downloadReport).toHaveBeenCalledWith(
        { jobId: 'job-1' },
        'response',
        false,
        { httpHeaderAccept: 'text/csv', transferCache: false },
      );
      expect(saveCsvSpy).toHaveBeenCalledWith(response);
    });

    it('adds the API error to the error summary', () => {
      reportsApiMock.downloadReport.mockReturnValue(
        throwError(() => new Error('Export failed')),
      );
      (component as unknown as { jobId: string }).jobId = 'job-1';

      component.onExportErrorFilesClick();

      expect(getState(component).errorSummary).toEqual([
        { text: 'Request failed' },
      ]);
      expect(component.submitAttempt()).toBe(1);
    });
  });

  describe('saveCsv', () => {
    it('downloads a CSV response with the bulk-upload error filename', () => {
      const createObjectURL = jest.fn().mockReturnValue('blob:csv');
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        value: createObjectURL,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        value: jest.fn(),
      });
      const saveCsv = (
        component as unknown as {
          saveCsv: (response: HttpResponse<Blob>) => void;
        }
      ).saveCsv;

      saveCsv.call(
        component,
        new HttpResponse({
          body: new Blob(['error'], { type: 'text/csv' }),
        }),
      );

      expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    });

    it('adds an error when the response has no body', () => {
      const saveCsv = (
        component as unknown as {
          saveCsv: (response: HttpResponse<Blob>) => void;
        }
      ).saveCsv;

      saveCsv.call(component, new HttpResponse<Blob>({ body: null }));

      expect(getState(component).errorSummary).toEqual([
        { text: 'Failed to export CSV. Please try again later' },
      ]);
    });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onFileSelected', () => {
    it('sets the selected file and validCSV to true', () => {
      const event = {
        target: {
          files: [file],
        },
      } as unknown as Event;

      component.onFileSelected(event);

      expect(getState(component).file).toBe(file);
      expect(getState(component).isValidCSV).toBe(true);
    });

    it('does not set the selected file and validCSV to false for an invalid upload', () => {
      const event = {
        target: {
          files: [incorrectFile],
        },
      } as unknown as Event;

      component.onFileSelected(event);

      expect(getState(component).file).toBeNull();
      expect(getState(component).isValidCSV).toBe(false);
    });
  });

  describe('onSubmit', () => {
    it('calls the upload API and starts polling when the job is accepted', async () => {
      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };

      actionsApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        from(
          Promise.resolve(
            new HttpResponse<JobAcknowledgement>({
              status: 202,
              body: ack,
            }),
          ),
        ),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(
        actionsApiMock.bulkUploadApplicationListEntries,
      ).toHaveBeenCalledWith(
        { listId: 'list-123', file: getState(component).file },
        'response',
        false,
        { transferCache: false },
      );
      expect(jobPollingFacadeMock.watchJob).toHaveBeenCalledWith('job-1');
      expect(getState(component).jobAcknowledgement).toBe(ack);
      expect(getState(component).isUploadInProgress).toBe(false);
      expect(getState(component).bulkUploadFeedback).toMatchObject({
        kind: 'progress',
        heading: 'Upload in progress',
      });
    });

    it('sets error status and errorSummary when the API errors', async () => {
      const httpErr = new HttpErrorResponse({
        error: 'Bad',
        status: 500,
        statusText: 'Server error',
        url: '/api/upload',
      });

      actionsApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        throwError(() => httpErr),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(getState(component).fileUploadStatus).toBe('error');
      expect(getState(component).errorSummary[0].text).toContain(
        httpErr.message,
      );
      expect(getState(component).isUploadInProgress).toBe(false);
    });

    it('shows an inline error when the upload request is not accepted', async () => {
      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };

      actionsApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        from(
          Promise.resolve(
            new HttpResponse<JobAcknowledgement>({
              status: 200,
              body: ack,
            }),
          ),
        ),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(getState(component).fileUploadStatus).toBe('error');
      expect(getState(component).errorSummary).toEqual([
        { text: 'Unable to start bulk upload. Please try again.' },
      ]);
      expect(getState(component).isUploadInProgress).toBe(false);
    });

    it('keeps isUploadInProgress true while the request is still in flight', async () => {
      const subj = new Subject<HttpResponse<JobAcknowledgement>>();

      actionsApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        subj.asObservable(),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(getState(component).isUploadInProgress).toBe(true);
    });
  });

  describe('bulk upload polling', () => {
    it('shows live progress content while the upload is being polled', async () => {
      jobPollingFacadeMock.watchJob.mockReturnValue(EMPTY);

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      expect(jobPollingFacadeMock.watchJob).toHaveBeenCalledWith('job-1');
      const progress = fixture.debugElement.query(
        By.css('app-async-job-progress'),
      );
      expect(progress).toBeTruthy();
      expect(progress.nativeElement.textContent).toContain(
        'Upload in progress',
      );
    });

    it('shows a success banner when the upload succeeds', async () => {
      const navigateSpy = jest
        .spyOn(TestBed.inject(Router), 'navigate')
        .mockResolvedValue(true);

      jobPollingFacadeMock.watchJob.mockReturnValue(of(terminalJob({})));

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      const banner = fixture.debugElement.query(By.css('app-success-banner'));
      expect(banner).toBeNull();
      expect(navigateSpy).toHaveBeenCalledWith(['../'], {
        relativeTo: TestBed.inject(ActivatedRoute),
        queryParams: { bulkUploadSuccess: 'true' },
        state: { msg: '3 records created.', jobId: 'job-1' },
      });
      expect(getState(component).uploadSuccessful).toBe(true);
      expect(getState(component).bulkUploadFeedback).toBeUndefined();
    });

    it('continues showing upload progress for a completed-with-errors status', async () => {
      jobPollingFacadeMock.watchJob.mockReturnValue(
        of(
          terminalJob({
            rawStatus: 'COMPLETED_WITH_ERRORS',
            state: 'completed_with_errors',
            createdCount: 4,
            errorCount: 2,
            totalCount: 6,
          }),
        ),
      );

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      const summary = fixture.debugElement.query(
        By.css('.govuk-error-summary'),
      );
      expect(summary).toBeNull();
      expect(
        fixture.debugElement.query(By.css('app-async-job-progress')),
      ).toBeTruthy();
      expect(getState(component).uploadSuccessful).toBe(false);
      expect(getState(component).bulkUploadFeedback).toMatchObject({
        kind: 'progress',
        heading: 'Upload in progress',
      });
    });

    it('shows a failure error summary with the backend message', async () => {
      jobPollingFacadeMock.watchJob.mockReturnValue(
        of(
          terminalJob({
            rawStatus: 'FAILED',
            state: 'failed',
            createdCount: null,
            errorCount: null,
            totalCount: null,
            message: 'The uploaded file could not be processed.',
          }),
        ),
      );

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      const summary = fixture.debugElement.query(
        By.css('.govuk-error-summary'),
      );
      expect(summary).toBeTruthy();
      expect(summary.nativeElement.textContent).toContain('Bulk upload failed');
      expect(summary.nativeElement.textContent).toContain(
        'The uploaded file could not be processed.',
      );
      expect(getState(component).uploadSuccessful).toBe(false);
    });

    it('maps structured backend errors into table rows and renders the export action', async () => {
      const onExportErrorFilesClick = jest.spyOn(
        component,
        'onExportErrorFilesClick',
      );
      const errorMessage = JSON.stringify([
        {
          errorType: 'DATA_ERROR',
          rowNumber: 4,
          location: ' applicantName ',
          message: ' Invalid value ',
          name: ' Jane Doe ',
          addressLine1: ' 1 High Street ',
          rejectedValue: ' ??? ',
        },
        {
          errorType: 'HEADER_ERROR',
          rowNumber: null,
          location: null,
          message: '',
          name: null,
          addressLine1: '   ',
          rejectedValue: null,
        },
      ]);

      jobPollingFacadeMock.watchJob.mockReturnValue(
        of(
          terminalJob({
            rawStatus: 'FAILED',
            state: 'failed',
            createdCount: null,
            errorCount: null,
            totalCount: null,
            message: errorMessage,
          }),
        ),
      );

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      expect(component.errorRows()).toEqual([
        {
          errorType: 'Data error',
          rowNumber: 4,
          location: 'applicantName',
          message: 'Invalid value',
          name: 'Jane Doe',
          addressLine1: '1 High Street',
          rejectedValue: '???',
        },
        {
          errorType: 'Header error',
          rowNumber: null,
          location: '—',
          message: '—',
          name: '—',
          addressLine1: '—',
          rejectedValue: '—',
        },
      ]);
      expect(
        fixture.debugElement.query(By.css('app-sortable-table')),
      ).toBeTruthy();

      const exportButton = fixture.debugElement.query(
        By.css('button.govuk-button__export'),
      );
      expect(exportButton.nativeElement.textContent).toContain(
        'Export the file with errors shown',
      );

      exportButton.nativeElement.click();
      expect(onExportErrorFilesClick).toHaveBeenCalledTimes(1);
    });

    it.each([
      [
        'null',
        null,
        'The bulk upload could not be completed. Contact support for more guidance',
      ],
      [
        'blank',
        '   ',
        'The bulk upload could not be completed. Contact support for more guidance',
      ],
      ['malformed JSON', '{not-json', '{not-json'],
      [
        'a JSON object',
        JSON.stringify({ errorType: 'DATA_ERROR' }),
        JSON.stringify({ errorType: 'DATA_ERROR' }),
      ],
    ])(
      'clears rows for %s backend errors and sets the expected feedback message',
      async (_label, message, expectedBody) => {
        component.errorRows.set([{ message: 'stale row' }]);
        jobPollingFacadeMock.watchJob.mockReturnValue(
          of(
            terminalJob({
              rawStatus: 'FAILED',
              state: 'failed',
              createdCount: null,
              errorCount: null,
              totalCount: null,
              message,
            }),
          ),
        );

        startBulkUploadPolling();
        await flushSignalEffects(fixture);

        expect(component.errorRows()).toEqual([]);
        expect(getState(component).bulkUploadFeedback).toMatchObject({
          kind: 'error',
          body: expectedBody,
        });
        expect(
          fixture.debugElement.query(By.css('app-sortable-table')),
        ).toBeNull();
      },
    );

    it('clears existing error rows when a new upload is submitted', () => {
      component.errorRows.set([{ message: 'stale row' }]);

      component.onSubmit();

      expect(component.errorRows()).toEqual([]);
    });

    it('sorts all error rows before selecting the current page', () => {
      component.errorRows.set([
        { name: 'Zulu' },
        { name: 'Charlie' },
        { name: 'Echo' },
        { name: 'Foxtrot' },
        { name: 'Golf' },
        { name: 'Alpha' },
      ]);

      component.onSortChange({ key: 'name', direction: 'asc' });

      expect(component.paginatedErrorRows().map((row) => row['name'])).toEqual([
        'Alpha',
        'Charlie',
        'Echo',
        'Foxtrot',
        'Golf',
        'Zulu',
      ]);
      expect(component.vm().currentPage).toBe(0);
    });

    it('shows an inline error summary when polling fails', async () => {
      jobPollingFacadeMock.watchJob.mockReturnValue(
        throwError(() => new Error('boom')),
      );

      startBulkUploadPolling();
      await flushSignalEffects(fixture);

      const summary = fixture.debugElement.query(
        By.css('.govuk-error-summary'),
      );
      expect(summary).toBeTruthy();
      expect(summary.nativeElement.textContent).toContain(
        'Unable to load upload status',
      );
      expect(summary.nativeElement.textContent).toContain(
        'Please try again later.',
      );
    });
  });
});
