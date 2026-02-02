import { Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { BreadcrumbsComponent } from '@components/breadcrumbs/breadcrumbs.component';
import { SearchBoxComponent } from '@components/search-box/search-box.component';
import { ColumnDef, TableComponent } from '@components/table/table.component';
import { WarningBannerComponent } from '@components/warning-banner/warning-banner.component';

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
    WarningBannerComponent,
  ],
  templateUrl: './result-selected.component.html',
})
export class ResultSelected implements OnInit {
  private route = inject(ActivatedRoute);
  listId!: string;
  mixedResultedAndUnresultedApplications!: boolean;

  columns: ColumnDef<Row>[] = [
    { header: 'Sequence number', field: 'sequenceNumber' },
    { header: 'Applicant(s)', field: 'applicant' },
    { header: 'Respondent(s)', field: 'respondent' },
    { header: 'Application Title(s)', field: 'title' },
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
    if (id) {
      this.listId = id;
    }
    this.rows =
      (history.state as { resultingApplications?: Row[] })
        ?.resultingApplications ?? [];
    this.mixedResultedAndUnresultedApplications =
      (history.state as { mixedResultedAndUnresultedApplications?: boolean })
        ?.mixedResultedAndUnresultedApplications ?? false;
  }

  onSearchChange(): void {
    // TODO: handle search input changes
  }

  onSearchSubmit(): void {
    // TODO: handle search form submission
  }
}
