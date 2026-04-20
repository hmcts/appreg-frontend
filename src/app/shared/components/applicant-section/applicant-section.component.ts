import { Component, computed, input, output } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import {
  APPLICANT_TYPE_OPTIONS,
  PERSON_TITLE_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import {
  SelectedStandardApplicantSummary,
  StandardApplicantSelectComponent,
} from '@components/standard-applicant-select/standard-applicant-select.component';
import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';

@Component({
  selector: 'app-applicant-section',
  imports: [
    StandardApplicantSelectComponent,
    OrganisationSectionComponent,
    PersonSectionComponent,
    SelectInputComponent,
    ReactiveFormsModule,
  ],
  templateUrl: './applicant-section.component.html',
})
export class ApplicantSectionComponent {
  private readonly applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  readonly personTitleOptions = PERSON_TITLE_OPTIONS;

  readonly form = input.required<FormGroup>();
  readonly personGroup = input.required<FormGroup>();
  readonly organisationGroup = input.required<FormGroup>();
  readonly applicantType = input.required<ApplicantType>();

  readonly submitted = input(false);
  readonly errorItems = input<ErrorItem[]>([]);
  readonly selectedStandardApplicantCode = input<string | null>(null);
  readonly savedStandardApplicantCode = input<string | null>(null);
  readonly savedStandardApplicantName = input<string | null>(null);
  readonly isUpdateDisabled = input(false);

  readonly showUpdateButton = input(true);
  readonly updateButtonText = input('Update applicant');

  readonly standardApplicantCodeChange = output<string | null>();
  readonly standardApplicantSummaryChange =
    output<SelectedStandardApplicantSummary | null>();
  readonly applicantErrorsChange = output<ErrorItem[]>();
  readonly updateClicked = output<void>();

  readonly entryTypeOptions = computed(() => this.applicantEntryTypeOptions);
  readonly standardApplicantSummary = computed(() => {
    const code = this.savedStandardApplicantCode()?.trim() || null;
    const name = this.savedStandardApplicantName()?.trim() || null;

    if (!code || !name) {
      return null;
    }

    return {
      code,
      name,
      displayText: `${code} ${name}`,
    };
  });

  onStandardChanged(code: string | null): void {
    this.standardApplicantCodeChange.emit(code);
  }

  onSelectedStandardApplicantSummaryChanged(
    summary: SelectedStandardApplicantSummary | null,
  ): void {
    this.standardApplicantSummaryChange.emit(summary);
  }

  onStandardApplicantErrorsChanged(errors: ErrorItem[]): void {
    this.applicantErrorsChange.emit(errors ?? []);
  }

  onUpdateClicked(): void {
    this.updateClicked.emit();
  }
}
