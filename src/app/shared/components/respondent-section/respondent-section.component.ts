/**
 * Application List Entry - Respondent rules that are dictated by the Application Code:
 *
 *  Respondent Required = Y, Bulk Allowed = N

        Must add a real respondent.

        Cannot use bulk respondents.

    Respondent Required = Y, Bulk Allowed = Y

        Must supply either a real respondent or a bulk count.

    Respondent Required = N, Bulk Allowed = N

        No respondent required.

        No bulk respondents permitted.

        Entry may have zero respondents.

    Respondent Required = N, Bulk Allowed = Y

        No respondent required.

        User may optionally add either a real respondent or a bulk count.

  Bulk respondents:
    Application code provides a bool flag which determines if this is allowed.
    If allowed, the user can only enter a whole integer
 */

import { Component, computed, effect, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { RespondentBulkApplicationComponent } from '@components/respondent-bulk-application/respondent-bulk-application.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import type {
  ApplicationsListEntryForm,
  OrganisationForm,
  PersonForm,
  RespondentEntryType,
} from '@shared-types/applications-list-entry-create/application-list-entry-form';

type Option<T extends string> = { value: T; label: string };

@Component({
  selector: 'app-respondent-section',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SelectInputComponent,
    PersonSectionComponent,
    OrganisationSectionComponent,
    RespondentBulkApplicationComponent,
  ],
  templateUrl: './respondent-section.component.html',
})
export class RespondentSectionComponent {
  readonly form = input.required<ApplicationsListEntryForm>();
  readonly personGroup = input.required<PersonForm>();
  readonly organisationGroup = input.required<OrganisationForm>();
  readonly bulkAllowed = input<boolean>(false);

  readonly respondentEntryTypeOptions =
    input.required<readonly { value: RespondentEntryType; label: string }[]>();

  // app-select-input expects mutable
  // Only show 'Bulk Applications' if application code allows it
  readonly selectOptions = computed(() => {
    const options = [...this.respondentEntryTypeOptions()];
    return this.bulkAllowed()
      ? options
      : options.filter((o) => o.value !== 'bulk');
  });

  readonly personTitleOptions = input<Option<string>[]>([]);
  readonly submitted = input(false);
  readonly errorItems = input<readonly ErrorItem[]>([]);

  constructor() {
    // Reset type if bulkAllowed is set to false
    effect(() => {
      if (
        !this.bulkAllowed() &&
        this.form().controls.respondentEntryType.value === 'bulk'
      ) {
        this.form().controls.respondentEntryType.setValue('person');
      }
    });
  }
}
