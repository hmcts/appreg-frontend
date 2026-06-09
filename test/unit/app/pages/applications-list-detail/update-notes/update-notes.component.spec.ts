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
    Pick<ApplicationListEntriesApi, 'getApplicationListEntry'>
  > = {
    getApplicationListEntry: jest.fn(),
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
    entriesApiStub.getApplicationListEntry.mockReturnValue(of(entryDetail));
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

  it('loads route ids, selected application context and existing application notes', () => {
    expect(component.listId).toBe('list-1');
    expect(component.entryId).toBe('entry-1');
    expect(entriesApiStub.getApplicationListEntry).toHaveBeenCalledWith({
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

  it('shows an error summary item when application notes cannot be loaded', async () => {
    entriesApiStub.getApplicationListEntry.mockReturnValue(
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
});
