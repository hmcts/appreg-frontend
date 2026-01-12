/**
 * TODO: arcpoc-816
 * prio 4
 * Refactor create list flow with scattered error state and manual subscribe.
 */

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
  Input,
  OnDestroy,
  OnInit,
  TransferState,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '@components/duration-input/duration-input.component';
import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { FormRaw } from '@core-types/forms/forms.types';
import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
} from '@openapi';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { buildNormalizedPayload } from '@util/build-payload';
import { collectMissing } from '@util/collect-missing';
import {
  focusField,
  onCreateErrorClick as onCreateErrorClickFn,
} from '@util/error-click';
import { getProblemText } from '@util/http-error-to-text';
import { validateCourtVsLocOrCja } from '@util/location-suggestion-helpers';
import { PlaceFieldsBase } from '@util/place-fields.base';

type FieldKey =
  | 'date'
  | 'time'
  | 'description'
  | 'status'
  | 'court'
  | 'location'
  | 'cja';

type CreateFormRaw = Omit<
  FormRaw<ApplicationListStatus>,
  'date' | 'time' | 'status'
> & {
  date: string | null;
  time: Duration | null;
  status: string | null;
};

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
export class ApplicationsListCreate
  extends PlaceFieldsBase
  implements OnInit, OnDestroy
{
  private _id: number | undefined;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly appLists: ApplicationListsApi,
    private readonly refField: ReferenceDataFacade,
  ) {
    super();
  }

  // Banner/Error state that drives the reusable components
  unpopField: ErrorItem[] = [];
  createInvalid: boolean = false;
  createDone: boolean = false;
  @Input() submitted: boolean = false;

  errorHint: string = 'There is a problem'; // Error summary heading text
  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints
  focusField = focusField;

  statusOptions = [
    { value: '', label: 'Choose status' },
    { value: 'open', label: 'Open' },
    { value: 'closed', label: 'Closed' },
  ];

  @Input() listId?: string;

  // If the field is populated and invalid it will return true and stored here
  invalidField: Record<FieldKey, boolean | null> = {
    date: null,
    time: null,
    description: null,
    status: null,
    court: null,
    location: null,
    cja: null,
  };

  // Reactive form backing the template
  override form = new FormGroup(
    {
      date: new FormControl<string | null>(null),
      time: new FormControl<Duration | null>(null),
      description: new FormControl<string>(''),
      status: new FormControl<string>('open'),
      court: new FormControl<string>('', { updateOn: 'change' }),
      location: new FormControl<string>('', { updateOn: 'change' }),
      cja: new FormControl<string>('', { updateOn: 'change' }),
    },
    { updateOn: 'submit' },
  );

  currentPage = 1;
  totalPages = 5;

  tableRows: {
    id: number;
    date: string;
    time: string;
    location: string;
    description: string;
    entries: number | string;
    status: string;
  }[] = [];

  ngOnInit(): void {
    this.initPlaceFields(this.form, this.refField);
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const action = (event.submitter as HTMLButtonElement | null)?.value ?? '';
    this.submitted = true;

    this.resetCreateState();

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
        this.unpopField = missing;
        this.createInvalid = true;
        return;
      }

      // Passed validation
      this.createInvalid = false;
    }

    if (this.createInvalid) {
      return;
    }

    const conflict = validateCourtVsLocOrCja(raw);
    if (conflict) {
      this.createInvalid = true;
      this.errorHint = conflict;
      return;
    }

    const payload = this.buildPayload(raw);
    this.appLists
      .createApplicationList({ applicationListCreateDto: payload })
      .subscribe({
        next: () => {
          this.createDone = true;
        },
        error: (err) => {
          const msg = getProblemText(err);
          this.submitted = true;
          this.createInvalid = true;
          this.unpopField = [
            {
              text: msg,
              href: '#create',
              id: 'create',
            },
          ];
        },
      });
  }

  private resetCreateState(): void {
    this.unpopField = [];
    this.createInvalid = false;
    this.createDone = false;
    this.errorHint = 'There is a problem';
  }

  private buildPayload(raw: CreateFormRaw): ApplicationListCreateDto {
    return buildNormalizedPayload(raw) as ApplicationListCreateDto;
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }
}
