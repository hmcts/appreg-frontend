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

import { ApplicationList } from '../../core/models/application-list';
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
  dateInvalid: boolean | null = null;
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

  // Lists to display in the table
  lists: ApplicationList[] = [];

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

    this.loadApplications();
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement | null;
    const action = btn?.value ?? 'search';

    if (action === 'search') {
      // TODO: Add data validation for each form value
      const formValues = this.form.getRawValue();

      this.form.patchValue({
        description: formValues.description,
        status: formValues.status,
        court: formValues.court,
        location: formValues.location,
        cja: formValues.cja,
      });

      // console.log(this.form.value);
      // console.log(this.form.controls.date.errors?.['dateInvalid']);
      this.invalidField.date = this.form.controls.date.errors?.[
        'dateInvalid'
      ] as boolean | null;
    } else if (action === 'create') {
      // TODO: handle create using `values`
    }
  }

  loadApplications(): void {
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
    this.loadApplications(); // fetch page `page`
  }
}
