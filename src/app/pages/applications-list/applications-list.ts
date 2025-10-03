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
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '../../shared/components/sortable-table/sortable-table.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

type ApplicationListRow = {
  id: number;
  date: string;
  time: string;
  location: string;
  description: string;
  entries: number;
  status: 'Open' | 'Closed';
};

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

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
    FormsModule,
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
  filteredCja: CriminalJusticeAreaGetDto[] = [];
  cjaSearch = '';

  courtLocations: CourtLocationGetSummaryDto[] = [];
  filteredCourthouses: CourtLocationGetSummaryDto[] = [];
  courthouseSearch = '';

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
  openMenuForId: number | null = null;
  openPrintSelectForId: number | null = null;

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

  columns: TableColumn[] = [
    { header: 'Date', field: 'date' },
    { header: 'Time', field: 'time' },
    { header: 'Location', field: 'location' },
    { header: 'Description', field: 'description' },
    { header: 'Entries', field: 'entries', numeric: true },
    { header: 'Status', field: 'status' },
    { header: 'Actions', field: 'actions', sortable: false },
  ];

  status = [
    { label: 'Choose', value: 'choose' },
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ];

  rows: ApplicationListRow[] = [];

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  ngOnInit(): void {
    // TODO: Use cache where possible


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

    // Suggestions
    const currentCourthouse = this.form.controls.court.value;
    if (typeof currentCourthouse === 'string' && currentCourthouse.trim()) {
      this.courthouseSearch = currentCourthouse;
    }

    const currentCja = this.form.controls.cja.value;
    if (typeof currentCja === 'string' && currentCja.trim()) {
      this.cjaSearch = currentCja;
    }

    // 👇 Tiny SSR-friendly call to compute a “you have N lists” message
    // Passing 'body' selects the overload that returns ApplicationListPage (typed).
    this.listsApi.listApplicationLists({ page: 0, size: 1 }, 'body').subscribe({
      next: (page: ApplicationListPage) => {
        const total =
          (page).totalElements ??
          ((page).content?.length ?? 0);

        this.loginMsg = `Signed in successfully. You have ${total} application list${total === 1 ? '' : 's'}.`;
      },
      error: () => {
        // Non-fatal: still show the page if this probe fails for any reason
        this.loginMsg = 'Signed in successfully. Not calling backend';
      },
    });
    this.loadApplications();
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void import('@ministryofjustice/frontend')
      .then(({ ButtonMenu }) => {
        const nodes = document.querySelectorAll<HTMLElement>(
          '[data-module="moj-button-menu"]',
        );

        for (const el of nodes) {
          const flagged = el as MojInitEl;
          if (flagged.__mojInit) {
            continue;
          }

          // use the instance so 'no-new' doesn't complain
          const instance = new ButtonMenu(flagged);
          if (typeof (instance as { init?: () => void }).init === 'function') {
            instance.init(); // some versions require explicit init
          }

          flagged.__mojInit = true;
        }
      })
      .catch(() => {
        // no-op for non-browser/test environments
      });
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
      // TODO: handle search using `values`
    } else if (action === 'create') {
      // TODO: handle create using `values`
    }
  }

  loadApplicationsLists(): void {
    // Hard-coded sample data for now
    this.rows = [
      {
        id: 101,
        date: '2025-09-29',
        time: '09:30',
        location: 'Birmingham',
        description: 'Morning list',
        entries: 12,
        status: 'Open',
      },
      {
        id: 102,
        date: '2025-09-29',
        time: '13:45',
        location: 'Birmingham',
        description: 'Afternoon list',
        entries: 8,
        status: 'Closed',
      },
      {
        id: 103,
        date: '2025-09-30',
        time: '10:00',
        location: 'Manchester',
        description: 'Applications block',
        entries: 16,
        status: 'Open',
      },
      {
        id: 104,
        date: '2025-09-30',
        time: '14:15',
        location: 'Manchester',
        description: 'Enforcement',
        entries: 5,
        status: 'Closed',
      },
      {
        id: 105,
        date: '2025-10-01',
        time: '09:00',
        location: 'Bristol',
        description: 'Housing list',
        entries: 20,
        status: 'Open',
      },
      {
        id: 106,
        date: '2025-10-01',
        time: '11:30',
        location: 'Bristol',
        description: 'Small claims',
        entries: 9,
        status: 'Open',
      },
      {
        id: 107,
        date: '2025-10-02',
        time: '10:45',
        location: 'Leeds',
        description: 'Family applications',
        entries: 14,
        status: 'Closed',
      },
      {
        id: 108,
        date: '2025-10-02',
        time: '15:00',
        location: 'Leeds',
        description: 'Costs review',
        entries: 6,
        status: 'Open',
      },
    ];
  }

  onDelete(id: number): void {
    this._id = id;
  }

  onPageChange(page: number): void {
    this.currentPage = page;
  }

  onResultSelected(): void {}

  // Close when clicking anywhere else
  @HostListener('document:click')
  onDocClick(): void {
    this.openPrintSelectForId = null;
  }

  @HostListener('document:click')
  closeMenus(): void {
    this.openMenuForId = null;
  }

  onPrint(): void {
    // TODO: your print flow per row
  }

  onPrintContinuous(): void {
    // TODO: your continuous print flow per row
  }
}
