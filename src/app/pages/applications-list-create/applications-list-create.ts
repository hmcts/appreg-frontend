/*
Applications List – Create (/applications-list/create)

Functionality:
  - Submits form via POST to create a new application list
  - buildPayload(): maps form fields → ApplicationListCreateDto
    • Uses courtLocationCode or (otherLocationDescription + cjaCode)
  - Handles API errors with errorSummary messages
  - Uses text-suggestion helpers for court/CJA inputs
*/

import { CommonModule } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { CreateFormRaw } from './util/applications-list-create-types';
import {
  ApplicationsListCreateState,
  clearNotificationsPatch,
  initialApplicationsListCreateState,
} from './util/applications-list-create.state';

import { APPLICATIONS_LIST_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { ApplicationListCreateDto, ApplicationListsApi } from '@openapi';
import { ApplicationsListFormService } from '@services/applications-list-form.service';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { buildNormalizedPayload } from '@util/build-payload';
import { collectMissing } from '@util/collect-missing';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    DurationInputComponent,
    TextInputComponent,
    FormsModule,
    SuggestionsComponent,
    BreadcrumbsComponent,
    SuccessBannerComponent,
    ErrorSummaryComponent,
  ],
  templateUrl: './applications-list-create.html',
})
export class ApplicationsListCreate extends PlaceFieldsBase implements OnInit {
  // APIs
  private readonly appLists = inject(ApplicationListsApi);
  private readonly refField = inject(ReferenceDataFacade);

  private readonly formSvc = inject(ApplicationsListFormService);

  // Signal initialisation
  private readonly appListCreatesignalState =
    createSignalState<ApplicationsListCreateState>(
      initialApplicationsListCreateState,
    );
  private readonly appListCreateState = this.appListCreatesignalState.state;
  readonly vm = this.appListCreatesignalState.vm;
  private readonly envInjector = inject(EnvironmentInjector);

  private readonly createRequest = signal<ApplicationListCreateDto | null>(
    null,
  );

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  // Reactive form backing the template
  override form = this.formSvc.createCreateForm();

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);
    this.setupEffects();
  }

  // Signal driven requests
  private setupEffects(): void {
    setupLoadEffect(
      {
        request: this.createRequest,
        load: (params) =>
          this.appLists.createApplicationList({
            applicationListCreateDto: params,
          }),
        onSuccess: () => {
          this.appListCreatesignalState.patch({ createDone: true });
          this.createRequest.set(null);
        },
        onError: (err) => {
          const msg = getProblemText(err);
          this.appListCreatesignalState.patch({
            submitted: true,
            createInvalid: true,
            errorHint: 'There is a problem',
            errorSummary: [{ text: msg, href: '#create', id: 'create' }],
          });
          this.createRequest.set(null);
        },
      },
      this.envInjector,
    );
  }

  private buildPayload(raw: CreateFormRaw): ApplicationListCreateDto {
    return buildNormalizedPayload(raw) as ApplicationListCreateDto;
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    const action = (event.submitter as HTMLButtonElement | null)?.value ?? '';
    this.appListCreatesignalState.patch({ submitted: true });
    this.appListCreatesignalState.patch(clearNotificationsPatch());

    const raw = this.form.getRawValue() as CreateFormRaw;

    const { errors, errorHint } = this.collectSubmitErrors(action, raw);

    if (errors.length) {
      this.appListCreatesignalState.patch({
        createInvalid: true,
        errorHint,
        errorSummary: errors,
      });
      return;
    }

    this.appListCreatesignalState.patch({
      createInvalid: false,
      errorHint: '',
    });

    const payload = this.buildPayload(raw);
    this.createRequest.set(payload);
  }

  /**
   * Builds ALL validation errors so they appear together.
   * Keeps onSubmit clean.
   * TODO: Refactor to use Angular FormGroup validation instead of manual checks
   */
  private collectSubmitErrors(
    action: string,
    raw: CreateFormRaw,
  ): { errors: ErrorItem[]; errorHint: string } {
    const errors: ErrorItem[] = [];

    if (action === 'create') {
      const dateErrors = this.form.controls.date.errors as {
        dateInvalid?: boolean;
        dateErrorText?: string;
      } | null;

      const timeErrors = this.form.controls.time.errors as {
        durationErrorText?: string;
      } | null;

      errors.push(
        ...collectMissing(raw, {
          dateInvalid: !!dateErrors?.dateInvalid,
          dateErrorText: dateErrors?.dateErrorText ?? '',
          durationErrorText: timeErrors?.durationErrorText ?? '',
        }),
      );
    }

    const conflict = validateCourtVsLocOrCja(raw);
    if (conflict) {
      errors.push({ id: 'court', href: '#court', text: conflict });
    }

    // ---- CJA validation (required + not-found) ----
    const court = String(raw.court ?? '').trim();
    const location = String(raw.location ?? '').trim();
    const cjaCode = String(raw.cja ?? '').trim();
    const cjaSearch = String(this.state().cjaSearch ?? '').trim();

    const needsCja = !court && location.length > 0; // only required in “other location” path
    const attemptedCja = cjaSearch.length > 0 || cjaCode.length > 0;

    // If user typed something but didn't select a valid code, show "not found"
    if (attemptedCja && cjaCode.length === 0) {
      errors.push({
        id: 'cja',
        href: '#cja',
        text: APPLICATIONS_LIST_ERROR_MESSAGES.cjaNotFound,
      });
    } else if (cjaCode.length > 0) {
      const exists = this.state().cja.some((x) => x.code === cjaCode);
      if (!exists) {
        errors.push({
          id: 'cja',
          href: '#cja',
          text: APPLICATIONS_LIST_ERROR_MESSAGES.cjaNotFound,
        });
      }
    } else if (needsCja) {
      // Only “required” when other location is being used
      errors.push({
        id: 'cja',
        href: '#cja',
        text: 'CJA is required',
      });
    }

    return { errors, errorHint: errors.length ? 'There is a problem' : '' };
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e) => e.id === id);
  }
}
