import { Component } from '@angular/core';

import { HelpDetailsComponent } from './help-details.component';

@Component({
  selector: 'app-civil-fee-help',
  standalone: true,
  imports: [HelpDetailsComponent],
  template: `
    <app-help-details summary="Help with civil fee details">
      <p class="govuk-body">
        Civil fee details record whether an application fee is due, paid,
        remitted or covered by an undertaking.
      </p>

      <ul class="govuk-list govuk-list--bullet">
        <li>Due means the fee still needs to be paid or resolved.</li>
        <li>
          Paid means the fee has been paid in full. You can add a payment
          reference if needed.
        </li>
        <li>
          Remitted means the court has waived the fee, for example through Help
          with Fees.
        </li>
        <li>
          Undertaking means the applicant has formally agreed to pay later. The
          list cannot be closed until this is updated to Paid.
        </li>
        <li>
          Applications that do not need a fee show No fee required and the fee
          fields cannot be changed.
        </li>
        <li>
          Select Off-site fee if an additional fee applies because a magistrate
          attended a location away from court premises.
        </li>
      </ul>
    </app-help-details>
  `,
})
export class CivilFeeHelpComponent {}
