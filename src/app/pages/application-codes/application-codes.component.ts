import { Component } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, NavigationEnd, Router, RouterLink } from '@angular/router';
import { initAll } from 'govuk-frontend';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-application-codes',
  standalone: true,
  imports: [RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './application-codes.component.html',
  styleUrl: './application-codes.component.scss',
})
export class ApplicationCodesComponent {
  public id!: string;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    initAll();
  }

  onSubmit(event: SubmitEvent) {
    event.preventDefault();
    const btn = event.submitter as HTMLButtonElement;
    const action = btn.value; // "search" or "create"

    // read your form values however you like:
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
  }
}
