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

type FieldKey =
  | 'date'
  | 'time'
  | 'description'
  | 'status'
  | 'court'
  | 'location'
  | 'cja';

type CreateListPayload = {
  date: string | null;
  time: string | null;
  description: string;
  status: string;
  court?: string;
  otherLocationDescription?: string;
  cja?: string;
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
  ) {}

  cja: CriminalJusticeAreaGetDto[] = [];
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

  // Create: Store unpopulated fields
  unpopField: string[] = [];
  createInvalid: boolean = false;
  createDone: boolean = false;

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
      const court = has(value.court);
      const loc = has(value.location);
      const cja = has(value.cja);

      let mutex = false; // Court XOR (Location & CJA)

      // Record unpopulated required fields
      (['date', 'time', 'description', 'status'] as const).forEach((k) => {
        if (!has(value[k])) {
          this.unpopField.push(k);
        }
      });

      if (court && (loc || cja)) {
        mutex = true;
        this.createInvalid = true;
      }

      if (!court && !(loc && cja)) {
        if (!loc) {
          this.unpopField.push('location');
        }
        if (!cja) {
          this.unpopField.push('cja');
        }
      }

      // show error hint if any required fields unpopuluated
      if (this.unpopField.length) {
        this.createInvalid = true; // Ensures the create was invalid
        if (!mutex) {
          this.errorHint = 'Please fill in all the required fields:';
        } else {
          this.errorHint =
            'Please fill in all the required fields and provide either Court OR Location AND CJA, not both:';
        }
        return;
      } else if (mutex) {
        this.errorHint =
          'Please provide either Court OR Location AND CJA, not both.';
        return;
      }

      this.createInvalid = false;
    }

    if (!this.createInvalid) {
      const { date, time, description, status, court, location, cja } =
        this.form.getRawValue();

      // Format {hours: int, minutes: int} to string 'hh:mm:00
      const fmtTime = (
        t: { hours: number | null; minutes: number | null } | null | undefined,
      ): string | null => {
        if (!t || t.hours === null || t.minutes === null) {
          return null;
        }
        const hh = String(t.hours).padStart(2, '0');
        const mm = String(t.minutes).padStart(2, '0');
        return `${hh}:${mm}:00`;
      };

      const has = (x: unknown) =>
        x !== null && x !== undefined && x !== '' && x !== 'choose';
      const useCourt = has(court);

      const payload: CreateListPayload = {
        date: date ?? null,
        time: fmtTime(time),
        description: (description ?? '').trim(),
        status: status?.toUpperCase() as string,
        ...(useCourt
          ? { court: court as string }
          : {
              otherLocationDescription: location as string,
              cja: cja as string,
            }),
      };

      console.log(payload);

      // TODO: send object

      this.createDone = true;
    }
  }

  loadLists(): void {
    // TODO: fetch lists
    this.loadCourtLocations();
    this.loadCJAs();

    // TODO: Render lists into UI
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

    // keep reactive form in sync so submit payload includes 'court'
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

    // keep reactive form in sync so submit payload includes 'cja'
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
