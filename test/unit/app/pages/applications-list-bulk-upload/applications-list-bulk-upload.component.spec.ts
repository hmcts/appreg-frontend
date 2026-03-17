import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
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

  const applicationListEntriesApiMock = {
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
        {
          provide: ApplicationListEntriesApi,
          useValue: applicationListEntriesApiMock,
        },
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationsListBulkUpload);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set the id from the route', () => {
      component.ngOnInit();
      expect(getState(component).listId).toBe(
        '73d0276f-42a3-4150-b2fd-d9b2d56b359c',
      );
    });
  });

  describe('onFileSelected', () => {
    it('should set the selected file and validCSV should be true', () => {
      const event = {
        target: {
          files: [file],
        },
      } as unknown as Event;
      component.onFileSelected(event);
      expect(getState(component).file).toBe(file);
      expect(getState(component).isValidCSV).toBeTruthy();
    });

    it('should not set the selected file and validCSV should be false', () => {
      const event = {
        target: {
          files: [incorrectFile],
        },
      } as unknown as Event;
      component.onFileSelected(event);
      expect(getState(component).file).toBeNull();
      expect(getState(component).isValidCSV).toBeFalsy();
    });
  });

  describe('onSubmit', () => {
    it('calls API with correct params and sets success when job status is RECEIVED', async () => {
      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };
      applicationListEntriesApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        of(ack),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(
        applicationListEntriesApiMock.bulkUploadApplicationListEntries,
      ).toHaveBeenCalledWith(
        { listId: 'list-123', file: getState(component).file },
        'body',
        true,
      );

      expect(getState(component).jobAcknowledgement).toBe(ack);
      expect(getState(component).fileUploadStatus).toBe('success');
      expect(getState(component).isUploadInProgress).toBe(false);
    });

    it('sets error status and errorSummary when API errors', async () => {
      const httpErr = new HttpErrorResponse({
        error: 'Bad',
        status: 500,
        statusText: 'Server error',
        url: '/api/upload',
      });
      applicationListEntriesApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        throwError(() => httpErr),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(getState(component).fileUploadStatus).toBe('error');
      expect(getState(component).errorSummary).toBeTruthy();
      expect(getState(component).errorSummary[0].text).toContain(
        httpErr.message,
      );
      expect(getState(component).isUploadInProgress).toBe(false);
    });

    it('sets isUploadInProgress true while request is in-flight and false after complete', async () => {
      const subj = new Subject<JobAcknowledgement>();
      applicationListEntriesApiMock.bulkUploadApplicationListEntries.mockReturnValue(
        subj.asObservable(),
      );

      patchState(component, { listId: 'list-123' });
      patchState(component, {
        file: new File(['csv-content'], 'test.csv', { type: 'text/csv' }),
      });

      component.onSubmit();
      await flushSignalEffects(fixture);

      expect(getState(component).isUploadInProgress).toBe(true);

      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };
      subj.next(ack);
      subj.complete();
      await flushSignalEffects(fixture);

      expect(getState(component).isUploadInProgress).toBe(false);
      expect(getState(component).jobAcknowledgement).toBe(ack);
      expect(getState(component).fileUploadStatus).toBe('success');
    });
  });
});
