import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TransferState } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import {
  ApplicationListCreateDto,
  ApplicationListStatus,
  ApplicationListsApi,
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from '../../..//generated/openapi';
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

type UnpopItem = string | { id: string; text: string };
type FieldKey =
  | 'date'
  | 'time'
  | 'description'
  | 'status'
  | 'court'
  | 'location'
  | 'cja';

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
  ],
  templateUrl: './applications-list-create.html',
})
export class ApplicationsListCreate implements OnInit {
  private _id: number | undefined;

  constructor(
    private route: ActivatedRoute,
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

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? '';
    this.submitted = true;

    // Reset
    this.unpopField = [];
    this.createInvalid = false;
    this.createDone = false;
    this.errorHint = '';

    const formValues = this.form.getRawValue();

    this.form.patchValue({
      date: formValues.date,
      description: formValues.description,
      status: formValues.status,
      court: formValues.court,
      location: formValues.location,
      cja: formValues.cja,
    });

    // Prevent accidental submissions, button has to be clicked
    if (action === 'create') {
      const value = this.form.value as Record<FieldKey, unknown>;
      const has = (x: unknown) =>
        x !== null && x !== undefined && x !== '' && x !== 'choose'; // Conditions for unpopulated
      const push = (id: string, text: string) =>
        this.unpopField.push({ id, text });
      const court = has(value.court);
      const loc = has(value.location);
      const cja = has(value.cja);

      // Record unpopulated required fields
      if (!has(value.date)) {
        push('date-day', 'Enter day, month and year');
      }
      if (!has(value.time)) {
        push('time', 'Enter hours and minutes');
      }
      if (!has(value.description)) {
        push('description', 'Description is required');
      }
      if (!has(value.status) || value.status === 'choose') {
        push('status', 'Status is required');
      }

      // Court XOR (Location & CJA):
      if (!court) {
        if (!loc) {
          push('location', 'Other location is required');
        }
        if (!cja) {
          push('cja', 'CJA is required');
        }
      }

      if (!(loc || cja)) {
        if (!court) {
          push('court', 'Court is required');
        }
      }

      // show error hint if any required fields unpopuluated
      if (this.unpopField.length) {
        this.createInvalid = true; // Ensures the create was invalid
        this.errorHint = 'Error - please check your inputs:';
        return;
      }

      this.createInvalid = false;
    }

    if (!this.createInvalid) {
      const { date, time, description, status, court, location, cja } =
        this.form.getRawValue();

      // Format {hours: int, minutes: int} to string 'hh:mm:00
      const toTimeString = (
        t: { hours: number | null; minutes: number | null } | null,
      ): string => {
        // Double check if time is not null
        if (!t || t.hours === null || t.minutes === null) {
          throw new Error('time required');
        }
        const hh = String(t.hours).padStart(2, '0');
        const mm = String(t.minutes).padStart(2, '0');
        return `${hh}:${mm}:00`;
      };

      // Ensures type based on spec
      const toStatus = (s: unknown): ApplicationListStatus => {
        switch (String(s).toUpperCase()) {
          case 'OPEN':
            return ApplicationListStatus.OPEN;
          case 'CLOSED':
            return ApplicationListStatus.CLOSED;
          default:
            throw new Error('Invalid status');
        }
      };

      const has = (x: unknown) =>
        x !== null && x !== undefined && x !== '' && x !== 'choose';
      const useCourt = has(court);
      const hasCourtAndLocOrCja = has(court) && (has(location) || has(cja));

      if (hasCourtAndLocOrCja) {
        // In case the user manages to input both court and location or cja
        this.createInvalid = true;
        this.errorHint =
          'You can not have Court and Other Location or CJA filled in';
        return;
      }

      const payload: ApplicationListCreateDto = {
        date: date!,
        time: toTimeString(time),
        description: (description ?? '').trim(),
        status: toStatus(status),
        ...(useCourt
          ? { courtLocationCode: court as string }
          : {
              otherLocationDescription: location as string,
              cjaCode: cja as string,
            }),
      };

      this.appLists
        .createApplicationList({ applicationListCreateDto: payload })
        .subscribe({
          next: () => {
            this.createDone = true;
          },
          error: (err) => {
            this.createDone = false;
            this.createInvalid = true;
            this.errorHint = 'An error has occurred: ' + err;
            return;
          },
        });
    }
  }

  loadLists(): void {
    this.loadCourtLocations();
    this.loadCJAs();
  }

  private loadCJAs(): void {
    this.cjaApi.getCriminalJusticeAreas().subscribe({
      next: (page) => {
        this.cja = page.content ?? [];
        // console.log(this.cja); // Sanity check
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
        // console.log(this.courtLocations); // Sanity check
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
