import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import {
  ColumnDef,
  TableComponent,
} from '../../shared/components/table/table.component';

type Row = { applicants: string; respondents: string; title: string };

@Component({
  selector: 'app-result-selected',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    BreadcrumbsComponent,
    TableComponent,
    SearchBoxComponent,
  ],
  templateUrl: './result-selected.html',
})
export class ResultSelected {
  columns: ColumnDef<Row>[] = [
    { header: 'Applicants', accessor: 'applicants' },
    { header: 'Respondents', accessor: 'respondents' },
    { header: 'Application Title', accessor: 'title' },
  ];

  rows: Row[] = [{ applicants: 'All', respondents: 'All', title: 'All' }];

  onSearchChange(): void {
    // TODO: handle search input changes
  }

  onSearchSubmit(): void {
    // TODO: handle search form submission
  }
}
