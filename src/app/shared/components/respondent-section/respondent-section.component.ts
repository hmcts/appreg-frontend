import { Component, computed, input } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { ErrorItem } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
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
  ],
  templateUrl: './respondent-section.component.html',
})
export class RespondentSectionComponent {
  readonly form = input.required<ApplicationsListEntryForm>();
  readonly personGroup = input.required<PersonForm>();
  readonly organisationGroup = input.required<OrganisationForm>();

  readonly respondentEntryTypeOptions =
    input.required<readonly { value: RespondentEntryType; label: string }[]>();

  // app-select-input expects mutable
  readonly selectOptions = computed(() => [
    ...this.respondentEntryTypeOptions(),
  ]);

  readonly personTitleOptions = input<Option<string>[]>([]);
  readonly submitted = input(false);
  readonly errorItems = input<readonly ErrorItem[]>([]);
}
