import { Component } from '@angular/core';
import {FormsModule} from "@angular/forms";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";

@Component({
  selector: 'app-standard-applicants',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink
  ],
  templateUrl: './standard-applicants.component.html',
  styleUrl: './standard-applicants.component.scss'
})
export class StandardApplicantsComponent {

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
