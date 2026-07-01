import { HttpErrorResponse } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { of, throwError } from 'rxjs';

import {
  UpdateNotesApplicationContext,
  UpdateNotesComponent,
} from '@components/applications-list-detail/update-notes/update-notes.component';
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
    respondent: 'Mr John Smith',
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
    expect(component.applicationContextLine()).toBe(
      'MX99010 Application for a private prosecution summons',
    );
    expect(component.form.getRawValue()).toEqual({
      applicationNotes: 'Existing application notes',
      additionalNotes: '',
    });
    expect(component.form.controls.applicationNotes.disabled).toBe(true);
  });

  it('shows the character counter only for Additional Notes', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('#application-notes-hint')).toBeNull();
    expect(
      element
        .querySelector('#application-notes')
        ?.getAttribute('aria-describedby'),
    ).toBeNull();
    expect(
      element.querySelector('#additional-notes-hint')?.textContent,
    ).toContain('You have 400 characters remaining');
  });

  it('links breadcrumbs and return action back to Applications', () => {
    const element = fixture.nativeElement as HTMLElement;
    const breadcrumbLinks = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('.govuk-breadcrumbs__link'),
    );
    const returnLink = Array.from(
      element.querySelectorAll<HTMLAnchorElement>('a.govuk-link'),
    ).find((link) => link.textContent?.trim() === 'Return to Applications');

    expect(breadcrumbLinks).toHaveLength(1);
    expect(breadcrumbLinks[0].textContent?.trim()).toBe('Applications');
    expect(breadcrumbLinks[0].getAttribute('href')).toBe('/applications');
    expect(returnLink?.getAttribute('href')).toBe('/applications');
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
    expect(component.form.controls.additionalNotes.pristine).toBe(true);
    expect(component.form.controls.additionalNotes.touched).toBe(false);
  });

  it('does not save when additional notes exceed 400 characters', () => {
    component.form.controls.additionalNotes.setValue('a'.repeat(401));

    component.onSaveAdditionalNotes();

    expect(
      entriesApiStub.updateClosedApplicationListEntry,
    ).not.toHaveBeenCalled();
    expect(component.errorSummaryItems()).toEqual([
      {
        id: 'additional-notes',
        href: '#additional-notes',
        text: 'Additional Notes must be 400 characters or fewer',
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
