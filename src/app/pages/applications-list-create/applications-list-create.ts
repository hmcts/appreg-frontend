import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TransferState } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '../../../generated/openapi';
import { ReferenceDataFacade } from '../../core/services/reference-data.facade';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { attachLocationDisabler } from '../../shared/util/attach-location-disabler';
import {
  cjaMatches,
  courtMatches,
  filterSuggestions,
} from '../../shared/util/suggestions';

type UnpopItem = string | { id: string; text: string };
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
    RouterLink,
    FormsModule,
    SuggestionsComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: './applications-list-create.html',
})
export class ApplicationsListCreate implements OnInit {
  private _id: number | undefined;
  private locationDisabler?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtLocationApi: CourtLocationsApi,
    private readonly appLists: ApplicationListsApi,
    private readonly ref: ReferenceDataFacade,
  ) {}

  cja: CriminalJusticeAreaGetDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

  // Create: Store unpopulated fields
  unpopField: UnpopItem[] = [];
  createInvalid: boolean = false;
  createDone: boolean = false;
  @Input() submitted = false;

  errorHint: string = ''; // Page hint when error occurs

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

  private resetCreateState(): void {
    this.unpopField = [];
    this.createInvalid = false;
    this.createDone = false;
    this.errorHint = '';
  }

  private has(x: unknown): boolean {
    return x !== null && x !== undefined && x !== '' && x !== 'choose';
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
      need(this.has(v.date), 'date-day', 'Enter day, month and year');
    } else {
      need(
        this.has(v.date),
        'date-day',
        dateCtrl.errors?.['dateErrorText'] as string,
      );
    }

    if (!timeCtrl.errors?.['durationErrorText']) {
      need(this.has(v.time), 'time-hours', 'Enter hours and minutes');
    } else {
      need(
        false,
        'time-hours',
        timeCtrl.errors?.['durationErrorText'] as string,
      );
    }

    need(this.has(v.description), 'description', 'Description is required');
    need(this.has(v.status), 'status', 'Status is required');

    const court = this.has(v.court);
    const loc = this.has(v.location);
    const cja = this.has(v.cja);

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
    const court = this.has(v.court);
    const loc = this.has(v.location);
    const cja = this.has(v.cja);
    return court && (loc || cja)
      ? 'You can not have Court and Other Location or CJA filled in'
      : null;
  }

  private toTimeString = (
    t: { hours: number | null; minutes: number | null } | null,
  ): string => {
    const hours = t?.hours;
    const minutes = t?.minutes;
    if (hours === null || minutes === null) {
      throw new Error('time required');
    }

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    return `${hh}:${mm}:00`;
  };

  private toStatus(s: unknown): ApplicationListStatus {
    switch (String(s).toUpperCase()) {
      case 'OPEN':
        return ApplicationListStatus.OPEN;
      case 'CLOSED':
        return ApplicationListStatus.CLOSED;
      default:
        throw new Error('Invalid status');
    }
  }

  private buildPayload(raw: CreateFormRaw): ApplicationListCreateDto {
    const useCourt = this.has(raw.court);
    return {
      date: raw.date,
      time: this.toTimeString(raw.time),
      description: (raw.description ?? '').trim(),
      status: this.toStatus(raw.status),
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
    this.form.controls.court.setValue(this.courthouseSearch || '');
    this.filteredCourthouses = filterSuggestions(
      this.courtLocations,
      this.courthouseSearch,
      courtMatches,
    );
  }

  onCjaInputChange(): void {
    this.form.controls.cja.setValue(this.cjaSearch || '');
    this.filteredCja = filterSuggestions(this.cja, this.cjaSearch, cjaMatches);
  }

  selectCourthouse(c: { locationCode?: string }): void {
    const label = c.locationCode ?? '';
    this.courthouseSearch = label;
    this.form.controls.court.setValue(label);
    this.filteredCourthouses = [];
  }

  selectCja(c: { code?: string }): void {
    const label = c.code ?? '';
    this.cjaSearch = label;
    this.form.controls.cja.setValue(label);
    this.filteredCja = [];
  }

  focusField(id: string, e: Event): void {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.focus({ preventScroll: true });
    }
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLists(); // fetch page `page`
  }
}
