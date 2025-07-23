import { Component, OnInit }   from '@angular/core';
import { CommonModule }  from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {RouterLink} from "@angular/router";
import {ApplicationListService} from "../../services/applications-list/application-list.service";
import {ApplicationList} from "../../models/application-list";
import { DateInputComponent } from '../../shared/components/date-input/date-input.component';
import { SelectInputComponent } from '../../shared/components/select-input/select-input.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { Duration, DurationInputComponent } from '../../shared/components/duration-input/duration-input.component';

interface Court {
  id: number;
  name: string;
}

@Component({
  selector: 'app-applications-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    DateInputComponent,
    ReactiveFormsModule,
    SelectInputComponent,
    TextInputComponent,
    DurationInputComponent,
  ],
  templateUrl: './applications-list.component.html',
  styleUrls: ['./applications-list.component.scss']
})
export class ApplicationsListComponent implements OnInit {
  lists: ApplicationList[] = [];
  error: string | null = null;

  courthouses: Court[] = [];
  filteredCourts: Court[] = [];

  selectedStatus = 'choose';

  duration: Duration = { hours: null, minutes: null };

  constructor(private applicationListService: ApplicationListService) {}

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

  filterCourts(query: string) {
    const q = query.trim().toLowerCase();
    this.filteredCourts = this.courthouses.filter(c =>
      c.name.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadApplications();
  }

  loadApplications(): void {
    this.applicationListService.getAll().subscribe({
      next: (allLists) => {
        this.lists = allLists.slice(0, 10); // show only the first 10 for now
      },
      error: () => this.error = 'Failed to load application lists'
    });
  }

  onDelete(id: number): void {
    if (!confirm('Are you sure?')) return;

    this.applicationListService.delete(id).subscribe({
      next: () => this.lists = this.lists.filter(a => a.id !== id),
      error: () => (this.error = 'Could not delete, please try again')
    });
  }
}
