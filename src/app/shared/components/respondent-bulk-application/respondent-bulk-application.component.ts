import { Component, input } from '@angular/core';

import { TextInputComponent } from '@components/text-input/text-input.component';

@Component({
  selector: 'app-respondent-bulk-application',
  imports: [TextInputComponent],
  templateUrl: './respondent-bulk-application.component.html',
})
export class RespondentBulkApplicationComponent {
  readonly submitted = input(false);
}
