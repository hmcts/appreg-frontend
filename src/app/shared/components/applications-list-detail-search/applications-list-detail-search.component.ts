import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { firstValueFrom } from 'rxjs';

import { mapEntrySummaryRows } from '@components/applications-list-detail/util/map-entry-summary-rows';
import { toOptionalTrimmed } from '@components/applications-list-entry-create/util';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import { SEARCH_ERROR_MESSAGES } from '@constants/application-list-entry/error-messages';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  EntryApplicationListGetFilterDto,
} from '@openapi';
import { buildErrorTextByDomId, errorTextForDomId } from '@util/error-items';
import { buildFormErrorSummary } from '@util/error-summary';
import { getProblemText } from '@util/http-error-to-text';

const SEARCH_ERROR_HREFS = {
  sequenceNumber: '#sequence-number',
  accountReference: '#account-number',
  applicantName: '#applicant',
  respondentName: '#respondent',
  respondentPostcode: '#postcode',
  applicationTitle: '#title',
  feeRequired: '#fee',
  resulted: '#resulted',
} as const;

export type ApplicationsListDetailSearchResult = {
  rows: Row[];
  totalPages: number;
  totalEntries: number;
  reqFilter: EntryApplicationListGetFilterDto;
  errors: ErrorItem[];
};

@Component({
  selector: 'app-applications-list-detail-search',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TextInputComponent,
    SelectInputComponent,
  ],
  templateUrl: './applications-list-detail-search.component.html',
})
export class ApplicationsListDetailSearchComponent {
  private readonly appListEntriesApi = inject(ApplicationListEntriesApi);

  readonly listId = input.required<string>();
  readonly pageSize = input(10);
  readonly searchResult = output<ApplicationsListDetailSearchResult>();

  readonly submitted = signal(false);
  readonly localErrors = signal<ErrorItem[]>([]);
  readonly errorByDomId = computed(() =>
    buildErrorTextByDomId(this.localErrors()),
  );

  form = new FormGroup({
    // Max lengths aligned with openapi spec
    sequenceNumber: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.pattern(/^\d+$/)],
    }),
    accountReference: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(20)],
    }),
    applicantName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    respondentName: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(300)],
    }),
    respondentPostcode: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(8)],
    }),
    applicationTitle: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(500)],
    }),
    feeRequired: new FormControl<string>('', {
      nonNullable: true,
    }),
    resulted: new FormControl<string>('', {
      nonNullable: true,
    }),
  });

  errorFor(domId: string): string | null {
    return errorTextForDomId(this.errorByDomId(), domId);
  }

  clearSearch(): void {
    this.submitted.set(false);
    this.localErrors.set([]);
    this.form.reset({
      sequenceNumber: '',
      accountReference: '',
      applicantName: '',
      respondentName: '',
      respondentPostcode: '',
      applicationTitle: '',
      feeRequired: '',
      resulted: '',
    });

    // run get all
    void this.onSearch();
  }

  async onSearch(): Promise<void> {
    this.submitted.set(true);
    this.localErrors.set([]);
    this.form.markAllAsTouched();
    this.form.updateValueAndValidity();

    const localErrors = this.buildLocalErrors();
    if (localErrors.length > 0) {
      this.localErrors.set(localErrors);
      this.searchResult.emit({
        rows: [],
        totalPages: 0,
        totalEntries: 0,
        reqFilter: {},
        errors: localErrors,
      });
      return;
    }

    const reqFilter = this.toFilter();

    try {
      // GET /application-lists/{listId}/entries
      const page = await firstValueFrom(
        this.appListEntriesApi.getApplicationListEntries({
          listId: this.listId(),
          filter: reqFilter,
          pageNumber: 0,
          pageSize: this.pageSize(),
          sort: ['sequenceNumber,asc'],
        }),
      );

      this.searchResult.emit({
        rows: mapEntrySummaryRows(page.content ?? []),
        totalPages: page.totalPages ?? 0,
        totalEntries: page.totalElements ?? 0,
        reqFilter,
        errors: [],
      });
    } catch (err) {
      const apiErrors = this.buildApiErrors(err).length
        ? this.buildApiErrors(err)
        : [{ text: getProblemText(err) }];

      if (apiErrors.length > 0) {
        this.localErrors.set(apiErrors);
        this.searchResult.emit({
          rows: [],
          totalPages: 0,
          totalEntries: 0,
          reqFilter: {},
          errors: apiErrors,
        });
        return;
      }
    }
  }

  private buildLocalErrors(): ErrorItem[] {
    return buildFormErrorSummary(this.form, SEARCH_ERROR_MESSAGES, {
      hrefs: SEARCH_ERROR_HREFS,
      priorityKeys: {
        respondentPostcode: ['maxlength'],
      },
    });
  }

  private buildApiErrors(err: unknown): ErrorItem[] {
    const problem = this.getProblemDetailsWithErrors(err);
    if (!problem) {
      return [];
    }

    return Object.entries(problem.errors).flatMap(([field, message]) => {
      const text = Array.isArray(message) ? message[0] : message;
      return [{ id: field, text: text.trim() }];
    });
  }

  private getProblemDetailsWithErrors(
    err: unknown,
  ): { errors: Record<string, string | string[]> } | null {
    if (!(err instanceof HttpErrorResponse)) {
      return null;
    }

    const errorBody = err.error as unknown;
    if (
      !errorBody ||
      typeof errorBody !== 'object' ||
      !('errors' in errorBody) ||
      typeof errorBody.errors !== 'object' ||
      errorBody.errors === null
    ) {
      return null;
    }

    return {
      errors: errorBody.errors as Record<string, string | string[]>,
    };
  }

  private toFilter(): EntryApplicationListGetFilterDto {
    const value = this.form.getRawValue();
    const sequenceNumber = value.sequenceNumber.trim();

    let feeRequired;

    if (value.feeRequired === 'yes') {
      feeRequired = true;
    } else if (value.feeRequired === 'no') {
      feeRequired = false;
    }

    return {
      sequenceNumber: sequenceNumber ? Number(sequenceNumber) : undefined,
      accountReference: toOptionalTrimmed(value.accountReference),
      applicantName: toOptionalTrimmed(value.applicantName),
      respondentName: toOptionalTrimmed(value.respondentName),
      respondentPostcode: toOptionalTrimmed(
        value.respondentPostcode,
      )?.toUpperCase(),
      applicationTitle: toOptionalTrimmed(value.applicationTitle),
      feeRequired,
      resulted: toOptionalTrimmed(value.resulted)?.toUpperCase(),
    };
  }
}
