import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, TransferState } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { merge } from 'rxjs';

import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import {
  Duration,
  DurationInputComponent,
} from '../../shared/components/duration-input/duration-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';
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

  constructor(
    private route: ActivatedRoute,
    private readonly state: TransferState,
    private readonly cjaApi: CriminalJusticeAreasApi,
    private readonly courtLocationApi: CourtLocationsApi,
  ) {}

  // Loaded lists
  cja: CriminalJusticeAreaGetDto[] = [];
  courtLocations: CourtLocationGetSummaryDto[] = [];
  suggestionOptions: { value: string; label: string; [k: string]: unknown }[] =
    [];

  // Check for invalid inputs on submit
  submitted = false;
  errorHint: string = ''; // Page hint when error occurs
  offendingFields: FieldKey[] = [];
  anyInvalid = false;
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
    // TODO: Use cache where possible

    this.loadApplicationsLists();
    this.loadCJAs();
    this.loadCourtLocations();

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
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    this.submitted = true;

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ onlySelf: false, emitEvent: false });

    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? '';

    // Reset
    this.offendingFields = [];
    this.anyInvalid = false;
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
      this.submitted = false;
      return;
    }

    if (action === 'search') {
      // TODO: handle search using 'values'
    }
  }

  loadApplicationsLists(): void {
    // TODO: load application lists
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

  get courtLocationOptions(): { value: string; label: string }[] {
    return this.courtLocations.map((c: CourtLocationGetSummaryDto) => ({
      value: c.name ?? '',
      label: `${c.name ?? ''} (${c.locationCode ?? ''})`,
    }));
  }

  get cjaOptions(): { value: string; label: string }[] {
    return this.cja.map((c: CriminalJusticeAreaGetDto) => ({
      value: c.code ?? '',
      label: `${c.code ?? ''} (${c.description ?? ''})`,
    }));
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadApplicationsLists(); // fetch page `page`
  }
}
