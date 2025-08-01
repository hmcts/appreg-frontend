import { CommonModule, CurrencyPipe , NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';
import { filter } from 'rxjs/operators';

import { Application } from '../../models/application';
import { ApplicationList } from '../../models/application-list';
import { ApplicationListService } from '../../services/applications-list/application-list.service';
import { DurationInputComponent } from '../../shared/components/duration-input/duration-input.component';

@Component({
  selector: 'app-application-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, NgClass, CurrencyPipe, DurationInputComponent],
  templateUrl: './application-detail.component.html',
  styleUrl: './application-detail.component.scss',
})
export class ApplicationDetailComponent {
  public id!: number;
  currentFragment: string | null = null;

  applicationList: ApplicationList | null = null;
  applications: Application[] = [];
  formModel = {
    description: '',
    status: '',
    time: '',
    location: 'Default Location',
    cja: 'Default CJA',
    date: { day: '', month: '', year: '' },
    duration: { hours: '', minutes: '' },
    courthouseName: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private appListService: ApplicationListService
  ) {}

  ngOnInit() {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    initAll();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.currentFragment = this.route.snapshot.fragment;
    });

    this.loadApplicationList();
    this.loadApplications();
  }

  loadApplicationList(): void {
    this.appListService.get(this.id).subscribe({
      next: list => {
        this.applicationList = list;

        this.formModel.description = list.description || '';
        this.formModel.status = list.status || '';
        this.formModel.time = list.time || '';
        this.formModel.location = list.location || 'Default Location';
        this.formModel.cja = list.cja || 'Default CJA';
        this.formModel.courthouseName = list.courthouse?.name || '';

        const [year, month, day] = (list.date || '').split('-');
        this.formModel.date = { day, month, year };

        const [hours, minutes] = (list.time || '').split(':');
        this.formModel.duration = { hours: hours || '', minutes: minutes || '' };
      },
      error: err => console.error('Failed to load application list', err),
    });
  }

  loadApplications(): void {
    this.appListService.getApplicationsByListId(this.id).subscribe({
      next: apps => (this.applications = apps),
      error: err => console.error('Failed to load applications', err),
    });
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement;
    const action = btn.value; // "search" or "create"

    // read your form values however you like:
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);

    if (action === 'create') {
      // handle create…
    } else {
      // handle bulk upload…
    }
  }
}
