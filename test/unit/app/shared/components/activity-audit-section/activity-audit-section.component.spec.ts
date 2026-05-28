import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormGroupDirective,
  ReactiveFormsModule,
} from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ActivityAuditSectionComponent } from '@components/activity-audit-section/activity-audit-section.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { ActivityType } from '@openapi';

describe('ActivityAuditSectionComponent (with template)', () => {
  let component: ActivityAuditSectionComponent;
  let fixture: ComponentFixture<ActivityAuditSectionComponent>;
  let group: FormGroup;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, ActivityAuditSectionComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ActivityAuditSectionComponent);
    component = fixture.componentInstance;

    group = new FormGroup({
      dateFrom: new FormControl(null),
      dateTo: new FormControl(null),
      username: new FormControl(''),
      activity: new FormControl<ActivityType[]>([]),
    });

    fixture.componentRef.setInput('group', group);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose the provided FormGroup via the "group" input', () => {
    expect(component.group()).toBe(group);
  });

  it('renders the "Activity audit" heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('h1.govuk-heading-l');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Activity audit');
  });

  it('binds the provided FormGroup to the div.govuk-grid-row via [formGroup]', () => {
    const gridRowDebug = fixture.debugElement.query(
      By.css('div.govuk-grid-row'),
    );
    expect(gridRowDebug).toBeTruthy();

    const formGroupDirective = gridRowDebug.injector.get(FormGroupDirective);
    expect(formGroupDirective.form).toBe(group);
  });

  it('renders two app-date-input components, one app-text-input component, and the activity suggestions component', () => {
    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));
    const textInputs = fixture.debugElement.queryAll(By.css('app-text-input'));
    const activitySuggestions = fixture.debugElement.query(
      By.css('app-suggestions'),
    );

    expect(dateInputs).toHaveLength(2);
    expect(textInputs).toHaveLength(1);
    expect(activitySuggestions).toBeTruthy();
  });

  it('filters activity suggestions from the search text', () => {
    const activitySuggestions = fixture.debugElement.query(
      By.css('app-suggestions'),
    ).componentInstance as SuggestionsComponent<ActivityType>;

    expect(activitySuggestions.id()).toBe('activity');
    expect(activitySuggestions.showAllValues()).toBe(true);
    expect(activitySuggestions.suggestions()).toContain(
      ActivityType.ADD_APPLICATION,
    );

    component.setActivitySearch('bulk');
    fixture.detectChanges();

    expect(group.get('activity')?.value).toEqual([]);
    expect(activitySuggestions.search()).toBe('bulk');
    expect(activitySuggestions.suggestions()).toEqual([
      ActivityType.BULK_APPLICATION_UPLOAD,
      ActivityType.BULK_UPDATE_FEE_STATUS,
      ActivityType.BULK_UPDATE_OFFICIALS,
    ]);
    expect(
      activitySuggestions.labelFor(ActivityType.BULK_UPDATE_FEE_STATUS),
    ).toBe('Bulk update fee status');
  });

  it('shows all available activities when the activity input is focused', () => {
    const activitySuggestions = fixture.debugElement.query(
      By.css('app-suggestions'),
    ).componentInstance as SuggestionsComponent<ActivityType>;

    activitySuggestions.onFocus();

    expect(activitySuggestions.open).toBe(true);
    expect(activitySuggestions.visibleSuggestions).toEqual(
      component.availableActivities(),
    );
  });

  it('filters activity suggestions by friendly label text', () => {
    component.setActivitySearch('fee status');
    fixture.detectChanges();

    expect(component.filteredActivities()).toEqual([
      ActivityType.BULK_UPDATE_FEE_STATUS,
    ]);
  });

  it('adds the selected activity to the form and renders it in the selected activities summary list', () => {
    const activitySuggestions = fixture.debugElement.query(
      By.css('app-suggestions'),
    );

    activitySuggestions.triggerEventHandler(
      'selectItem',
      ActivityType.REPORT_DOWNLOADED,
    );
    fixture.detectChanges();

    expect(component.activitySearch()).toBe('');
    expect(group.get('activity')?.value).toEqual([
      ActivityType.REPORT_DOWNLOADED,
    ]);
    expect(
      fixture.nativeElement
        .querySelector('.selected-activity .govuk-summary-list__value')
        ?.textContent?.trim(),
    ).toBe('Report downloaded');
    expect(
      fixture.nativeElement.querySelector(
        '.selected-activity .govuk-summary-list__actions',
      )?.textContent,
    ).toContain('Remove');
  });

  it('removes selected activities from the form', () => {
    component.selectActivity(ActivityType.REPORT_DOWNLOADED);
    component.selectActivity(ActivityType.REPORT_CREATED);
    fixture.detectChanges();

    const removeButton = fixture.debugElement.query(
      By.css('.selected-activity .govuk-summary-list__actions .govuk-link'),
    );

    removeButton.triggerEventHandler('click');
    fixture.detectChanges();

    expect(group.get('activity')?.value).toEqual([ActivityType.REPORT_CREATED]);
    const selectedActivities = Array.from(
      fixture.nativeElement.querySelectorAll(
        '.selected-activity .govuk-summary-list__value',
      ) as NodeListOf<HTMLElement>,
    ).map((activity) => activity.textContent?.trim());
    expect(selectedActivities).toEqual(['Report created']);
  });

  it('passes activity errors to the suggestions component after submit', () => {
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('getError', (id: string) =>
      id === 'activity'
        ? { id, text: 'At least 1 activity is required' }
        : undefined,
    );
    fixture.detectChanges();

    const activitySuggestions = fixture.debugElement.query(
      By.css('app-suggestions'),
    ).componentInstance as SuggestionsComponent<ActivityType>;

    expect(activitySuggestions.showError()).toBe(true);
    expect(activitySuggestions.errorText()).toBe(
      'At least 1 activity is required',
    );
    expect(
      fixture.nativeElement
        .querySelector('input#activity')
        ?.classList.contains('govuk-input--error'),
    ).toBe(true);
  });

  it('passes external date errors to date inputs', () => {
    fixture.componentRef.setInput('submitted', true);
    fixture.componentRef.setInput('getError', (id: string) =>
      id === 'dateTo'
        ? { id, text: 'Date to must be on or after Date from' }
        : undefined,
    );
    fixture.detectChanges();

    const dateInputs = fixture.debugElement.queryAll(By.css('app-date-input'));

    expect(dateInputs[0].componentInstance.externalErrorText()).toBe('');
    expect(dateInputs[1].componentInstance.externalErrorText()).toBe(
      'Date to must be on or after Date from',
    );
  });
});
