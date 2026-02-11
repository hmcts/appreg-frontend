import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';

import { ApplicationsListDetailState } from '../util/applications-list-detail.state';
import {
  DetailForm,
  DetailFormGroupErrors,
  UpdateReq,
  selectedRow,
} from '../util/applications-list-detail.types';

import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { DETAIL_ERROR_ANCHORS } from '@constants/application-list-detail-update/error-hrefs';
import {
  CLOSE_MESSAGES,
  DETAIL_FIELD_MESSAGES,
} from '@constants/application-list-detail-update/error-messages';
import { ApplicationListEntriesApi, ApplicationListUpdateDto } from '@openapi';
import { buildNormalizedPayload } from '@util/build-payload';
import { getProblemText } from '@util/http-error-to-text';
import { PlaceFieldsState } from '@util/place-fields.base';
import { setupLoadEffect } from '@util/signal-state-helpers';
import { CloseValidationEntry } from '@validators/applications-list-close.validator';

@Component({
  selector: 'app-applications-list-detail-list-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DurationInputComponent,
    DateInputComponent,
    TextInputComponent,
    SelectInputComponent,
    SuggestionsComponent,
  ],
  templateUrl: './applications-list-detail-list-details.component.html',
})
export class ApplicationsListDetailListDetailsComponent implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);
  private readonly loadEntryDetailsReq = signal<string[] | null>(null);

  readonly form = input.required<DetailForm>();

  readonly statusOptions = input.required<{ value: string; label: string }[]>();

  readonly placeState = input.required<PlaceFieldsState>();

  readonly id = input.required<string>();
  readonly etag = input.required<string | null>();
  readonly entryIds = input.required<string[]>();

  readonly patchState =
    input.required<(patch: Partial<ApplicationsListDetailState>) => void>();
  readonly vm = input.required<ApplicationsListDetailState>();

  readonly setUpdateRequest = input.required<(req: UpdateReq | null) => void>();

  readonly courthouseInputChange = output<void>();
  readonly cjaInputChange = output<void>();
  readonly selectCourthouse = output<unknown>();
  readonly selectCja = output<unknown>();

  // Run a query to get entry details
  // Needed for list close validation
  private readonly syncEntryIds = effect(() => {
    const ids = this.entryIds();
    this.loadEntryDetailsReq.set(ids?.length ? ids : null);
  });

  ngOnInit(): void {
    setupLoadEffect(
      {
        request: this.loadEntryDetailsReq,
        load: (ids: string[]) => {
          if (!ids.length) {
            return of([]);
          }
          return forkJoin(
            ids.map((entryId) =>
              this.appListEntryApi.getApplicationListEntry({
                listId: this.id(),
                entryId,
              }),
            ),
          );
        },
        onSuccess: (res) => {
          this.patchState()({
            entriesDetails: res,
          });
          this.loadEntryDetailsReq.set(null);
        },
        onError: (err: unknown) => {
          this.patchState()({
            errorHint: getProblemText(err),
            errorSummary: [{ text: getProblemText(err) }],
            selectedIds: new Set<string>(),
          });
          this.loadEntryDetailsReq.set(null);
        },
      },
      this.envInjector,
    );
  }

  onUpdate(): void {
    // reset flags/errors
    this.patchState()({
      updateInvalid: false,
      updateDone: false,
      errorSummary: [],
      errorHint: '',
    });

    this.form().markAllAsTouched();
    this.form().updateValueAndValidity({ emitEvent: false });

    const raw = this.form().getRawValue();

    const errors = this.buildUpdateErrorSummary();
    if (errors.length) {
      this.patchState()({
        updateInvalid: true,
        errorHint: 'There is a problem',
        errorSummary: errors,
      });
      return;
    }

    // build payload
    const dur = this.form().controls.duration.value;
    const durationHours = this.toNum(dur?.hours);
    const durationMinutes = this.toNum(dur?.minutes);

    try {
      const normalized = buildNormalizedPayload(raw);
      const payload: ApplicationListUpdateDto = {
        ...normalized,
        ...(Number.isInteger(durationHours) ? { durationHours } : {}),
        ...(Number.isInteger(durationMinutes) ? { durationMinutes } : {}),
      } as ApplicationListUpdateDto;

      this.setUpdateRequest()({
        id: this.id(),
        payload,
        etag: this.etag(),
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.patchState()({
        updateInvalid: true,
        errorHint: msg,
      });
    }
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e: ErrorItem) => e.id === id);
  }

  private buildUpdateErrorSummary(): ErrorItem[] {
    const items: ErrorItem[] = [];

    const gErrs = this.form().errors as DetailFormGroupErrors | null;
    const conflictMsg = gErrs?.courtLocCjaConflict?.message;
    if (conflictMsg) {
      items.push({ id: 'court', text: conflictMsg });
    }

    // Closing applications list error checks
    const closeReasons = gErrs?.closeNotPermitted?.noClose;
    if (closeReasons) {
      const durationHasCloseError =
        !!this.form().get('duration')?.errors?.['closeDurationMissing'];
      closeReasons.forEach((reason, idx) => {
        // Remove dupe duration errors as there's 2 input fields we check here
        if (
          durationHasCloseError &&
          reason === CLOSE_MESSAGES.durationMissing
        ) {
          return;
        }
        items.push({
          id: `status-close-${idx + 1}`, // dedupeById removes dupe IDs so introduce unique ID for status
          href: '#status',
          text: reason,
        });
      });
    }

    for (const name of this.detailFields()) {
      const control = this.form().get(name);
      const errs = control?.errors;
      if (!errs) {
        continue;
      }

      if (name === 'duration') {
        this.pushDurationErrors(items, errs);
        continue;
      }

      const msg = this.errorTextFromControl(errs, DETAIL_FIELD_MESSAGES[name]);
      if (!msg) {
        continue;
      }

      items.push({ id: this.anchorFor(name), text: msg });
    }

    return this.dedupeById(items);
  }

  private detailFields(): (keyof typeof DETAIL_FIELD_MESSAGES)[] {
    return Object.keys(
      DETAIL_FIELD_MESSAGES,
    ) as (keyof typeof DETAIL_FIELD_MESSAGES)[];
  }

  private anchorFor(name: keyof typeof DETAIL_FIELD_MESSAGES): string {
    switch (name) {
      case 'date':
        return DETAIL_ERROR_ANCHORS.date;
      case 'time':
        return DETAIL_ERROR_ANCHORS.time;
      default:
        return name as string;
    }
  }

  private pushDurationErrors(
    items: ErrorItem[],
    errs: Record<string, unknown>,
  ): void {
    const hoursText = this.getString(errs, 'hoursErrorText');
    const minsText = this.getString(errs, 'minutesErrorText');

    if (hoursText) {
      items.push({ id: DETAIL_ERROR_ANCHORS.duration_hours, text: hoursText });
    }
    if (minsText) {
      items.push({ id: DETAIL_ERROR_ANCHORS.duration_minutes, text: minsText });
    }

    // fallback if duration invalid but no specific part message
    if (!hoursText && !minsText) {
      const msg = this.errorTextFromControl(
        errs,
        DETAIL_FIELD_MESSAGES.duration,
      );
      if (msg) {
        items.push({ id: DETAIL_ERROR_ANCHORS.duration_hours, text: msg });
      }
    }
  }

  private getString(obj: Record<string, unknown>, key: string): string | null {
    const v = obj[key];
    return typeof v === 'string' && v.trim() ? v : null;
  }

  private dedupeById(items: ErrorItem[]): ErrorItem[] {
    const seen = new Set<string>();
    const out: ErrorItem[] = [];

    for (const item of items) {
      if (!item.id) {
        continue;
      }
      if (seen.has(item.id)) {
        continue;
      }
      seen.add(item.id);
      out.push(item);
    }
    return out;
  }

  private errorTextFromControl(
    controlErrors: Record<string, unknown>,
    messages: Record<string, string> | undefined,
  ): string | null {
    // Prefer explicit payload text if present (duration component)
    const textPayloadKeys = [
      'durationErrorText',
      'hoursErrorText',
      'minutesErrorText',
    ] as const;

    for (const k of textPayloadKeys) {
      const v = controlErrors[k];
      if (typeof v === 'string' && v.trim()) {
        return v;
      }
    }

    // Otherwise use message map keys
    if (messages) {
      for (const key of Object.keys(controlErrors)) {
        const msg = messages[key];
        if (msg) {
          return msg;
        }
      }
    }

    return null;
  }

  private toNum(v: string | number | null | undefined): number | undefined {
    if (v === null || v === undefined) {
      return undefined;
    }

    if (typeof v === 'number') {
      return Number.isFinite(v) ? v : undefined;
    }

    const s = v.trim();
    if (s === '') {
      return undefined;
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : undefined;
  }
}

export const closeValidationEntries = (
  vm: ApplicationsListDetailState,
): CloseValidationEntry[] => {
  const rows = vm.rows as selectedRow[];
  const details = vm.entriesDetails;
  const hasOfficials =
    details.length === rows.length &&
    details.every((entry) => (entry.officials?.length ?? 0) > 0);

  console.log(details);

  return rows.map((row) => ({
    id: row.id,
    hasResult: row.resulted === 'Yes',
    hasFees: row.feeReq === 'Yes',
    hasRespondent: !!row.respondent?.toString().trim(),
    hasOfficials,
  }));
};
