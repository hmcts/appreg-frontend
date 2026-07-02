import { HttpErrorResponse } from '@angular/common/http';
import { LOCALE_ID, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  UpdateNotesApplicationContext,
  UpdateNotesComponent,
} from '@components/applications/update-notes/update-notes.component';
import { ApplicationListEntriesApi, EntryGetDetailDto } from '@openapi';

describe('UpdateNotesComponent', () => {
  let fixture: ComponentFixture<UpdateNotesComponent>;
  let component: UpdateNotesComponent;

  const routeStub = {
    snapshot: {
      paramMap: convertToParamMap({
        id: 'list-1',
        entryId: 'entry-1',
      }),
    },
  };

  const entriesApiStub: jest.Mocked<
    Pick<
      ApplicationListEntriesApi,
      | 'getApplicationListEntryFromClosedList'
      | 'updateClosedApplicationListEntry'
    >
  > = {
    getApplicationListEntryFromClosedList: jest.fn(),
    updateClosedApplicationListEntry: jest.fn(),
  };

  const entryDetail: EntryGetDetailDto = {
    id: 'entry-1',
    listId: 'list-1',
    applicationCode: 'MX99010',
    numberOfRespondents: 1,
    notes: 'Existing application notes',
    lodgementDate: '2026-06-01',
  };

  const navigationContext: UpdateNotesApplicationContext = {
    id: 'entry-1',
    sequenceNumber: 2,
    applicant: 'Mrs Sam Smith Test Person',
    date: '2025-04-23',
    fee: 'Yes',
    respondent: 'Mr John Smith',
    resulted: 'No',
    title: 'Application for a private prosecution summons',
  };

  beforeEach(async () => {
    entriesApiStub.getApplicationListEntryFromClosedList.mockReturnValue(
      of(entryDetail),
    );
    entriesApiStub.updateClosedApplicationListEntry.mockReturnValue(of({}));
    history.replaceState({ updateNotesApplication: navigationContext }, '');

    await TestBed.configureTestingModule({
      imports: [UpdateNotesComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: routeStub },
        { provide: ApplicationListEntriesApi, useValue: entriesApiStub },
        { provide: LOCALE_ID, useValue: 'en-GB' },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UpdateNotesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('loads route ids, selected application context and existing application notes', () => {
    expect(component.listId).toBe('list-1');
    expect(component.entryId).toBe('entry-1');
    expect(
      entriesApiStub.getApplicationListEntryFromClosedList,
    ).toHaveBeenCalledWith({
      listId: 'list-1',
      entryId: 'entry-1',
    });
    expect(component.context()).toEqual({
      ...navigationContext,
      applicationCode: 'MX99010',
    });
    expect(component.applicationContextRows()).toEqual([
      { label: 'Applicant', value: 'Mrs Sam Smith Test Person' },
      { label: 'Respondent', value: 'Mr John Smith' },
      { label: 'Application code', value: 'MX99010' },
      {
        label: 'Application title',
        value: 'Application for a private prosecution summons',
      },
      { label: 'Date', value: '2025-04-23', format: 'date' },
      { label: 'Fee', value: 'Yes' },
      { label: 'Resulted', value: 'No' },
    ]);
    expect(component.form.getRawValue()).toEqual({
      applicationNotes: 'Existing application notes',
      additionalNotes: '',
    });
    expect(component.form.controls.applicationNotes.disabled).toBe(true);
    expect(component.additionalNotesCharacterLimit()).toBe(3973);
  });

  it('shows the selected application context in a table', () => {
    const element = fixture.nativeElement as HTMLElement;
    const rows = Array.from(
      element.querySelectorAll<HTMLTableRowElement>('.govuk-table__row'),
    ).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent?.trim()),
    );

    expect(
      element.querySelector('.govuk-table__caption')?.textContent?.trim(),
    ).toBe('Selected application');
    expect(rows).toEqual([
      ['Applicant', 'Mrs Sam Smith Test Person'],
      ['Respondent', 'Mr John Smith'],
      ['Application code', 'MX99010'],
      ['Application title', 'Application for a private prosecution summons'],
      ['Date', '23 Apr 2025'],
      ['Fee', 'Yes'],
      ['Resulted', 'No'],
    ]);
  });

  it('omits selected application context rows when values are not provided', () => {
    component.context.set({
      id: 'entry-1',
      applicant: 'Mrs Sam Smith Test Person',
      respondent: null,
      title: '',
      date: ' ',
      fee: 'No',
      resulted: null,
    });
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const rows = Array.from(
      element.querySelectorAll<HTMLTableRowElement>('.govuk-table__row'),
    ).map((row) =>
      Array.from(row.children).map((cell) => cell.textContent?.trim()),
    );

    expect(rows).toEqual([
      ['Applicant', 'Mrs Sam Smith Test Person'],
      ['Fee', 'No'],
    ]);
  });

  it('shows the character counter only for Additional Notes', () => {
    const element = fixture.nativeElement as HTMLElement;
    const additionalNotes = element.querySelector<HTMLTextAreaElement>(
      'textarea[name="additionalNotes"]',
    );

    expect(element.querySelector('#application-notes-hint')).toBeNull();
    expect(
      element
        .querySelector('#application-notes')
        ?.getAttribute('aria-describedby'),
    ).toBeNull();
    expect(additionalNotes?.maxLength).toBe(3973);
    expect(
      element.querySelector('#additional-notes-hint')?.textContent,
    ).toContain('You have 3973 characters remaining');
  });

  it('links breadcrumbs and cancel action back to Applications', () => {
    const element = fixture.nativeElement as HTMLElement;
    const breadcrumbLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.govuk-breadcrumbs__link'),
    );
    const cancelLink = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('a.govuk-link'),
    ).find((link) => link.textContent?.trim() === 'Cancel');

    expect(breadcrumbLinks).toHaveLength(1);
    expect(breadcrumbLinks[0].textContent?.trim()).toBe('Applications');
    expect(breadcrumbLinks[0].getAttribute('href')).toBe('/applications');
    expect(cancelLink?.getAttribute('href')).toBe('/applications');
  });

  it('navigates back to Applications without loading notes when route ids are missing', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate').mockResolvedValue(true);
    const originalParamMap = routeStub.snapshot.paramMap;

    try {
      routeStub.snapshot.paramMap = convertToParamMap({});
      entriesApiStub.getApplicationListEntryFromClosedList.mockClear();

      const freshFixture = TestBed.createComponent(UpdateNotesComponent);
      freshFixture.detectChanges();

      expect(navigateSpy).toHaveBeenCalledWith(['/applications']);
      expect(
        entriesApiStub.getApplicationListEntryFromClosedList,
      ).not.toHaveBeenCalled();
    } finally {
      routeStub.snapshot.paramMap = originalParamMap;
    }
  });

  it('shows an error summary item when application notes cannot be loaded', async () => {
    entriesApiStub.getApplicationListEntryFromClosedList.mockReturnValue(
      throwError(() => new Error('load failed')),
    );

    const freshFixture = TestBed.createComponent(UpdateNotesComponent);
    const freshComponent = freshFixture.componentInstance;
    freshFixture.detectChanges();
    await freshFixture.whenStable();

    expect(freshComponent.errorSummaryItems()).toEqual([
      { text: 'Unable to load application notes' },
    ]);
  });

  it('saves additional notes using the closed entry update endpoint', () => {
    component.form.controls.additionalNotes.setValue('Court admin note');

    component.onSaveAdditionalNotes();

    expect(
      entriesApiStub.updateClosedApplicationListEntry,
    ).toHaveBeenCalledWith(
      {
        listId: 'list-1',
        entryId: 'entry-1',
        entryUpdateClosedDto: {
          additionalNotes: 'Court admin note',
        },
      },
      'body',
      false,
      { transferCache: false },
    );
    expect(component.errorSummaryItems()).toEqual([]);
    expect(component.successMessage()).toBe(
      'Application entry updated successfully',
    );
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('app-success-banner')
        ?.textContent,
    ).toContain('Additional application notes have been added successfully');
    expect(component.form.getRawValue()).toEqual({
      applicationNotes: 'Existing application notes Court admin note',
      additionalNotes: '',
    });
    expect(component.isSubmitting()).toBe(false);
  });

  it('uses returned notes from the save response when available', () => {
    entriesApiStub.updateClosedApplicationListEntry.mockReturnValue(
      of({ notes: 'Updated notes returned by API' }),
    );
    component.form.controls.additionalNotes.setValue('Court admin note');

    component.onSaveAdditionalNotes();

    expect(component.form.getRawValue()).toEqual({
      applicationNotes: 'Updated notes returned by API',
      additionalNotes: '',
    });
    expect(component.additionalNotesCharacterLimit()).toBe(3970);
    expect(component.form.controls.additionalNotes.pristine).toBe(true);
    expect(component.form.controls.additionalNotes.touched).toBe(false);
  });

  it('does not save when additional notes exceed the remaining character limit', () => {
    component.form.controls.additionalNotes.setValue(
      'a'.repeat(component.additionalNotesCharacterLimit() + 1),
    );

    component.onSaveAdditionalNotes();

    expect(
      entriesApiStub.updateClosedApplicationListEntry,
    ).not.toHaveBeenCalled();
    expect(component.errorSummaryItems()).toEqual([
      {
        id: 'additional-notes',
        href: '#additional-notes',
        text: 'Additional notes must be 3973 characters or fewer',
      },
    ]);
    expect(component.isAdditionalNotesInvalid()).toBe(true);
  });

  it.each([
    [404, 'Application List Entry not found'],
    [409, 'Application List Entry cannot be updated in its current state'],
    [500, 'Unable to save notes. Please try again later'],
  ])('shows a mapped save error for HTTP %s', (status, message) => {
    entriesApiStub.updateClosedApplicationListEntry.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status,
          }),
      ),
    );

    component.form.controls.additionalNotes.setValue('Court admin note');
    component.onSaveAdditionalNotes();

    expect(component.successMessage()).toBeNull();
    expect(component.errorSummaryItems()).toEqual([{ text: message }]);
    expect(component.isSubmitting()).toBe(false);
  });
});
