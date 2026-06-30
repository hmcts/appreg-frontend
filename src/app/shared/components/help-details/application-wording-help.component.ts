import { Component } from '@angular/core';

import { HelpDetailsComponent } from './help-details.component';

@Component({
  selector: 'app-application-wording-help',
  standalone: true,
  imports: [HelpDetailsComponent],
  template: `
    <app-help-details summary="Help with application wording">
      <p class="govuk-body">
        Application wording is based on the selected application code and may
        include fixed text and fields you need to complete.
      </p>
    </app-help-details>
  `,
})
export class ApplicationWordingHelpComponent {}
