import { HttpHeaders, HttpResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Subject, of } from 'rxjs';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { Reports } from '@components/reports/reports.component';
import { SearchWarrantsSectionComponent } from '@components/search-warrants-section/search-warrants-section.component';
import {
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
  JobAcknowledgement,
  ReportsApi,
} from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';
import { ReferenceDataFacade } from '@services/reference-data.facade';

const refFacadeStub: Pick<ReferenceDataFacade, 'courtLocations$' | 'cja$'> = {
  courtLocations$: of<CourtLocationGetSummaryDto[]>([
    { name: 'Alpha Court', locationCode: 'A1' } as CourtLocationGetSummaryDto,
  ]),
  cja$: of<CriminalJusticeAreaGetDto[]>([
    { code: 'C1', description: 'Area One' } as CriminalJusticeAreaGetDto,
  ]),
};

const reportsApiMock = {
  createListMaintenanceReport: jest.fn(),
  downloadReport: jest.fn(),
};

const jobPollingFacadeMock = {
  watchJob: jest.fn(),
};

const jobAcknowledgement = {
  id: 'job-1',
  status: 'RECEIVED',
} as unknown as JobAcknowledgement;

const completedJob: PolledJobStatus = {
  id: 'job-1',
  rawStatus: 'COMPLETED',
  state: 'succeeded',
  isTerminal: true,
  createdCount: null,
  errorCount: null,
  totalCount: null,
  message: null,
  raw: {},
};

describe('ReportsComponent', () => {
  let component: Reports;
  let fixture: ComponentFixture<Reports>;
  let anchorClickSpy: jest.SpyInstance;
  let createObjectUrlSpy: jest.Mock;

  beforeEach(async () => {
    createObjectUrlSpy = jest.fn(() => 'blob:report-csv');
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlSpy,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: jest.fn(),
    });
    anchorClickSpy = jest
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation();

    await TestBed.configureTestingModule({
      imports: [Reports],
      providers: [
        provideRouter([]),
        { provide: ReferenceDataFacade, useValue: refFacadeStub },
        { provide: ReportsApi, useValue: reportsApiMock },
        { provide: JobPollingFacade, useValue: jobPollingFacadeMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Reports);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    anchorClickSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('filters search warrant court suggestions via the facade', () => {
    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();

    component.suggestionsFacade.setCourthouseSearch('alpha');
    component.suggestionsFacade.onCourthouseInputChange();

    expect(component.suggestionsFacade.filteredCourthouses()).toEqual([
      expect.objectContaining({
        label: 'A1 - Alpha Court',
        locationCode: 'A1',
        value: 'A1',
      }),
    ]);
  });

  it('passes the search warrants group and suggestions facade to the section', () => {
    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();

    const section = fixture.debugElement.query(
      By.directive(SearchWarrantsSectionComponent),
    ).componentInstance as SearchWarrantsSectionComponent;

    expect(section.group()).toBe(component.searchWarrantsGroup);
    expect(section.suggestions()).toBe(component.suggestionsFacade);
    expect(section.getError()).toEqual(expect.any(Function));
  });

  it('calls onDownload when the download button is clicked', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    const onDownload = jest.spyOn(component, 'onDownload');
    const button = fixture.debugElement.query(By.css('button.govuk-button'));

    button.triggerEventHandler('click');

    expect(onDownload).toHaveBeenCalledTimes(1);
  });

  it('shows date errors for the selected report on download', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      { id: 'dateFrom', href: '#date-from', text: 'Enter day, month and year' },
      { id: 'dateTo', href: '#date-to', text: 'Enter day, month and year' },
    ]);
    expect(
      fixture.nativeElement.querySelector('app-error-summary'),
    ).toBeTruthy();
    expect(
      fixture.nativeElement
        .querySelector('#date-from-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('uses date input validation text for partially entered dates', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    const dateFrom = fixture.debugElement.queryAll(
      By.directive(DateInputComponent),
    )[0].componentInstance as DateInputComponent;

    dateFrom.dateForm.setValue({ day: '1', month: '', year: '2026' });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      { id: 'dateFrom', href: '#date-from', text: 'Enter month' },
      { id: 'dateTo', href: '#date-to', text: 'Enter day, month and year' },
    ]);
  });

  it('clears previous errors when the selected report is valid', () => {
    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    component.onDownload();
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([]);
  });

  it('shows a search warrants court suggestion error on download', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCourthouseSearch('Missing Court');
    component.suggestionsFacade.onCourthouseInputChange();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      { id: 'court', href: '#court', text: 'Court location not found' },
    ]);
  });

  it('does not require search warrants court, other location, or CJA', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([]);
  });

  it('highlights the search warrants court suggestion when it has an error', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCourthouseSearch('Missing Court');
    component.suggestionsFacade.onCourthouseInputChange();

    component.onDownload();
    fixture.detectChanges();

    expect(component.fieldError('court')?.text).toBe(
      'Court location not found',
    );
    expect(
      fixture.nativeElement
        .querySelector('input#court')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('highlights the search warrants CJA suggestion when it has an error', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      otherLocation: 'Somewhere',
    });
    fixture.detectChanges();

    component.suggestionsFacade.setCjaSearch('Missing CJA');
    component.suggestionsFacade.onCjaInputChange();

    component.onDownload();
    fixture.detectChanges();

    expect(component.fieldError('cja')?.text).toBe(
      'Criminal justice area not found',
    );
    expect(
      fixture.nativeElement
        .querySelector('input#cja')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('preserves date from and date to when switching to list maintenance', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.form.controls.report.setValue('list-maintenance');

    expect(component.listMaintenanceGroup.value).toEqual(
      expect.objectContaining({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      }),
    );
  });

  it('blocks list maintenance download when date to is before date from', () => {
    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(reportsApiMock.createListMaintenanceReport).not.toHaveBeenCalled();
  });

  it('shows report progress while the list maintenance job request is pending', () => {
    const createJob$ = new Subject<HttpResponse<JobAcknowledgement>>();
    reportsApiMock.createListMaintenanceReport.mockReturnValue(createJob$);

    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({ kind: 'progress' });
    expect(
      fixture.nativeElement.querySelector('[role="status"]')?.textContent,
    ).toContain('Report in progress');
  });

  it('creates, polls, and downloads a list maintenance report CSV', () => {
    reportsApiMock.createListMaintenanceReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(of(completedJob));
    reportsApiMock.downloadReport.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['header\n'], { type: 'text/csv' }),
          headers: new HttpHeaders({
            'content-disposition':
              'attachment; filename="list-maintenance.csv"',
          }),
          status: 200,
        }),
      ),
    );

    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      description: '  Stale lists  ',
      court: 'A1',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(reportsApiMock.createListMaintenanceReport).toHaveBeenCalledWith(
      {
        listMaintenanceFilterDto: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          listDescription: 'Stale lists',
          location: { courtLocationCode: 'A1' },
        },
      },
      'response',
      false,
      {
        httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
        transferCache: false,
      },
    );
    expect(jobPollingFacadeMock.watchJob).toHaveBeenCalledWith('job-1', 2000);
    expect(reportsApiMock.downloadReport).toHaveBeenCalledWith(
      { jobId: 'job-1' },
      'response',
      false,
      { httpHeaderAccept: 'text/csv', transferCache: false },
    );
    expect(createObjectUrlSpy).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchorClickSpy).toHaveBeenCalledTimes(1);
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The list maintenance report has downloaded.',
    });
    expect(
      fixture.nativeElement.querySelector('app-success-banner')?.textContent,
    ).toContain('Report downloaded');
  });

  it('shows the backend message when list maintenance polling fails', () => {
    reportsApiMock.createListMaintenanceReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(
      of({
        ...completedJob,
        rawStatus: 'FAILED',
        state: 'failed',
        message: 'Backend failed the report',
      } satisfies PolledJobStatus),
    );

    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [{ text: 'Backend failed the report' }],
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Backend failed the report',
    );
    expect(reportsApiMock.downloadReport).not.toHaveBeenCalled();
  });
});
