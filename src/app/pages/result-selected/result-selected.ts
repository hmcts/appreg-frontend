import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent } from '../../shared/components/breadcrumbs/breadcrumbs.component';
import { SearchBoxComponent } from '../../shared/components/search-box/search-box.component';
import {
  ColumnDef,
  TableComponent,
} from '../../shared/components/table/table.component';

type Row = {
  sequenceNumber: string;
  applicant: string;
  respondent: string;
  title: string;
};

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
export class ResultSelected implements OnInit {
  private route = inject(ActivatedRoute);
  listId!: string;

  columns: ColumnDef<Row>[] = [
    { header: 'Sequence number', accessor: 'sequenceNumber' },
    { header: 'Applicant(s)', accessor: 'applicant' },
    { header: 'Respondent(s)', accessor: 'respondent' },
    { header: 'Application Title(s)', accessor: 'title' },
  ];

  rows: Row[] = [
    {
      sequenceNumber: 'All',
      applicant: 'All',
      respondent: 'All',
      title: 'All',
    },
  ];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    // invalid listId then navigate to 404 page
    if (id) {
      this.listId = id;
    }
    this.rows =
      (history.state as { resultingApplications?: Row[] })
        .resultingApplications ?? [];
  }

  onSearchChange(): void {
    // TODO: handle search input changes
  }

  onSearchSubmit(): void {
    // TODO: handle search form submission
  }
}
