import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TransferState } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { merge } from 'rxjs';

import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '../../../generated/openapi';
import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import {
  ErrorSummaryComponent,
} from '../../shared/components/error-summary/error-summary.component';
import type { ErrorItem } from '../../shared/components/error-summary/error-summary.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SuccessBannerComponent } from '../../shared/components/success-banner/success-banner.component';
import { SuggestionsComponent } from '../../shared/components/suggestions/suggestions.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

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

  constructor(
    private readonly route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtLocationApi: CourtLocationsApi,
    private readonly appLists: ApplicationListsApi,
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
    // TODO: use cached data

    this.loadLists();

    // Disable based fields
    const court = this.form.controls.court;
    const location = this.form.controls.location;
    const cja = this.form.controls.cja;

    const has = (v: string | null) => !!v && v.trim().length > 0;
    const syncDisable = () => {
      const hasCourt = has(court.value);
      const hasLoc = has(location.value);
      const hasCja = has(cja.value);

      if (hasCourt) {
        court.enable({ emitEvent: false });
        location.disable({ emitEvent: false });
        cja.disable({ emitEvent: false });
      } else if (hasLoc || hasCja) {
        court.disable({ emitEvent: false });
        location.enable({ emitEvent: false });
        cja.enable({ emitEvent: false });
      } else {
        court.enable({ emitEvent: false });
        location.enable({ emitEvent: false });
        cja.enable({ emitEvent: false });
      }
    };

    merge(
      court.valueChanges,
      location.valueChanges,
      cja.valueChanges,
    ).subscribe(() => syncDisable());
    syncDisable();

    // Suggestions
    const currentCourthouse = this.form.controls.court.value;
    if (typeof currentCourthouse === 'string' && currentCourthouse.trim()) {
      this.courthouseSearch = currentCourthouse;
    }

    const currentCja = this.form.controls.cja.value;
    if (typeof currentCja === 'string' && currentCja.trim()) {
      this.cjaSearch = currentCja;
    }
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

    need(this.has(v.date), 'date', 'Enter day, month and year');
    need(this.has(v.time), 'time', 'Enter hours and minutes');
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
    this.loadCourtLocations();
    this.loadCJAs();
  }

  private loadCJAs(): void {
    this.cjaApi.getCriminalJusticeAreas().subscribe({
      next: (page) => {
        this.cja = page.content ?? [];
      },
      error: () => {
        this.cja = [];
      },
    });
  }

  private loadCourtLocations(): void {
    this.courtLocationApi.getCourtLocations().subscribe({
      next: (page) => {
        this.courtLocations = page.content ?? [];
      },
      error: () => {
        this.courtLocations = [];
      },
    });
  }

  onCourthouseInputChange(): void {
    const q = this.courthouseSearch.trim().toLowerCase();
    this.form.controls.court.setValue(this.courthouseSearch || '');

    if (!q) {
      this.filteredCourthouses = [];
      return;
    }

    // filter by name or code; cap results to avoid long lists
    this.filteredCourthouses = this.courtLocations
      .filter(
        (c) =>
          (c.name ?? '').toLowerCase().includes(q) ||
          (c.locationCode ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }

  // called when user clicks a suggestion
  selectCourthouse(c: CourtLocationGetSummaryDto): void {
    const label = c.locationCode ?? '';
    this.courthouseSearch = label;
    this.form.controls.court.setValue(label);
    this.filteredCourthouses = [];
  }

  onCjaInputChange(): void {
    const q = this.cjaSearch.trim().toLowerCase();
    this.form.controls.cja.setValue(this.cjaSearch || '');

    if (!q) {
      this.filteredCja = [];
      return;
    }

    // filter by name or code; cap results to avoid long lists
    this.filteredCja = this.cja
      .filter(
        (c) =>
          (c.code ?? '').toLowerCase().includes(q) ||
          (c.description ?? '').toLowerCase().includes(q),
      )
      .slice(0, 20);
  }

  // called when user clicks a suggestion
  selectCja(c: CriminalJusticeAreaGetDto): void {
    const label = c.code ?? '';
    this.cjaSearch = label;
    this.form.controls.cja.setValue(label);
    this.filteredCja = [];
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLists(); // fetch page `page`
  }
}
