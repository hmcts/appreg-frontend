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

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { DurationInputComponent } from '@components/duration-input/duration-input.component';
import { ErrorSummaryComponent } from '@components/error-summary/error-summary.component';
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
  private readonly signalState = createSignalState<ApplicationsListCreateState>(
    initialApplicationsListCreateState,
  );
  private readonly state = this.signalState.state;
  readonly vm = this.signalState.vm;
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
          this.signalState.patch({ createDone: true });
          this.createRequest.set(null);
        },
        onError: (err) => {
          const msg = getProblemText(err);
          this.signalState.patch({
            submitted: true,
            createInvalid: true,
            unpopField: [{ text: msg, href: '#create', id: 'create' }],
          });
        },
      },
      this.envInjector,
    );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const action = (event.submitter as HTMLButtonElement | null)?.value ?? '';
    this.signalState.patch({ submitted: true });

    this.signalState.patch(clearNotificationsPatch());

    const raw = this.form.getRawValue() as CreateFormRaw;

    if (action === 'create') {
      const dateErrors = this.form.controls.date.errors as {
        dateInvalid?: boolean;
        dateErrorText?: string;
      } | null;
      const timeErrors = this.form.controls.time.errors as {
        durationErrorText?: string;
      } | null;

      const missing = collectMissing(raw, {
        dateInvalid: !!dateErrors?.dateInvalid,
        dateErrorText: dateErrors?.dateErrorText ?? '',
        durationErrorText: timeErrors?.durationErrorText ?? '',
      });

      if (missing.length) {
        this.signalState.patch({ unpopField: missing, createInvalid: true });
        return;
      }

      this.signalState.patch({ createInvalid: false });
    }

    const conflict = validateCourtVsLocOrCja(raw);
    if (conflict) {
      this.signalState.patch({ createInvalid: true, errorHint: conflict });
      return;
    }

    if (this.state().createInvalid) {
      return;
    }

    const payload = this.buildPayload(raw);
    this.createRequest.set(payload);
  }

  private buildPayload(raw: CreateFormRaw): ApplicationListCreateDto {
    return buildNormalizedPayload(raw) as ApplicationListCreateDto;
  }
}
