import {
  HttpErrorResponse,
  HttpResponse,
  provideHttpClient,
} from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApplicationsListBulkUpload } from '@components/applications-list-bulk-upload/applications-list-bulk-upload.component';
import { ApplicationsListBulkUploadState } from '@components/applications-list-bulk-upload/util/applications-list-bulk-upload.state';
import {
  ApplicationListEntriesApi,
  JobAcknowledgement,
  JobStatus,
  JobType,
} from '@openapi';

describe('ApplicationsListBulkUpload', () => {
  let component: ApplicationsListBulkUpload;
  let fixture: ComponentFixture<ApplicationsListBulkUpload>;
  let router: Router;

  const mockActivatedRoute = {
    snapshot: {
      paramMap: convertToParamMap({
        id: '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      }),
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
    await testFixture.whenStable();
    testFixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListBulkUpload],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        { provide: ApplicationListEntriesApi, useValue: actionsApiMock },
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListBulkUpload);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
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
    it('calls the upload API and navigates to the detail page when the job is accepted', async () => {
      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };

      actionsApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        of(
          new HttpResponse<JobAcknowledgement>({
            status: 202,
            body: ack,
          }),
        ),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);
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
      expect(navigateSpy).toHaveBeenCalledWith(
        ['/applications-list', 'list-123'],
        {
          queryParams: { bulkUploadJobId: 'job-1' },
        },
      );
      expect(getState(component).jobAcknowledgement).toBe(ack);
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
        of(
          new HttpResponse<JobAcknowledgement>({
            status: 200,
            body: ack,
          }),
        ),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      const navigateSpy = jest
        .spyOn(router, 'navigate')
        .mockResolvedValue(true);
      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(navigateSpy).not.toHaveBeenCalled();
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
});
