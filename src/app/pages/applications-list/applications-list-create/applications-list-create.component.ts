/*
Applications List – Create (/applications-list/create)

Functionality:
  - Submits form via POST to create a new application list
  - buildPayload(): maps form fields → ApplicationListCreateDto
    • Uses courtLocationCode or (otherLocationDescription + cjaCode)
  - Handles API errors with errorSummary messages
  - Uses text-suggestion helpers for court/CJA inputs
*/

import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  Component,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CreateFormRaw } from './util/applications-list-create-types';
import {
  ApplicationsListCreateState,
  clearNotificationsPatch,
  initialApplicationsListCreateState,
} from './util/applications-list-create.state';

import { APPLICATIONS_LIST_CREATE_FORM_ERROR_MESSAGES } from '@components/applications-list/util/applications-list.constants';
import {
  ApplicationEntriesResultContext,
  toRow,
} from '@components/applications-list-entry-detail/util/routing-state-util';
import { ApplicationsListFormComponent } from '@components/applications-list-form/applications-list-form.component';
import { buildSuggestionsFacade } from '@components/applications-list-form/facade/applications-list-form.facade';
import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { ApplicationListCreateDto, ApplicationListsApi } from '@openapi';
import { ApplicationsListFormService } from '@services/applications-list/applications-list-form.service';
import { buildApplicationsListErrorSummary } from '@services/applications-list/build-applications-list-error-summary';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { buildNormalizedPayload } from '@util/build-payload';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import { ApplicationListRow } from '@util/types/application-list/types';
import { cjaMustExistIfTypedValidator } from '@validators/cja-exists.validator';
import { courtMustExistIfTypedValidator } from '@validators/court-exists.validator';
import { courtLocCjaValidator } from '@validators/court-or-cja.validator';

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    BreadcrumbsComponent,
    ErrorSummaryComponent,
    ApplicationsListFormComponent,
  ],
  templateUrl: './applications-list-create.component.html',
})
export class ApplicationsListCreate extends PlaceFieldsBase implements OnInit {
  // APIs
  private readonly appLists = inject(ApplicationListsApi);
  private readonly refField = inject(ReferenceDataFacade);

  private readonly formSvc = inject(ApplicationsListFormService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);

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

  suggestionsFacade = buildSuggestionsFacade(this);

  fromMoveApplications = signal(false);
  breadcrumbs = signal([
    { label: 'Applications list', link: '/applications-list' },
  ]);

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

    // If we are coming from /applications-list/:id/move
    if (isPlatformBrowser(this.platformId)) {
      const navState = history.state as {
        createMoveTargetList?: boolean;
        originalListId?: string;
        entriesToMove?: ApplicationEntriesResultContext[];
      };

      this.appListCreatesignalState.patch({
        listId: navState.originalListId ?? '',
        entriesToMove: navState.entriesToMove,
      });

      if (
        navState.createMoveTargetList &&
        !this.appListCreateState().listId &&
        !this.appListCreateState().entriesToMove.length
      ) {
        void this.router.navigate(['/applications-list']);
      }

      // render cancel button
      this.fromMoveApplications.set(navState.createMoveTargetList ?? false);

      if (this.appListCreateState().listId) {
        this.breadcrumbs.set([
          { label: 'Applications list', link: '/applications-list' },
          {
            label: 'Applications list details',
            link: `/applications-list/${this.appListCreateState().listId}`,
          },
        ]);
      }
    }
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
        onSuccess: async (response) => {
          // Nav to move-confirm page instead
          if (this.fromMoveApplications()) {
            const targetListDetails: ApplicationListRow = toRow(response);

            void this.router.navigate(
              ['applications-list', response.id, 'move', 'confirm'],
              {
                state: {
                  targetList: targetListDetails,
                  originalListId: this.appListCreateState().listId,
                  entriesToMove: this.appListCreateState().entriesToMove,
                },
              },
            );
            return;
          }

          await this.router.navigate(['applications-list', response.id], {
            queryParams: { listCreated: true },
            fragment: 'list-details',
          });
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

  // This button is only shown when we navigate here from move applications page
  onCancel(): void {
    const { listId, entriesToMove } = this.appListCreateState();

    if (!listId || !entriesToMove.length) {
      void this.router.navigate(['/applications-list']);
      return;
    }

    void this.router.navigate(['/applications-list', listId, 'move'], {
      state: { entriesToMove },
    });
  }

  private keys<T extends object>(o: T): (keyof T)[] {
    return Object.keys(o) as (keyof T)[];
  }

  private buildErrorSummary(): ErrorItem[] {
    return buildApplicationsListErrorSummary(this.form, this.errorMap, {
      priorityKeys: {
        date: ['dateInvalid', 'required'],
      },
    });
  }
}
