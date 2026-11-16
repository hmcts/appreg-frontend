import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import {
  ApplicationListEntriesApi,
  EntryGetDetailDto,
  EntryUpdateDto,
} from '@openapi';
import { ApplicationListEntryFormService } from '@services/applications-list-entry/application-list-entry-form.service';
import { ApplicationListEntryForms } from '@shared-types/applications-list-entry-create/application-list-entry-form';

type SavedContent = ReturnType<
  ApplicationListEntryFormService['editableContent']
>;

@Injectable()
export class EntryDetailSaveFacade {
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly formService = inject(ApplicationListEntryFormService);

  prepareSubmittedContent(
    forms: ApplicationListEntryForms,
    savedContent?: SavedContent,
  ): SavedContent {
    const submittedContent = this.formService.editableContent(forms);
    if (Array.isArray(submittedContent.form.feeStatuses)) {
      // The mapper sends table rows instead of the unadded fee-entry fields.
      for (const field of [
        'feeStatus',
        'feeStatusDate',
        'paymentRef',
      ] as const) {
        submittedContent.form[field] = savedContent?.form[field] ?? null;
      }
    }
    return submittedContent;
  }

  save(
    listId: string,
    entryId: string,
    entryUpdateDto: EntryUpdateDto,
    submittedContent: SavedContent,
  ): Observable<{ entry: EntryGetDetailDto; submittedContent: SavedContent }> {
    return this.entriesApi
      .updateApplicationListEntry(
        { listId, entryId, entryUpdateDto },
        'body',
        false,
        { context: undefined, transferCache: false },
      )
      .pipe(map((entry) => ({ entry, submittedContent })));
  }
}
