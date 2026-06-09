import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { ApplicationListEntriesApi, EntryGetDetailDto } from '@openapi';
import { formatPartyName } from '@util/string-helpers';

export type UpdateNotesApplicationContext = {
  id: string;
  sequenceNumber?: number;
  applicant: string | null;
  respondent: string | null;
  title: string | null;
  applicationCode?: string | null;
};

@Component({
  selector: 'app-update-notes',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    GovukTextareaComponent,
  ],
  templateUrl: './update-notes.component.html',
})
export class UpdateNotesComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly entriesApi = inject(ApplicationListEntriesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  listId = '';
  entryId = '';

  readonly context = signal<UpdateNotesApplicationContext | null>(null);
  readonly errorSummaryItems = signal<ErrorItem[]>([]);

  readonly applicationContextLine = computed(() => {
    const application = this.context();
    const parts = [application?.applicationCode, application?.title].filter(
      (value): value is string => !!value?.trim(),
    );

    return parts.join(' ');
  });

  readonly form = new FormGroup({
    applicationNotes: new FormControl<string | null>({
      value: '',
      disabled: true,
    }),
    additionalNotes: new FormControl<string | null>(''),
  });

  ngOnInit(): void {
    this.listId = this.route.snapshot.paramMap.get('id') ?? '';
    this.entryId = this.route.snapshot.paramMap.get('entryId') ?? '';
    this.context.set(this.readNavigationContext());
    this.loadEntry();
  }

  private readNavigationContext(): UpdateNotesApplicationContext | null {
    if (!isPlatformBrowser(this.platformId)) {
      return null;
    }

    return (
      (
        history.state as {
          updateNotesApplication?: UpdateNotesApplicationContext;
        }
      )?.updateNotesApplication ?? null
    );
  }

  private loadEntry(): void {
    if (!this.listId || !this.entryId) {
      this.errorSummaryItems.set([
        { text: 'Unable to load application notes' },
      ]);
      return;
    }

    this.entriesApi
      .getApplicationListEntry({
        listId: this.listId,
        entryId: this.entryId,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (entry) => this.applyEntry(entry),
        error: () => {
          this.errorSummaryItems.set([
            { text: 'Unable to load application notes' },
          ]);
        },
      });
  }

  private applyEntry(entry: EntryGetDetailDto): void {
    this.errorSummaryItems.set([]);
    this.form.patchValue({
      applicationNotes: entry.notes ?? '',
      additionalNotes: '',
    });

    const currentContext = this.context();
    this.context.set({
      id: entry.id,
      sequenceNumber: currentContext?.sequenceNumber,
      applicant: currentContext?.applicant ?? formatPartyName(entry.applicant),
      respondent:
        currentContext?.respondent ?? formatPartyName(entry.respondent),
      title: currentContext?.title ?? null,
      applicationCode: entry.applicationCode,
    });
  }
}
