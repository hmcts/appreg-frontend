import { Location , NgClass } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-application-view',
  standalone: true,
  imports: [RouterLink, NgClass, FormsModule, ReactiveFormsModule],
  templateUrl: './application-view.component.html',
  styleUrl: './application-view.component.scss',
})
export class ApplicationViewComponent {
  public id!: string;
  currentFragment: string | null = null;

  personOpen = false;
  organisationOpen = false;
  standardOpen = false;

  magistrates = [1, 2, 3];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location
  ) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.currentFragment = this.route.snapshot.fragment;
    });
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement;
    const action = btn.value; // "search" or "create"

    // read your form values however you like:
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
  }

  get allOpen() {
    return this.personOpen && this.organisationOpen && this.standardOpen;
  }

  toggleAll() {
    const wantOpen = !this.allOpen;
    this.personOpen = this.organisationOpen = this.standardOpen = wantOpen;
  }

  goBack(): void {
    this.location.back();
  }
}
