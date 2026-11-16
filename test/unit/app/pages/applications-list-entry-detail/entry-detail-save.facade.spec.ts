import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { EntryDetailSaveFacade } from '@components/applications-list-entry-detail/facades/entry-detail-save.facade';
import { ApplicationListEntriesApi, EntryUpdateDto } from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicationListEntryForms } from '@shared-types/applications-list-entry-create/application-list-entry-form';

describe('EntryDetailSaveFacade', () => {
  it('sends the full entry update and returns the API response', () => {
    const response = { id: 'entry-1' };
    const update = jest.fn().mockReturnValue(of(response));
    const submittedContent = { form: { feeStatuses: null } } as ReturnType<
      ApplicationListEntryFormService['editableContent']
    >;
    TestBed.configureTestingModule({
      providers: [
        EntryDetailSaveFacade,
        {
          provide: ApplicationListEntriesApi,
          useValue: { updateApplicationListEntry: update },
        },
        {
          provide: ApplicationListEntryFormService,
          useValue: { editableContent: jest.fn() },
        },
      ],
    });
    const dto = {} as EntryUpdateDto;
    const next = jest.fn();

    TestBed.inject(EntryDetailSaveFacade)
      .save('list-1', 'entry-1', dto, submittedContent)
      .subscribe(next);

    expect(update).toHaveBeenCalledWith(
      { listId: 'list-1', entryId: 'entry-1', entryUpdateDto: dto },
      'body',
      false,
      { context: undefined, transferCache: false },
    );
    expect(next).toHaveBeenCalledWith({ entry: response, submittedContent });
  });

  it('preserves unadded fee draft fields from the previous saved content', () => {
    const submittedContent = {
      form: {
        feeStatuses: [],
        feeStatus: 'new',
        feeStatusDate: '2026-11-16',
        paymentRef: 'new-reference',
      },
    } as unknown as ReturnType<
      ApplicationListEntryFormService['editableContent']
    >;
    const editableContent = jest.fn().mockReturnValue(submittedContent);
    TestBed.configureTestingModule({
      providers: [
        EntryDetailSaveFacade,
        { provide: ApplicationListEntriesApi, useValue: {} },
        {
          provide: ApplicationListEntryFormService,
          useValue: { editableContent },
        },
      ],
    });
    const forms = {} as ApplicationListEntryForms;
    const savedContent = {
      form: {
        feeStatus: null,
        feeStatusDate: null,
        paymentRef: null,
      },
    } as ReturnType<ApplicationListEntryFormService['editableContent']>;

    expect(
      TestBed.inject(EntryDetailSaveFacade).prepareSubmittedContent(
        forms,
        savedContent,
      ),
    ).toBe(submittedContent);
    expect(editableContent).toHaveBeenCalledWith(forms);
    expect(submittedContent.form).toMatchObject({
      feeStatus: null,
      feeStatusDate: null,
      paymentRef: null,
    });
  });
});
