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

import { APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
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
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';
import { courtMustExistIfTypedValidator } from '@validators/court-exists.validator';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

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
  templateUrl: './applications-list-create.component.html',
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

  private readonly errorMap = APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES;

  // Reactive form backing the template
  override form = this.formSvc.createCreateForm();

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);
    this.setupEffects();

    //Attach validators
    this.form.addValidators([
      courtLocCjaValidator({
        getCourtTyped: () => this.state().courthouseSearch ?? '',
        getCjaTyped: () => this.state().cjaSearch ?? '',
      }),
      cjaMustExistIfTypedValidator({
        getTyped: () => this.state().cjaSearch ?? '',
        getValidCodes: () => this.state().cja.map((x) => x.code),
      }),
      courtMustExistIfTypedValidator({
        getTyped: () => this.state().courthouseSearch ?? '',
        getValidCodes: () =>
          this.state().courtLocations.map((x) => x.locationCode),
      }),
    ]);
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

    this.appListCreatesignalState.patch({ submitted: true });
    this.appListCreatesignalState.patch(clearNotificationsPatch());

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    const errors = this.buildErrorSummary();
    if (errors.length) {
      this.appListCreatesignalState.patch({
        createInvalid: true,
        errorHint: 'There is a problem',
        errorSummary: errors,
      });
      return;
    }

    this.appListCreatesignalState.patch({
      createInvalid: false,
      errorHint: '',
      errorSummary: [],
    });

    const payload = this.buildPayload(this.form.getRawValue() as CreateFormRaw);
    this.createRequest.set(payload);
  }

  fieldError(id: string): ErrorItem | undefined {
    return this.vm().errorSummary.find((e) => e.id === id);
  }

  private keys<T extends object>(o: T): (keyof T)[] {
    return Object.keys(o) as (keyof T)[];
  }

  private buildErrorSummary(): ErrorItem[] {
    const items: ErrorItem[] = [];

    for (const controlName of this.keys(this.errorMap)) {
      const ctrl = this.form.get(String(controlName));
      if (!ctrl?.errors) {
        continue;
      }

      const msgMap = this.errorMap[controlName];

      for (const k of Object.keys(ctrl.errors)) {
        if (!(k in msgMap)) {
          continue;
        }

        const errorKey = k as keyof typeof msgMap;
        const controlId =
          controlName === 'time' ? 'time-hours' : String(controlName);

        items.push({
          id: String(controlId),
          href: `#${String(controlId)}`,
          text: msgMap[errorKey],
        });
      }
    }

    return items;
  }
}
