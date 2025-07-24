import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
import {RouterLink} from "@angular/router";
import { SortableTableComponent } from '../../shared/components/sortable-table/sortable-table.component';

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    SortableTableComponent,
    RouterLink,
  ],
  templateUrl: './applications.component.html',
  styleUrl: './applications.component.scss'
})
export class ApplicationsComponent {

  columns = [
    { header: 'Date',             field: 'date',       sortable: true },
    { header: 'Applicant',        field: 'applicant',  sortable: true },
    { header: 'Respondent',       field: 'respondent', sortable: true },
    { header: 'Application title',field: 'title',      sortable: true },
    { header: 'Fee req',          field: 'fee',        sortable: true, numeric: false },
    { header: 'Resulted',         field: 'resulted',   sortable: true },
    { header: 'Status',           field: 'status',     sortable: true },
    { header: 'Actions',          field: 'actions',    sortable: false }
  ];

  data = [
    {
      date: '2024-10-10',
      applicant: 'MCPLLL3',
      respondent: 'MCPLLL3',
      title: 'Extract from the Court Register',
      fee: 'Yes',
      resulted: 'Yes',
      status: 'Open',
      actions: ''
    },
    {
      date: '2024-11-12',
      applicant: 'AB12345',
      respondent: 'AB54321',
      title: 'Full transcript of hearing',
      fee: 'Yes',
      resulted: 'No',
      status: 'Closed',
      actions: ''
    },
    {
      date: '2024-09-05',
      applicant: 'XY98765',
      respondent: 'ZY56789',
      title: 'Witness statement summary',
      fee: 'No',
      resulted: 'Yes',
      status: 'Pending',
      actions: ''
    },
    {
      date: '2024-12-22',
      applicant: 'LMN45678',
      respondent: 'LMN87654',
      title: 'Court order copy',
      fee: 'Yes',
      resulted: 'Yes',
      status: 'Completed',
      actions: ''
    },
    {
      date: '2025-01-03',
      applicant: 'PQ23456',
      respondent: 'QP65432',
      title: 'Registry index extract',
      fee: 'No',
      resulted: 'No',
      status: 'Open',
      actions: ''
    },
    {
      date: '2025-02-15',
      applicant: 'GH11223',
      respondent: 'HG33211',
      title: 'Statement of facts',
      fee: 'Yes',
      resulted: 'Pending',
      status: 'In progress',
      actions: ''
    }
  ];

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement;
    const action = btn.value;  // "search" or "create"

    // read your form values however you like:
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    if (action === 'search') {
      // handle search…
    } else {
      // handle create…
    }
  }

}
