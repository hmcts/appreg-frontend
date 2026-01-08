import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ApplicationsListBulkUpload } from '@components/applications-list-bulk-upload/applications-list-bulk-upload';
import { ActionsApi, JobAcknowledgement, JobStatus, JobType } from '@openapi';

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

  const actionsApiServiceMock = {
    bulkUploadApplicationListEntries: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsListBulkUpload],
      providers: [
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
        {
          provide: ActionsApi,
          useValue: actionsApiServiceMock,
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
      expect(component.listId).toBe('73d0276f-42a3-4150-b2fd-d9b2d56b359c');
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
      expect(component.file).toBe(file);
      expect(component.isValidCSV).toBeTruthy();
    });

    it('should not set the selected file and validCSV should be false', () => {
      const event = {
        target: {
          files: [incorrectFile],
        },
      } as unknown as Event;
      component.onFileSelected(event);
      expect(component.file).toBeUndefined();
      expect(component.isValidCSV).toBeFalsy();
    });
  });

  describe('onSubmit', () => {
    it('calls API with correct params and sets success when job status is RECEIVED', () => {
      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };
      actionsApiServiceMock.bulkUploadApplicationListEntries.mockReturnValue(
        of(ack),
      );

      component.listId = 'list-123';
      component.file = new File(['csv-content'], 'test.csv', {
        type: 'text/csv',
      });

      component.onSubmit();

      expect(
        actionsApiServiceMock.bulkUploadApplicationListEntries,
      ).toHaveBeenCalledWith(
        { listId: 'list-123', file: component.file },
        'body',
        true,
      );

      expect(component.jobAcknowledgement).toBe(ack);
      expect(component.fileUploadStatus).toBe('success');
      expect(component.isUploadInProgress).toBe(false);
    });

    it('sets error status and errorSummary when API errors', () => {
      const httpErr = new HttpErrorResponse({
        error: 'Bad',
        status: 500,
        statusText: 'Server error',
        url: '/api/upload',
      });
      actionsApiServiceMock.bulkUploadApplicationListEntries.mockReturnValue(
        throwError(() => httpErr),
      );

      component.listId = 'list-123';
      component.file = new File(['csv-content'], 'test.csv', {
        type: 'text/csv',
      });

      component.onSubmit();

      expect(component.fileUploadStatus).toBe('error');
      expect(component.errorSummary).toBeTruthy();
      expect(component.errorSummary[0].text).toContain(httpErr.message);
      expect(component.isUploadInProgress).toBe(false);
    });

    it('sets isUploadInProgress true while request is in-flight and false after complete', () => {
      const subj = new Subject<JobAcknowledgement>();
      actionsApiServiceMock.bulkUploadApplicationListEntries.mockReturnValue(
        subj.asObservable(),
      );

      component.listId = 'list-123';
      component.file = new File(['csv-content'], 'test.csv', {
        type: 'text/csv',
      });

      component.onSubmit();

      expect(component.isUploadInProgress).toBe(true);

      const ack: JobAcknowledgement = {
        id: 'job-1',
        status: JobStatus.RECEIVED,
        type: JobType.BULK_UPLOAD_ENTRIES,
      };
      subj.next(ack);
      subj.complete();

      expect(component.isUploadInProgress).toBe(false);
      expect(component.jobAcknowledgement).toBe(ack);
      expect(component.fileUploadStatus).toBe('success');
    });
  });
});
