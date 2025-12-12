import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
} from '@angular/core';
import { finalize } from 'rxjs/operators';

import {
  StandardApplicantGetSummaryDto,
  StandardApplicantsApi,
} from '../../../../generated/openapi';
import { formatDate } from '../../util/standard-applicant-helpers';
import { StandardApplicantRow } from '../../util/types/applications-list-entry/types';
import { PaginationComponent } from '../pagination/pagination.component';
import { SelectableSortableTableComponent } from '../selectable-sortable-table/selectable-sortable-table.component';
import { TableColumn } from '../sortable-table/sortable-table.component';

@Component({
  selector: 'app-standard-applicant-select',
  standalone: true,
  imports: [
    CommonModule,
    SelectableSortableTableComponent,
    PaginationComponent,
  ],
  templateUrl: './standard-applicant-select.component.html',
})
export class StandardApplicantSelectComponent implements OnInit, OnChanges {
  private readonly saApi = inject(StandardApplicantsApi);

  @Input() selectedCode: string | null = null;
  @Output() selectedCodeChange = new EventEmitter<string | null>();

  rows: StandardApplicantRow[] = [];

  readonly columns: TableColumn[] = [
    { header: 'Code', field: 'code', sortable: true },
    { header: 'Name', field: 'name', sortable: true },
    { header: 'Address', field: 'address', sortable: true },
    { header: 'Use from', field: 'useFrom', sortable: true },
    { header: 'Use to', field: 'useTo', sortable: true },
  ];

  // Paging
  pageIndex = 0;
  totalPages = 0;
  private readonly pageSize = 10;
  loading = false;

  // Selection for the table
  selectedIds: Set<string> = new Set<string>();

  ngOnInit(): void {
    this.syncSelectedIdsFromCode();
    this.loadPage(0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('selectedCode' in changes) {
      this.syncSelectedIdsFromCode();
    }
  }

  onSelectedIdsChange(ids: Set<string>): void {
    this.selectedIds = ids;

    const first = ids.values().next().value;
    const code = first ?? null;

    if (code !== this.selectedCode) {
      this.selectedCode = code;
      this.selectedCodeChange.emit(code);
    }
  }

  onPageChange(page: number): void {
    this.loadPage(page);
  }

  private loadPage(page: number): void {
    this.loading = true;

    this.saApi
      .getStandardApplicants({ page, size: this.pageSize }, 'body', false, {
        transferCache: true,
      })
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (pg) => {
          const content = pg.content ?? [];
          this.rows = content.map((sa) => this.mapToRow(sa));
          const sizeOfPage = pg.pageSize ?? this.pageSize;
          const total = pg.totalElements ?? content.length;

          this.pageIndex = pg.pageNumber ?? page;
          this.totalPages =
            sizeOfPage > 0 ? Math.max(1, Math.ceil(total / sizeOfPage)) : 0;

          // Keep selection consistent when page changes
          this.syncSelectedIdsFromCode();
        },
        error: () => {
          this.rows = [];
          this.totalPages = 0;
        },
      });
  }

  private syncSelectedIdsFromCode(): void {
    if (this.selectedCode) {
      this.selectedIds = new Set<string>([this.selectedCode]);
    } else {
      this.selectedIds = new Set<string>();
    }
  }

  private mapToRow(sa: StandardApplicantGetSummaryDto): StandardApplicantRow {
    const code = sa.code ?? '';

    const person = sa.applicant?.person;
    const organisation = sa.applicant?.organisation;

    const personName = person?.name
      ? [
          person.name.title,
          person.name.firstForename,
          person.name.secondForename,
          person.name.thirdForename,
          person.name.surname,
        ]
          .filter(Boolean)
          .join(' ')
      : '';

    const name = organisation?.name ?? personName;

    const address =
      organisation?.contactDetails?.addressLine1 ??
      person?.contactDetails?.addressLine1 ??
      '';

    return {
      code,
      name,
      address,
      useFrom: formatDate(sa.startDate),
      useTo: formatDate(sa.endDate),
    };
  }
}
