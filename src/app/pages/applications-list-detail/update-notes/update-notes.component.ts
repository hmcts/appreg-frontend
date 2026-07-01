import { isPlatformBrowser } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
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
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { ApplicationListEntriesApi, EntryGetDetailDto } from '@openapi';
import {
  focusErrorSummary,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { formatPartyName } from '@util/string-helpers';

export type UpdateNotesApplicationContext = {
  id: string;
  sequenceNumber?: number;
  applicant: string | null;
  date?: string | null;
  fee?: string | null;
  respondent: string | null;
  resulted?: string | null;
  title: string | null;
  applicationCode?: string | null;
};

type ApplicationContextTableRow = {
  label: string;
  value: string;
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
    SuccessBannerComponent,
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
  readonly successMessage = signal<string | null>(null);
  readonly isSubmitting = signal(false);

  onCreateErrorClick = onCreateErrorClickFn;

  readonly applicationContextRows = computed(
    (): ApplicationContextTableRow[] => {
      const application = this.context();

      if (!application) {
        return [];
      }

      return [
        this.toContextRow('Applicant', application.applicant),
        this.toContextRow('Respondent', application.respondent),
        this.toContextRow('Application code', application.applicationCode),
        this.toContextRow('Application title', application.title),
        this.toContextRow('Date', application.date),
        this.toContextRow('Fee', application.fee),
        this.toContextRow('Resulted', application.resulted),
      ].filter((row): row is ApplicationContextTableRow => row !== null);
    },
  );

  readonly form = new FormGroup({
    applicationNotes: new FormControl<string | null>({
      value: '',
      disabled: true,
    }),
    additionalNotes: new FormControl<string | null>('', [
      Validators.maxLength(400),
    ]),
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

  private toContextRow(
    label: string,
    value: string | null | undefined,
  ): ApplicationContextTableRow | null {
    const trimmedValue = value?.trim();

    return trimmedValue ? { label, value: trimmedValue } : null;
  }

  private loadEntry(): void {
    if (!this.listId || !this.entryId) {
      this.errorSummaryItems.set([
        { text: 'Unable to load application notes' },
      ]);
      return;
    }

    this.entriesApi
      .getApplicationListEntryFromClosedList({
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

  isAdditionalNotesInvalid(): boolean {
    const control = this.form.controls.additionalNotes;
    return control.invalid && (control.dirty || control.touched);
  }

  additionalNotesError(): string | null {
    const control = this.form.controls.additionalNotes;

    if (control.hasError('maxlength')) {
      return 'Additional Notes must be 400 characters or fewer';
    }

    return null;
  }

  onSaveAdditionalNotes(): void {
    if (this.isSubmitting()) {
      return;
    }

    const control = this.form.controls.additionalNotes;
    control.markAsTouched();
    control.updateValueAndValidity();
    this.successMessage.set(null);

    if (control.invalid) {
      this.errorSummaryItems.set([
        {
          id: 'additional-notes',
          href: '#additional-notes',
          text: this.additionalNotesError() ?? 'Enter valid additional notes',
        },
      ]);
      focusErrorSummary(this.platformId);
      return;
    }

    if (!this.listId || !this.entryId) {
      this.errorSummaryItems.set([
        { text: 'Unable to save notes. Please try again later' },
      ]);
      focusErrorSummary(this.platformId);
      return;
    }

    this.isSubmitting.set(true);
    this.errorSummaryItems.set([]);

    this.entriesApi
      .updateClosedApplicationListEntry(
        {
          listId: this.listId,
          entryId: this.entryId,
          entryUpdateClosedDto: {
            additionalNotes: control.value ?? '',
          },
        },
        'body',
        false,
        { transferCache: false },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response: unknown) => {
          this.isSubmitting.set(false);
          this.errorSummaryItems.set([]);
          this.applySavedAdditionalNotes(response, control.value ?? '');
          this.successMessage.set('Application entry updated successfully');
        },
        error: (err) => {
          this.isSubmitting.set(false);
          this.handleSaveError(err);
        },
      });
  }

  private handleSaveError(err: unknown): void {
    const status = err instanceof HttpErrorResponse ? err.status : undefined;
    const text =
      status === 404
        ? 'Application List Entry not found'
        : status === 409
          ? 'Application List Entry cannot be updated in its current state'
          : 'Unable to save notes. Please try again later';

    this.successMessage.set(null);
    this.errorSummaryItems.set([{ text }]);
    focusErrorSummary(this.platformId);
  }

  private applySavedAdditionalNotes(
    response: unknown,
    additionalNotes: string,
  ): void {
    const returnedNotes = this.getReturnedNotes(response);
    const currentNotes = this.form.controls.applicationNotes.value ?? '';

    this.form.patchValue({
      applicationNotes:
        returnedNotes ??
        this.appendAdditionalNotes(currentNotes, additionalNotes),
      additionalNotes: '',
    });
    this.form.controls.additionalNotes.markAsPristine();
    this.form.controls.additionalNotes.markAsUntouched();
  }

  private getReturnedNotes(response: unknown): string | null {
    if (!response || typeof response !== 'object') {
      return null;
    }

    const notes = (response as { notes?: unknown }).notes;
    return typeof notes === 'string' ? notes : null;
  }

  private appendAdditionalNotes(
    currentNotes: string,
    additionalNotes: string,
  ): string {
    if (!additionalNotes) {
      return currentNotes;
    }

    return currentNotes
      ? `${currentNotes} ${additionalNotes}`
      : additionalNotes;
  }

  private applyEntry(entry: EntryGetDetailDto): void {
    this.errorSummaryItems.set([]);
    this.form.patchValue({
      applicationNotes: entry.notes ?? '',
      additionalNotes: '',
    });

    const currentContext = this.context();
    this.context.set({
      ...(currentContext ?? {}),
      id: entry.id,
      applicant: currentContext?.applicant ?? formatPartyName(entry.applicant),
      respondent:
        currentContext?.respondent ?? formatPartyName(entry.respondent),
      title: currentContext?.title ?? null,
      applicationCode: entry.applicationCode,
    });
  }
}
