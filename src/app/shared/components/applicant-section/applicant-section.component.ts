import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { EMPTY, expand, reduce } from 'rxjs';

import { AlertComponent } from '@components/alert/alert.component';
import {
  APPLICANT_TYPE_OPTIONS,
  PERSON_TITLE_OPTIONS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { OrganisationSectionComponent } from '@components/organisation-section/organisation-section.component';
import { PersonSectionComponent } from '@components/person-section/person-section.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import {
  SelectedStandardApplicantSummary,
  StandardApplicantSelectComponent,
} from '@components/standard-applicant-select/standard-applicant-select.component';
import {
  StandardApplicantGetSummaryDto,
  StandardApplicantsApi,
} from '@openapi';
import { ApplicantType } from '@shared-types/applications-list-entry-create/application-list-entry-form';

@Component({
  selector: 'app-applicant-section',
  imports: [
    AlertComponent,
    StandardApplicantSelectComponent,
    OrganisationSectionComponent,
    PersonSectionComponent,
    SelectInputComponent,
    ReactiveFormsModule,
    HelpDetailsComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './applicant-section.component.html',
})
export class ApplicantSectionComponent {
  private readonly standardApplicantsApi = inject(StandardApplicantsApi);
  private readonly applicantEntryTypeOptions = APPLICANT_TYPE_OPTIONS;
  readonly personTitleOptions = PERSON_TITLE_OPTIONS;

  readonly form = input.required<FormGroup>();
  readonly personGroup = input.required<FormGroup>();
  readonly organisationGroup = input.required<FormGroup>();
  readonly applicantType = input.required<ApplicantType>();

  readonly submitted = input(false);
  readonly errorItems = input<ErrorItem[]>([]);
  readonly selectedStandardApplicantCode = input<string | null>(null);
  readonly selectedStandardApplicantId = input<number | null>(null);
  readonly initialStandardApplicantCodeFilter = input<string | null>(null);
  readonly currentStandardApplicantSummary =
    input<SelectedStandardApplicantSummary | null>(null);
  readonly savedStandardApplicantCode = input<string | null>(null);
  readonly savedStandardApplicantId = input<number | null>(null);
  readonly savedStandardApplicantName = input<string | null>(null);
  readonly savedStandardApplicantDetailsUnavailable = input(false);
  readonly isUpdateDisabled = input(false);

  readonly showUpdateButton = input(true);
  readonly updateButtonText = input('Update applicant');

  readonly standardApplicantCodeChange = output<string | null>();
  readonly standardApplicantSummaryChange =
    output<SelectedStandardApplicantSummary | null>();
  readonly applicantErrorsChange = output<ErrorItem[]>();
  readonly updateClicked = output<void>();

  readonly entryTypeOptions = computed(() => this.applicantEntryTypeOptions);
  readonly historicalSavedApplicantCode = signal<string | null>(null);
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
  readonly savedStandardApplicantFallback = computed(() => {
    const code = this.savedStandardApplicantCode()?.trim() || null;

    if (!code || !this.savedStandardApplicantDetailsUnavailable()) {
      return null;
    }

    return {
      code,
      displayText: code,
    };
  });
  readonly currentSelectionSummary = computed(() => {
    const current = this.currentStandardApplicantSummary();
    const code = current?.code?.trim() || null;
    const name = current?.name?.trim() || null;

    if (!code || !name) {
      return null;
    }

    const saved = this.standardApplicantSummary();
    if (
      saved?.code === code &&
      saved.name === name &&
      (current?.standardApplicantId === undefined ||
        current.standardApplicantId === this.savedStandardApplicantId())
    ) {
      return null;
    }

    return {
      code,
      name,
      displayText: `${code} ${name}`,
    };
  });

  constructor() {
    effect((onCleanup) => {
      const code = this.savedStandardApplicantCode()?.trim();
      const savedId = this.savedStandardApplicantId();
      this.historicalSavedApplicantCode.set(null);

      if (!code || savedId === null) {
        return;
      }

      const request = { code, pageSize: 100 };
      const subscription = this.standardApplicantsApi
        .getStandardApplicants({ ...request, pageNumber: 0 }, 'body', false, {
          transferCache: true,
        })
        .pipe(
          expand((page) => {
            const nextPage = page.pageNumber + 1;
            const totalPages =
              page.totalPages ?? Math.ceil(page.totalElements / page.pageSize);
            return nextPage < totalPages
              ? this.standardApplicantsApi.getStandardApplicants(
                  { ...request, pageNumber: nextPage },
                  'body',
                  false,
                  { transferCache: true },
                )
              : EMPTY;
          }),
          reduce(
            (applicants, page) => applicants.concat(page.content ?? []),
            [] as StandardApplicantGetSummaryDto[],
          ),
        )
        .subscribe({
          next: (applicants) => {
            const current = applicants.find(
              (applicant) =>
                applicant.code.trim().toUpperCase() === code.toUpperCase(),
            );
            if (
              !current ||
              (current.standardApplicantId !== undefined &&
                current.standardApplicantId !== savedId)
            ) {
              this.historicalSavedApplicantCode.set(code);
            }
          },
        });
      onCleanup(() => subscription.unsubscribe());
    });
  }

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
