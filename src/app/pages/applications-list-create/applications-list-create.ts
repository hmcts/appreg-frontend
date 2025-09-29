import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnInit,
  TransferState,
  makeStateKey,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

import {
  CourtLocationGetSummaryDto,
  CourtLocationsApi,
  CriminalJusticeAreaGetDto,
  CriminalJusticeAreasApi,
} from 'src/generated/openapi';

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
  time: Duration | null;
  description: string;
  status: string;
  court?: string;
  location?: string;
  cja?: string;
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
    RouterLink,
  ],
  templateUrl: './applications-list-create.html',
})
export class ApplicationsListCreate implements OnInit {
  private _id: number | undefined;

  NCH_KEY = makeStateKey<never[]>('nch');

  constructor(
    private route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtLocationApi: CourtLocationsApi,
  ) {}

  cja: CriminalJusticeAreaGetDto[] = [];
  courtLocations: CourtLocationGetSummaryDto[] = [];

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

  offendingFields: FieldKey[] = [];
  anyInvalid = false;

  // Reactive form backing the template
  form = new FormGroup({
    date: new FormControl<string | null>(null),
    time: new FormControl<Duration | null>(null),
    description: new FormControl<string>(''),
    status: new FormControl<string>('choose'),
    court: new FormControl<string>(''),
    location: new FormControl<string>(''),
    cja: new FormControl<string>(''),
  });

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
    // not workie rn TODO: we should try and cache data. Here we can store cached data and load.
    if (this.state.hasKey(this.NCH_KEY)) {
      this.loadLists();
      this.state.remove(this.NCH_KEY);
      return;
    }

    this.loadLists();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? '';

    // Reset
    this.unpopField = [];
    this.offendingFields = [];
    this.createInvalid = false;
    this.anyInvalid = false;
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

    // Is field valid if populated?
    for (const k of Object.keys(this.invalidField) as FieldKey[]) {
      const ctrl = this.form.controls[k];
      const errs = ctrl.errors as Record<string, unknown> | null;
      const key = `${k}Invalid`;

      if (!errs) {
        this.invalidField[k] = null;
        continue;
      }

      this.invalidField[k] = key in errs || Object.keys(errs).length > 0;
    }

    this.offendingFields = (
      Object.keys(this.invalidField) as FieldKey[]
    ).filter((k) => this.invalidField[k] === true);

    if (this.offendingFields.length) {
      this.anyInvalid = true;
      this.errorHint =
        'Error - the following field/s are incorrectly formatted';
    }

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
      // TODO: clean and create list
      // TODO: When we clean we have to ensure court && (loc || cja) is false and remove the appropriate field from the post/patch or whatever it is
    }

    if (!this.createInvalid) {

      const { date, time, description, status, court, location, cja } =
        this.form.getRawValue();
      const has = (x: unknown) =>
        x !== null && x !== undefined && x !== '' && x !== 'choose';
      const useCourt = has(court);

      const payload: CreateListPayload = {
        date,
        time,
        description: (description ?? '').trim(),
        status: status as string,
        ...(useCourt
          ? { court: court as string }
          : { location: location as string, cja: cja as string }),
      };

      console.log(payload);

      // Optional: drop undefined keys
      // const cleaned = Object.fromEntries(
      //   Object.entries(payload).filter(([, v]) => v !== undefined),
      // );

      // TODO: send object
      // this.listsApi.create(cleaned as CreateListPayload).subscribe(/* ... */);

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
    });
  }

  private loadCourtLocations(): void {
    this.courtLocationApi.getCourtLocations().subscribe({
      next: (page) => {
        this.courtLocations = page.content ?? [];
        // console.log(this.courtLocations); // Sanity check
      },
    });
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadLists(); // fetch page `page`
  }
}
