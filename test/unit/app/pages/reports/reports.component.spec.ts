import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  PrivateProsecutorsIndexSectionComponent,
} from '@components/private-prosecutors-index-section/private-prosecutors-index-section.component';
import { Reports } from '@components/reports/reports.component';
import { SearchWarrantsSectionComponent } from '@components/search-warrants-section/search-warrants-section.component';
import { WorkloadSectionComponent } from '@components/workload-section/workload-section.component';
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
    { name: 'Alpha Court', locationCode: 'A1' },
  ]),
  cja$: of<CriminalJusticeAreaGetDto[]>([
    { code: 'C1', description: 'Area One' },
  ]),
};

const reportsApiMock = {
  createFeesReport: jest.fn(),
  createListMaintenanceReport: jest.fn(),
  createSearchWarrantsReport: jest.fn(),
  createWorkloadReport: jest.fn(),
  createActivityAuditReport: jest.fn(),
  downloadReport: jest.fn(),
};

const httpClientMock = {
  post: jest.fn(),
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
        { provide: HttpClient, useValue: httpClientMock },
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
    jest.useRealTimers();
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

  it('passes the workload group and suggestions facade to the section', () => {
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    const section = fixture.debugElement.query(
      By.directive(WorkloadSectionComponent),
    ).componentInstance as WorkloadSectionComponent;

    expect(section.group()).toBe(component.workloadGroup);
    expect(section.suggestions()).toBe(component.suggestionsFacade);
    expect(section.getError()).toEqual(expect.any(Function));
  });

  it('passes the private prosecutors index group and suggestions facade to the section', () => {
    component.form.controls.report.setValue('private-prosecutors-index');
    fixture.detectChanges();

    const section = fixture.debugElement.query(
      By.directive(PrivateProsecutorsIndexSectionComponent),
    ).componentInstance as PrivateProsecutorsIndexSectionComponent;

    expect(section.group()).toBe(component.ppiGroup);
    expect(section.suggestions()).toBe(component.suggestionsFacade);
    expect(section.getError()).toEqual(expect.any(Function));
    expect(fixture.nativeElement.textContent).toContain(
      'Provides an index of all applications to commence a private prosecution recorded under MX99010',
    );
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
      { id: 'dateFrom', href: '#date-from', text: 'Enter date from' },
      { id: 'dateTo', href: '#date-to', text: 'Enter date to' },
      {
        id: 'activity',
        href: '#activity',
        text: 'At least 1 activity is required',
      },
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
    component.activityAuditGroup.patchValue({
      activity: ['REPORT_DOWNLOADED'],
    });
    fixture.detectChanges();

    const dateFrom = fixture.debugElement.queryAll(
      By.directive(DateInputComponent),
    )[0].componentInstance as DateInputComponent;

    dateFrom.dateForm.setValue({ day: '1', month: '', year: '2026' });
    fixture.detectChanges();

    component.onDownload();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateFrom',
        href: '#date-from',
        text: 'Date from must include a month',
      },
      { id: 'dateTo', href: '#date-to', text: 'Enter date to' },
    ]);
  });

  it('shows an activity required error on download', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'activity',
        href: '#activity',
        text: 'At least 1 activity is required',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#activity-error')?.textContent,
    ).toContain('At least 1 activity is required');
    expect(
      fixture.nativeElement
        .querySelector('input#activity')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('blocks activity audit download when date to is before date from', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
      activity: ['REPORT_DOWNLOADED'],
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#date-to-error')?.textContent,
    ).toContain('Date to must be on or after Date from');
    expect(
      fixture.nativeElement
        .querySelector('#date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('clears previous errors when the selected report is valid', () => {
    const createJob$ = new Subject<HttpResponse<JobAcknowledgement>>();
    reportsApiMock.createActivityAuditReport.mockReturnValue(createJob$);

    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    component.onDownload();
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      activity: ['REPORT_DOWNLOADED'],
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
    const createJob$ = new Subject<HttpResponse<JobAcknowledgement>>();
    reportsApiMock.createSearchWarrantsReport.mockReturnValue(createJob$);

    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([]);
    expect(reportsApiMock.createSearchWarrantsReport).toHaveBeenCalledWith(
      {
        searchWarrantsReportFilterDto: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
        },
      },
      'response',
      false,
      {
        httpHeaderAccept: 'application/vnd.hmcts.appreg.v1+json',
        transferCache: false,
      },
    );
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

  it('preserves date from and date to when switching to search warrants', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.form.controls.report.setValue('search-warrants');

    expect(component.searchWarrantsGroup.value).toEqual(
      expect.objectContaining({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      }),
    );
  });

  it('preserves date from and date to when switching to workload', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.form.controls.report.setValue('workload');

    expect(component.workloadGroup.value).toEqual(
      expect.objectContaining({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      }),
    );
  });

  it('preserves date from and date to when switching to private prosecutors index', () => {
    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });

    component.form.controls.report.setValue('private-prosecutors-index');

    expect(component.ppiGroup.value).toEqual(
      expect.objectContaining({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      }),
    );
  });

  it('clears validation state when switching report type', () => {
    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().submitted).toBe(true);
    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);

    component.form.controls.report.setValue('activity-audit');
    fixture.detectChanges();

    expect(component.vm().submitted).toBe(false);
    expect(component.vm().errorSummary).toEqual([]);
    expect(component.vm().reportFeedback).toBeNull();
    expect(component.activityAuditGroup.value).toEqual(
      expect.objectContaining({
        dateFrom: '2026-02-01',
        dateTo: '2026-01-31',
      }),
    );
    expect(
      fixture.nativeElement.querySelector('app-error-summary'),
    ).toBeFalsy();
    expect(
      fixture.nativeElement
        .querySelector('#date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(false);
  });

  it('blocks list maintenance download when date to is before date from', () => {
    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#list-date-to-error')?.textContent,
    ).toContain('Date to must be on or after Date from');
    expect(
      fixture.nativeElement
        .querySelector('#list-date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(reportsApiMock.createListMaintenanceReport).not.toHaveBeenCalled();
  });

  it('blocks search warrants download when date to is before date from', () => {
    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#list-date-to-error')?.textContent,
    ).toContain('Date to must be on or after Date from');
    expect(
      fixture.nativeElement
        .querySelector('#list-date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(reportsApiMock.createSearchWarrantsReport).not.toHaveBeenCalled();
  });

  it('blocks workload download when date to is before date from', () => {
    component.form.controls.report.setValue('workload');
    component.workloadGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#list-date-to-error')?.textContent,
    ).toContain('Date to must be on or after Date from');
    expect(
      fixture.nativeElement
        .querySelector('#list-date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(reportsApiMock.createWorkloadReport).not.toHaveBeenCalled();
  });

  it('blocks private prosecutors index download when date to is before date from', () => {
    component.form.controls.report.setValue('private-prosecutors-index');
    component.ppiGroup.patchValue({
      dateFrom: '2026-02-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'dateTo',
        href: '#list-date-to',
        text: 'Date to must be on or after Date from',
      },
    ]);
    expect(
      fixture.nativeElement.querySelector('#list-date-to-error')?.textContent,
    ).toContain('Date to must be on or after Date from');
    expect(
      fixture.nativeElement
        .querySelector('#list-date-to-day')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
    expect(httpClientMock.post).not.toHaveBeenCalled();
  });

  it('shows mandatory date errors for private prosecutors index on download', () => {
    component.form.controls.report.setValue('private-prosecutors-index');
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      { id: 'dateFrom', href: '#list-date-from', text: 'Enter date from' },
      { id: 'dateTo', href: '#list-date-to', text: 'Enter date to' },
    ]);
    expect(httpClientMock.post).not.toHaveBeenCalled();
  });

  it('enforces workload location mutual exclusivity in the form controls', () => {
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    component.workloadGroup.get('court')?.setValue('A1');
    fixture.detectChanges();

    expect(component.workloadGroup.get('otherLocation')?.disabled).toBe(true);
    expect(component.workloadGroup.get('cja')?.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          '#other-location',
        ) as HTMLInputElement | null
      )?.disabled,
    ).toBe(true);

    component.workloadGroup.get('court')?.setValue('');
    component.workloadGroup.get('otherLocation')?.setValue('Annex');
    fixture.detectChanges();

    expect(component.workloadGroup.get('court')?.disabled).toBe(true);
    expect(component.workloadGroup.get('cja')?.enabled).toBe(true);
  });

  it('enforces private prosecutors index location rules in the form controls', () => {
    component.form.controls.report.setValue('private-prosecutors-index');
    fixture.detectChanges();

    expect(component.ppiGroup.get('court')?.enabled).toBe(true);
    expect(component.ppiGroup.get('otherLocation')?.enabled).toBe(true);
    expect(component.ppiGroup.get('cja')?.disabled).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('input#cja') as HTMLInputElement)
        .disabled,
    ).toBe(true);

    component.ppiGroup.get('otherLocation')?.setValue('Annex');
    fixture.detectChanges();

    expect(component.ppiGroup.get('court')?.disabled).toBe(true);
    expect(component.ppiGroup.get('otherLocation')?.enabled).toBe(true);
    expect(component.ppiGroup.get('cja')?.enabled).toBe(true);

    component.ppiGroup.get('otherLocation')?.setValue('');
    component.ppiGroup.get('court')?.setValue('A1');
    fixture.detectChanges();

    expect(component.ppiGroup.get('court')?.enabled).toBe(true);
    expect(component.ppiGroup.get('otherLocation')?.disabled).toBe(true);
    expect(component.ppiGroup.get('cja')?.disabled).toBe(true);
  });

  it('blocks private prosecutors index download when court and other location are both present', () => {
    component.form.controls.report.setValue('private-prosecutors-index');
    component.ppiGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      court: 'A1',
      otherLocation: 'Annex',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().errorSummary).toEqual([
      {
        id: 'court',
        href: '#court',
        text: 'Enter either Court or Other Location, not both',
      },
    ]);
    expect(httpClientMock.post).not.toHaveBeenCalled();
  });

  it('preserves legacy CJA-only search warrants location behaviour', () => {
    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();

    component.searchWarrantsGroup.get('cja')?.setValue('C1');
    fixture.detectChanges();

    expect(component.searchWarrantsGroup.get('court')?.disabled).toBe(true);
    expect(component.searchWarrantsGroup.get('otherLocation')?.enabled).toBe(
      true,
    );
    expect(component.searchWarrantsGroup.get('cja')?.enabled).toBe(true);
  });

  it('keeps workload CJA disabled after switching away and back when court has a value', () => {
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    component.workloadGroup.get('court')?.setValue('A1');
    fixture.detectChanges();

    expect(component.workloadGroup.get('cja')?.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          'input#cja',
        ) as HTMLInputElement | null
      )?.disabled,
    ).toBe(true);

    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    expect(component.workloadGroup.get('court')?.value).toBe('A1');
    expect(component.workloadGroup.get('cja')?.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          'input#cja',
        ) as HTMLInputElement | null
      )?.disabled,
    ).toBe(true);
  });

  it('keeps workload court disabled after switching away and back when CJA has a value', () => {
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    component.workloadGroup.get('cja')?.setValue('C1');
    fixture.detectChanges();

    expect(component.workloadGroup.get('court')?.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          'input#court',
        ) as HTMLInputElement | null
      )?.disabled,
    ).toBe(true);

    component.form.controls.report.setValue('search-warrants');
    fixture.detectChanges();
    component.form.controls.report.setValue('workload');
    fixture.detectChanges();

    expect(component.workloadGroup.get('cja')?.value).toBe('C1');
    expect(component.workloadGroup.get('court')?.disabled).toBe(true);
    expect(
      (
        fixture.nativeElement.querySelector(
          'input#court',
        ) as HTMLInputElement | null
      )?.disabled,
    ).toBe(true);
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
      fixture.nativeElement.querySelector('app-async-job-progress')
        ?.textContent,
    ).toContain('Report in progress');
  });

  it('prevents duplicate list maintenance create requests while progress is active', () => {
    const createJob$ = new Subject<HttpResponse<JobAcknowledgement>>();
    reportsApiMock.createListMaintenanceReport.mockReturnValue(createJob$);

    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    component.onDownload();
    fixture.detectChanges();

    expect(reportsApiMock.createListMaintenanceReport).toHaveBeenCalledTimes(1);
    expect(
      fixture.nativeElement.querySelector('button.govuk-button')?.disabled,
    ).toBe(true);
  });

  it('shows report error and re-enables download when the fees create request fails', () => {
    reportsApiMock.createFeesReport.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
          }),
      ),
    );

    component.form.controls.report.setValue('fees');
    component.feesGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [
        {
          text: 'There was a problem generating the report. Try again later.',
        },
      ],
    });
    expect(component.vm().errorSummary).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('button.govuk-button')?.disabled,
    ).toBe(false);
  });

  it('shows the backend problem message when a report create request returns 400', () => {
    reportsApiMock.createFeesReport.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              title: 'Bad Request',
              status: 400,
              detail: 'Invalid report filters',
            },
          }),
      ),
    );

    component.form.controls.report.setValue('fees');
    component.feesGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [{ text: 'Invalid report filters' }],
    });
    expect(component.vm().errorSummary).toEqual([]);
    expect(
      fixture.nativeElement.querySelector('button.govuk-button')?.disabled,
    ).toBe(false);
  });

  it('shows report error and re-enables download when the fees job acknowledgement contains an error', () => {
    reportsApiMock.createFeesReport.mockReturnValue(
      of(
        new HttpResponse({
          body: {
            ...jobAcknowledgement,
            error_description: 'Fees report could not be started',
          },
          status: 202,
        }),
      ),
    );

    component.form.controls.report.setValue('fees');
    component.feesGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [{ text: 'Fees report could not be started' }],
    });
    expect(jobPollingFacadeMock.watchJob).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('button.govuk-button')?.disabled,
    ).toBe(false);
  });

  it('cancels a pending list maintenance create request when switching report type', () => {
    const createJob$ = new Subject<HttpResponse<JobAcknowledgement>>();
    reportsApiMock.createListMaintenanceReport.mockReturnValue(createJob$);

    component.form.controls.report.setValue('list-maintenance');
    component.listMaintenanceGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    component.form.controls.report.setValue('activity-audit');
    createJob$.next(
      new HttpResponse({ body: jobAcknowledgement, status: 202 }),
    );
    fixture.detectChanges();

    expect(jobPollingFacadeMock.watchJob).not.toHaveBeenCalled();
    expect(component.vm().reportFeedback).toBeNull();
  });

  it('creates, polls, and downloads a list maintenance report CSV', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T09:30:00'));
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
    expect(
      (anchorClickSpy.mock.contexts[0] as HTMLAnchorElement).download,
    ).toBe('list-maintenance-report-2026-05-22.csv');
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The list maintenance report has downloaded.',
    });
    expect(
      fixture.nativeElement.querySelector('app-success-banner')?.textContent,
    ).toContain('Report downloaded');
  });

  it('creates, polls, and downloads a search warrants report CSV', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T09:30:00'));
    reportsApiMock.createSearchWarrantsReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(of(completedJob));
    reportsApiMock.downloadReport.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['header\n'], { type: 'text/csv' }),
          headers: new HttpHeaders({
            'content-disposition': 'attachment; filename="search-warrants.csv"',
          }),
          status: 200,
        }),
      ),
    );

    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      cja: ' C1 ',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(reportsApiMock.createSearchWarrantsReport).toHaveBeenCalledWith(
      {
        searchWarrantsReportFilterDto: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          location: {
            cjaCode: 'C1',
          },
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
    expect(
      (anchorClickSpy.mock.contexts[0] as HTMLAnchorElement).download,
    ).toBe('search-warrants-report-2026-05-22.csv');
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The search warrants report has downloaded.',
    });
  });

  it('creates, polls, and downloads a workload report CSV', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T09:30:00'));
    reportsApiMock.createWorkloadReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(of(completedJob));
    reportsApiMock.downloadReport.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['header\n'], { type: 'text/csv' }),
          headers: new HttpHeaders({
            'content-disposition': 'attachment; filename="workload.csv"',
          }),
          status: 200,
        }),
      ),
    );

    component.form.controls.report.setValue('workload');
    component.workloadGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      otherLocation: '  Annex  ',
      cja: ' C1 ',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(reportsApiMock.createWorkloadReport).toHaveBeenCalledWith(
      {
        workloadFilterDto: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          location: {
            otherLocationDescription: 'Annex',
            cjaCode: 'C1',
          },
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
    expect(
      (anchorClickSpy.mock.contexts[0] as HTMLAnchorElement).download,
    ).toBe('workload-report-2026-05-22.csv');
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The workload report has downloaded.',
    });
  });

  it('creates, polls, and downloads an activity audit report CSV', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T09:30:00'));
    reportsApiMock.createActivityAuditReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(of(completedJob));
    reportsApiMock.downloadReport.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['header\n'], { type: 'text/csv' }),
          headers: new HttpHeaders({
            'content-disposition': 'attachment; filename="activity-audit.csv"',
          }),
          status: 200,
        }),
      ),
    );

    component.form.controls.report.setValue('activity-audit');
    component.activityAuditGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      username: '  user.one  ',
      activity: ['REPORT_DOWNLOADED', 'REPORT_CREATED'],
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(reportsApiMock.createActivityAuditReport).toHaveBeenCalledWith(
      {
        activityAuditFilterDto: {
          dateFrom: '2026-01-01',
          dateTo: '2026-01-31',
          username: 'user.one',
          activityTypes: ['REPORT_DOWNLOADED', 'REPORT_CREATED'],
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
    expect(
      (anchorClickSpy.mock.contexts[0] as HTMLAnchorElement).download,
    ).toBe('activity-audit-report-2026-05-22.csv');
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The activity audit report has downloaded.',
    });
  });

  it('creates, polls, and downloads a private prosecutors index report CSV', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-05-22T09:30:00'));
    httpClientMock.post.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(of(completedJob));
    reportsApiMock.downloadReport.mockReturnValue(
      of(
        new HttpResponse({
          body: new Blob(['header\n'], { type: 'text/csv' }),
          headers: new HttpHeaders({
            'content-disposition':
              'attachment; filename="private-prosecutors-index.csv"',
          }),
          status: 200,
        }),
      ),
    );

    component.form.controls.report.setValue('private-prosecutors-index');
    component.ppiGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
      applicantFirstName: '  Alice  ',
      applicantSurname: '',
      standardApplicantName: '  Standard applicant  ',
      respondentFirstName: '  Bob  ',
      respondentSurname: '',
      respondentOrganisationName: '  Respondent Org  ',
      otherLocation: '  Annex  ',
      cja: ' C1 ',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(httpClientMock.post).toHaveBeenCalledWith(
      '/reports/private-prosecutors-index/jobs',
      {
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
        applicantFirstName: 'Alice',
        standardApplicantName: 'Standard applicant',
        respondentFirstName: 'Bob',
        respondentOrganisationName: 'Respondent Org',
        location: {
          otherLocationDescription: 'Annex',
          cjaCode: 'C1',
        },
      },
      expect.objectContaining({
        observe: 'response',
        transferCache: false,
      }),
    );
    const requestOptions = httpClientMock.post.mock.calls[0][2] as {
      headers: HttpHeaders;
    };
    expect(requestOptions.headers.get('Accept')).toBe(
      'application/vnd.hmcts.appreg.v1+json',
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
    expect(
      (anchorClickSpy.mock.contexts[0] as HTMLAnchorElement).download,
    ).toBe('private-prosecutors-index-report-2026-05-22.csv');
    expect(component.vm().reportFeedback).toEqual({
      kind: 'success',
      heading: 'Report downloaded',
      body: 'The private prosecutors index report has downloaded.',
    });
  });

  it('shows the backend message when workload polling fails', () => {
    reportsApiMock.createWorkloadReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(
      of({
        ...completedJob,
        rawStatus: 'FAILED',
        state: 'failed',
        message: 'Backend failed the workload report',
      } satisfies PolledJobStatus),
    );

    component.form.controls.report.setValue('workload');
    component.workloadGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [{ text: 'Backend failed the workload report' }],
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Backend failed the workload report',
    );
    expect(reportsApiMock.downloadReport).not.toHaveBeenCalled();
  });

  it('shows the backend message when private prosecutors index polling fails', () => {
    httpClientMock.post.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(
      of({
        ...completedJob,
        rawStatus: 'FAILED',
        state: 'failed',
        message: 'Backend failed the private prosecutors index report',
      } satisfies PolledJobStatus),
    );

    component.form.controls.report.setValue('private-prosecutors-index');
    component.ppiGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [
        { text: 'Backend failed the private prosecutors index report' },
      ],
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Backend failed the private prosecutors index report',
    );
    expect(reportsApiMock.downloadReport).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'You need to sign in to download this report.'],
    [403, 'You do not have permission to download this report.'],
    [500, 'There was a problem generating the report. Try again later.'],
  ])(
    'shows the private prosecutors index request error message for HTTP %i',
    (status, message) => {
      httpClientMock.post.mockReturnValue(throwError(() => ({ status })));

      component.form.controls.report.setValue('private-prosecutors-index');
      component.ppiGroup.patchValue({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });
      fixture.detectChanges();

      component.onDownload();
      fixture.detectChanges();

      expect(component.vm().reportFeedback).toEqual({
        kind: 'error',
        title: 'Report generation failed',
        items: [{ text: message }],
      });
    },
  );

  it.each([
    [401, 'You need to sign in to download this report.'],
    [403, 'You do not have permission to download this report.'],
    [500, 'There was a problem generating the report. Try again later.'],
  ])(
    'shows the workload request error message for HTTP %i',
    (status, message) => {
      reportsApiMock.createWorkloadReport.mockReturnValue(
        throwError(() => ({ status })),
      );

      component.form.controls.report.setValue('workload');
      component.workloadGroup.patchValue({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });
      fixture.detectChanges();

      component.onDownload();
      fixture.detectChanges();

      expect(component.vm().reportFeedback).toEqual({
        kind: 'error',
        title: 'Report generation failed',
        items: [{ text: message }],
      });
    },
  );

  it('shows the backend message when search warrants polling fails', () => {
    reportsApiMock.createSearchWarrantsReport.mockReturnValue(
      of(new HttpResponse({ body: jobAcknowledgement, status: 202 })),
    );
    jobPollingFacadeMock.watchJob.mockReturnValue(
      of({
        ...completedJob,
        rawStatus: 'FAILED',
        state: 'failed',
        message: 'Backend failed the search warrants report',
      } satisfies PolledJobStatus),
    );

    component.form.controls.report.setValue('search-warrants');
    component.searchWarrantsGroup.patchValue({
      dateFrom: '2026-01-01',
      dateTo: '2026-01-31',
    });
    fixture.detectChanges();

    component.onDownload();
    fixture.detectChanges();

    expect(component.vm().reportFeedback).toEqual({
      kind: 'error',
      title: 'Report generation failed',
      items: [{ text: 'Backend failed the search warrants report' }],
    });
    expect(fixture.nativeElement.textContent).toContain(
      'Backend failed the search warrants report',
    );
    expect(reportsApiMock.downloadReport).not.toHaveBeenCalled();
  });

  it.each([
    [401, 'You need to sign in to download this report.'],
    [403, 'You do not have permission to download this report.'],
    [500, 'There was a problem generating the report. Try again later.'],
  ])(
    'shows the search warrants request error message for HTTP %i',
    (status, message) => {
      reportsApiMock.createSearchWarrantsReport.mockReturnValue(
        throwError(() => ({ status })),
      );

      component.form.controls.report.setValue('search-warrants');
      component.searchWarrantsGroup.patchValue({
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });
      fixture.detectChanges();

      component.onDownload();
      fixture.detectChanges();

      expect(component.vm().reportFeedback).toEqual({
        kind: 'error',
        title: 'Report generation failed',
        items: [{ text: message }],
      });
    },
  );

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
