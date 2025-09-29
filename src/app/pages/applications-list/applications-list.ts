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
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

import { NationalCourtHouse } from 'src/app/core/models/national-court-house';

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
    PaginationComponent,
    SortableTableComponent,
  ],
  templateUrl: './applications-list.html',
})
export class ApplicationsList implements OnInit {
  private _id: number | undefined;

  NCH_KEY = makeStateKey<never[]>('nch');

  constructor(
    private route: ActivatedRoute,
    private readonly state: TransferState,
  ) {}

  nationalCourtHouses: NationalCourtHouse[] = [];
  courtOptions: string[] = [];

  // Create: Store unpopulated fields
  unpopField: string[] = [];
  createInvalid: boolean = false;

  errorHint: string = ''; // Page hint when error occurs

  @Input() listId?: string;

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

  columns = [
    { header: 'Date', field: 'date', sortable: true },
    { header: 'Time', field: 'time', sortable: true },
    { header: 'Location', field: 'location', sortable: true },
    { header: 'Description', field: 'description', sortable: true },
    { header: 'Entries', field: 'entries', sortable: true, numeric: true },
    { header: 'Status', field: 'status', sortable: true },
    { header: 'Actions', field: 'actions' },
  ];

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  ngOnInit(): void {
    // Use cached data from prerendering
    if (this.state.hasKey(this.NCH_KEY)) {
      this.nationalCourtHouses = this.state.get(this.NCH_KEY, []);
      this.courtOptions = this.nationalCourtHouses.map((c) =>
        c.courtLocationCode ? `${c.name} — ${c.courtLocationCode}` : c.name,
      );
      // TODO: as we add more services we need to add it here too for caching
      this.state.remove(this.NCH_KEY);
      return;
    }

    this.loadApplicationsLists();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    this.unpopField = [];
    this.createInvalid = false;
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

    if (action === 'search') {
      // TODO: handle search using 'values'
    } else if (action === 'create') {
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
      // TODO: Create list
    }
  }


  loadApplicationsLists(): void {
    // TODO: fetch lists

    // Load National Court Houses
    const raw: unknown = this.route.snapshot.data['nationalCourtHouses'];
    this.nationalCourtHouses = Array.isArray(raw)
      ? (raw as NationalCourtHouse[])
      : [];

    // UI: Datalist of court houses
    this.courtOptions = this.nationalCourtHouses.map((c) =>
      c.courtLocationCode ? `${c.name} — ${c.courtLocationCode}` : c.name,
    );
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplicationsLists(); // fetch page `page`
  }
}
