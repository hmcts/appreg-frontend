/**
 * Contains applications-list-detail#list-details update logic + validation
 *
 * onUpdate:
    - Input validation
    - Window confirmation of update
    - Create payload with If-match etag in header
    - PUT request sent with payload and row ID

  On close, navigate to applications-list/:id/close confirmation page
 */

import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  ApplicationsListDetailState,
  DetailForm,
  DetailFormGroupErrors,
  UpdateReq,
  clearUpdateNotificationsPatch,
} from '../util';

import { ApplicationsListFormComponent } from '@components/applications-list-form/applications-list-form.component';
import { SuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { DETAIL_ERROR_ANCHORS } from '@constants/application-list-detail-update/error-hrefs';
import {
  CLOSE_MESSAGES,
  DETAIL_FIELD_MESSAGES,
} from '@constants/application-list-detail-update/error-messages';
import {
  ApplicationCodesApi,
  ApplicationListEntriesApi,
  ApplicationListUpdateDto,
  EntryGetDetailDto,
  GetApplicationCodeByCodeAndDateRequestParams,
  GetApplicationListEntryRequestParams,
} from '@openapi';
import { AppListNavState } from '@shared-types/applications-list/applications-list-form';
import { buildNormalizedPayload } from '@util/build-payload';
import { buildFormErrorSummary } from '@util/error-summary';
import { PlaceFieldsState } from '@util/place-fields.base';
import { ApplicationListRow } from '@util/types/application-list/types';

@Component({
  selector: 'app-applications-list-update',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    ApplicationsListFormComponent,
  ],
  templateUrl: './applications-list-update.component.html',
})
export class ApplicationsListUpdateComponent {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);
  private readonly appCodesApi = inject(ApplicationCodesApi);
  private readonly router = inject(Router);

  private readonly loadEntryDetailsReq = signal<
    GetApplicationListEntryRequestParams[] | null
  >(null);
  private readonly loadCodeDetailsReq = signal<
    | {
        entryId: string;
        params: GetApplicationCodeByCodeAndDateRequestParams;
      }[]
    | null
  >(null);

  private readonly closeAttempted = signal(false);

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

  requestAllEntryIds = output<void>();

  suggestionsFacade = input.required<SuggestionsFacade>();

  readonly listRow = input<ApplicationListRow | undefined>(undefined);

  private readonly hrefs = {
    date: `#${DETAIL_ERROR_ANCHORS.date}`,
    time: `#${DETAIL_ERROR_ANCHORS.time}`,
    duration: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
  } as const;

  // Run a query to get entry details
  // Needed for list close validation
  private readonly syncEntryIds = effect(() => {
    const ids = this.entryIds() ?? [];
    const status = this.form().controls.status.value;
    const shouldRunCloseValidation =
      this.closeAttempted() && status === 'closed';

    if (!shouldRunCloseValidation) {
      // Prevent any pre-loading on page render
      this.loadEntryDetailsReq.set(null);
      this.loadCodeDetailsReq.set(null);
      return;
    }

    // Only now build requests
    this.loadEntryDetailsReq.set(
      ids.length
        ? ids.map((entryId) => ({ listId: this.id(), entryId }))
        : null,
    );
  });

  onUpdate(): void {
    // reset flags/errors
    this.patchState()(clearUpdateNotificationsPatch());

    this.form().markAllAsTouched();
    this.form().updateValueAndValidity({ emitEvent: false });

    const isClosing =
      this.form().getRawValue().status?.toLowerCase() === 'closed';
    this.closeAttempted.set(isClosing);

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

      // Nav to close list page
      if (isClosing) {
        const state: AppListNavState = {
          listRow: this.listRow(),
          closeRequest: {
            id: this.id(),
            payload,
            etag: this.etag(),
          },
        };
        void this.router.navigate(['/applications-list', this.id(), 'close'], {
          state,
        });
        return;
      }

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

  // Error hightlighting/summary for closing a list
  hasCloseErrors(): boolean {
    const gErrs = this.form().errors as DetailFormGroupErrors | null;
    return (gErrs?.closeNotPermitted?.noClose?.length ?? 0) > 0;
  }

  closeErrorText(): string {
    return CLOSE_MESSAGES.closeInvalid;
  }

  hasDurationCloseError(): boolean {
    return !!this.form().get('duration')?.errors?.['closeDurationMissing'];
  }

  durationCloseErrorText(): string {
    const errors = this.form().get('duration')?.errors as
      | Record<string, unknown>
      | null
      | undefined;
    const v = errors?.['durationErrorText'];
    return typeof v === 'string' ? v : '';
  }

  private buildUpdateErrorSummary(): ErrorItem[] {
    const items = buildFormErrorSummary(this.form(), DETAIL_FIELD_MESSAGES, {
      hrefs: this.hrefs,
      priorityKeys: {
        date: ['dateInvalid', 'required'],
      },
    });

    this.replaceDurationErrors(items);
    this.addCloseValidationErrors(items);

    return this.dedupeById(items);
  }

  private addCloseValidationErrors(items: ErrorItem[]): void {
    const gErrs = this.form().errors as DetailFormGroupErrors | null;
    const closeReasons = gErrs?.closeNotPermitted?.noClose;
    if (!closeReasons) {
      return;
    }

    const durationHasCloseError =
      !!this.form().get('duration')?.errors?.['closeDurationMissing'];

    closeReasons.forEach((reason, idx) => {
      // Remove dupe duration errors as there's 2 durations fields
      if (
        durationHasCloseError &&
        (reason === CLOSE_MESSAGES.durationMissing ||
          reason === CLOSE_MESSAGES.durationNonPositive)
      ) {
        return;
      }

      items.push({
        // dedupeById() removes dupe IDs. For close have unique IDs
        id: `status-close-${idx + 1}`,
        href: '#status',
        text: reason,
      });
    });
  }

  private replaceDurationErrors(items: ErrorItem[]): void {
    const durCtrl = this.form().get('duration');
    const errs = durCtrl?.errors as Record<string, unknown> | null;
    if (!errs) {
      return;
    }

    // remove generic duration entry if util added it
    for (let i = items.length - 1; i >= 0; i--) {
      if (items[i].id === 'duration') {
        items.splice(i, 1);
      }
    }

    const hoursText = this.getString(errs, 'hoursErrorText');
    const minsText = this.getString(errs, 'minutesErrorText');
    const durationText = this.getString(errs, 'durationErrorText');

    if (hoursText) {
      items.push({
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: hoursText,
      });
    }

    if (minsText) {
      items.push({
        id: DETAIL_ERROR_ANCHORS.duration_minutes,
        href: `#${DETAIL_ERROR_ANCHORS.duration_minutes}`,
        text: minsText,
      });
    }

    // close validation
    if (!hoursText && !minsText && durationText) {
      items.push({
        id: DETAIL_ERROR_ANCHORS.duration_hours,
        href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
        text: durationText,
      });
      return;
    }

    // fallback: duration invalid but no part message
    if (!hoursText && !minsText) {
      const msgMap = DETAIL_FIELD_MESSAGES.duration;

      // check known keys only
      const fallbackKeys: (keyof typeof msgMap)[] = ['durationInvalid'];

      for (const k of fallbackKeys) {
        if (errs[k]) {
          items.push({
            id: DETAIL_ERROR_ANCHORS.duration_hours,
            href: `#${DETAIL_ERROR_ANCHORS.duration_hours}`,
            text: msgMap[k],
          });
          break;
        }
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

  private buildCodeDetailRequests(entries: EntryGetDetailDto[]): {
    entryId: string;
    params: GetApplicationCodeByCodeAndDateRequestParams;
  }[] {
    return entries
      .map((entry) => ({
        entryId: entry.id,
        params: {
          code: entry.applicationCode,
          date: entry.lodgementDate?.slice(0, 10) ?? '',
        },
      }))
      .filter(
        (
          req,
        ): req is {
          entryId: string;
          params: GetApplicationCodeByCodeAndDateRequestParams;
        } => Boolean(req.params.code && req.params.date),
      )
      .map((req) => ({
        entryId: req.entryId,
        params: req.params,
      }));
  }
}
