import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TransferState } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { ErrorSummaryComponent } from '../../shared/components/error-summary/error-summary.component';
import type { ErrorItem } from '../../shared/components/error-summary/error-summary.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { attachLocationDisabler } from '../../shared/util/attach-location-disabler';
import {
  onCjaInputChange,
  onCourthouseInputChange,
  selectCja as selectCjaHelper,
  selectCourthouse as selectCourthouseHelper,
} from '../../shared/util/court-cja-text-suggestions';
import { has } from '../../shared/util/has';
import { toTimeString } from '../../shared/util/time-helpers';
import { toStatus } from '../../shared/util/to-status';

type FieldKey =
  | 'date'
  | 'time'
  | 'description'
  | 'status'
  | 'court'
  | 'location'
  | 'cja';

type CreateFormRaw = Pick<ApplicationListCreateDto, 'date' | 'description'> & {
  time: { hours: number | null; minutes: number | null } | null;
  status: string | ApplicationListStatus | null;
  court: string | null;
  location: string | null;
  cja: string | null;
};

// Make shared helper functions stricter locally
function assertString(v: string | undefined, msg: string): asserts v is string {
  if (typeof v !== 'string') {
    throw new Error(msg);
  }
}

function assertStatus<T>(v: T | undefined, msg: string): asserts v is T {
  if (v === undefined) {
    throw new Error(msg);
  }
}

function requireTime(t: Parameters<typeof toTimeString>[0]): string {
  const v = toTimeString(t);
  assertString(v, 'time is required');
  return v;
}

function requireStatus(
  s: Parameters<typeof toStatus>[0],
): ApplicationListStatus {
  const v = toStatus(s);
  assertStatus<ApplicationListStatus>(v, 'status is required');
  return v;
}

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DateInputComponent,
    DurationInputComponent,
    TextInputComponent,
    SelectInputComponent,
    FormsModule,
    SuggestionsComponent,
    BreadcrumbsComponent,
    SuccessBannerComponent,
    ErrorSummaryComponent,
  ],
  templateUrl: './applications-list-create.html',
})
export class ApplicationsListCreate implements OnInit {
  private _id: number | undefined;
  private locationDisabler?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly appLists: ApplicationListsApi,
    private readonly ref: ReferenceDataFacade,
  ) {}

  cja: CriminalJusticeAreaGetDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

  // Banner/Error state that drives the reusable components
  unpopField: ErrorItem[] = [];
  createInvalid: boolean = false;
  createDone: boolean = false;
  @Input() submitted: boolean = false;

  errorHint: string = ''; // Error summary heading text

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
  form = new FormGroup(
    {
      date: new FormControl<string | null>(null),
      time: new FormControl<Duration | null>(null),
      description: new FormControl<string>(''),
      status: new FormControl<string>('choose'),
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
    this.courthouseSearch = String(this.form.controls.court.value ?? '');
    this.cjaSearch = String(this.form.controls.cja.value ?? '');

    this.loadLists();

    // Disable based fields
    this.locationDisabler = attachLocationDisabler({
      court: this.form.controls.court,
      location: this.form.controls.location,
      cja: this.form.controls.cja,
    });
  }

  ngOnDestroy(): void {
    this.locationDisabler?.unsubscribe();
  }

  public focusField(id: string, ev?: Event): void {
    ev?.preventDefault();
    this.focusByIdOrFirstFocusable(id);
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const action = (event.submitter as HTMLButtonElement | null)?.value ?? '';
    this.submitted = true;

    this.resetCreateState();

    const raw = this.form.getRawValue() as CreateFormRaw;
    this.form.patchValue({
      date: raw.date,
      description: raw.description,
      status: raw.status,
      court: raw.court,
      location: raw.location,
      cja: raw.cja,
    });

    if (action === 'create') {
      const missing = this.collectMissing(raw);
      if (missing.length) {
        this.unpopField = missing;
        this.createInvalid = true;
        this.errorHint = 'Error - please check your inputs:';
        return;
      }
      this.createInvalid = false;
    }

    if (this.createInvalid) {
      return;
    }

    const conflict = this.validateCourtVsLocOrCja(raw);
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
          const msg = err instanceof Error ? err.message : String(err);
          this.createDone = false;
          this.createInvalid = true;
          this.errorHint = 'An error has occurred: \n' + msg;
        },
      });
  }

  // Handle click from ErrorSummary to focus a field
  onCreateErrorClick(item: ErrorItem): void {
    const id = item.id ?? '';
    if (!id) {
      return;
    }
    this.focusByIdOrFirstFocusable(id);
  }

  private focusByIdOrFirstFocusable(id: string): void {
    const root = document.getElementById(id);
    if (!root) {
      return;
    }

    // smooth scroll to the block
    try {
      root.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      root.scrollIntoView(true);
    }

    // pick the real focus target (input/select/textarea or any focusable)
    const selector =
      'input,select,textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
    const target: HTMLElement = root.matches(selector)
      ? root
      : (root.querySelector<HTMLElement>(selector) ?? root);

    // focus after the scroll completes
    setTimeout(() => target.focus?.({ preventScroll: true }), 50);
  }

  private resetCreateState(): void {
    this.unpopField = [];
    this.createInvalid = false;
    this.createDone = false;
    this.errorHint = '';
  }

  private collectMissing(v: CreateFormRaw): { id: string; text: string }[] {
    const out: { id: string; text: string }[] = [];
    const need = (ok: boolean, id: string, text: string) => {
      if (!ok) {
        out.push({ id, text });
      }
    };

    const dateCtrl = this.form.controls.date;
    const timeCtrl = this.form.controls.time;

    if (!dateCtrl.errors?.['dateInvalid']) {
      need(has(v.date), 'date-day', 'Enter day, month and year');
    } else {
      need(
        has(v.date),
        'date-day',
        dateCtrl.errors?.['dateErrorText'] as string,
      );
    }

    if (!timeCtrl.errors?.['durationErrorText']) {
      need(has(v.time), 'time-hours', 'Enter hours and minutes');
    } else {
      need(
        false,
        'time-hours',
        timeCtrl.errors?.['durationErrorText'] as string,
      );
    }

    need(has(v.description), 'description', 'Description is required');
    need(has(v.status), 'status', 'Status is required');

    const court = has(v.court);
    const loc = has(v.location);
    const cja = has(v.cja);

    if (!court) {
      need(loc, 'location', 'Other location is required');
      need(cja, 'cja', 'CJA is required');
    }
    if (!(loc || cja) && !court) {
      out.push({ id: 'court', text: 'Court is required' });
    }
    return out;
  }

  private validateCourtVsLocOrCja(v: CreateFormRaw): string | null {
    const court = has(v.court);
    const loc = has(v.location);
    const cja = has(v.cja);
    return court && (loc || cja)
      ? 'You can not have Court and Other Location or CJA filled in'
      : null;
  }

  private buildPayload(raw: CreateFormRaw): ApplicationListCreateDto {
    const useCourt = has(raw.court);
    return {
      date: raw.date,
      time: requireTime(raw.time),
      description: (raw.description ?? '').trim(),
      status: requireStatus(raw.status),
      ...(useCourt
        ? { courtLocationCode: raw.court as string }
        : {
            otherLocationDescription: raw.location as string,
            cjaCode: raw.cja as string,
          }),
    };
  }

  loadLists(): void {
    this.ref.courtLocations$.subscribe(
      (items) => (this.courtLocations = items),
    );
    this.ref.cja$.subscribe((items) => (this.cja = items));
  }

  onCourthouseInputChange(): void {
    this.filteredCourthouses = onCourthouseInputChange(
      this.form,
      this.courthouseSearch,
      this.courtLocations,
    );
  }

  onCjaInputChange(): void {
    this.filteredCja = onCjaInputChange(this.form, this.cjaSearch, this.cja);
  }

  selectCourthouse(
    c: { locationCode?: string } | CourtLocationGetSummaryDto,
  ): void {
    const { courthouseSearch, filteredCourthouses } = selectCourthouseHelper(
      this.form,
      c,
    );
    this.courthouseSearch = courthouseSearch;
    this.filteredCourthouses = filteredCourthouses;
  }

  selectCja(c: { code?: string } | CriminalJusticeAreaGetDto): void {
    const { cjaSearch, filteredCja } = selectCjaHelper(this.form, c);
    this.cjaSearch = cjaSearch;
    this.filteredCja = filteredCja;
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLists(); // fetch page `page`
  }
}
