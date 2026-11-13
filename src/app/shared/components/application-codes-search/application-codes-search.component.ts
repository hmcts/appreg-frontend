// TODO: add header comment

import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { AlertComponent } from '@components/alert/alert.component';
import {
  CODES_COLUMNS,
  SUGGESTED_CODES_COLUMNS,
} from '@components/applications-list-entry-detail/util/entry-detail.constants';
import { DateInputComponent } from '@components/date-input/date-input.component';
import { ErrorItem } from '@components/error-summary/error-summary.component';
import { GovukTextareaComponent } from '@components/govuk-textarea/govuk-textarea.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  CODE_SUGGESTIONS_UNAVAILABLE,
  CODE_SUGGESTION_DESCRIPTION_MAX_LENGTH,
  CODE_SUGGESTION_ERROR_MESSAGES,
  CODE_SUGGESTION_MESSAGES,
  CODE_SUGGESTION_NOTICE_MESSAGES,
  CodeSuggestionErrorStatus,
} from '@constants/application-list-entry/code-suggestion-messages';
import {
  ISO_DATE_REGEX,
  SEARCHED_APPLICATION_CODE_REGEX,
} from '@constants/regex';
import {
  ApplicationCodeGetSummaryDto,
  ApplicationCodeSuggestionRequestDto,
  ApplicationCodeSuggestionResponseDto,
  ApplicationCodeSuggestionsApi,
  ApplicationCodesApi,
} from '@openapi';
import { ApplicationsListEntryForm } from '@shared-types/applications-list-entry-create/application-list-entry-form';
import {
  CodeRow,
  fetchCodeRows$,
  mapCodeSuggestionRows,
} from '@util/application-code-helpers';
import { toApplicationCodeSortKey } from '@util/application-code-sort-map';
import { ErrorMessageMap, buildFormErrorSummary } from '@util/error-summary';

const APPLICATION_CODE_SEARCH_ERROR_MESSAGES = {
  code: {
    maxlength: 'Application code must be 10 characters or fewer',
  },
} as const;

const CODE_SUGGESTION_DESCRIPTION_ID = 'code-suggestion-description';

@Component({
  selector: 'app-application-code-search',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TextInputComponent,
    DateInputComponent,
    SortableTableComponent,
    PaginationComponent,
    AlertComponent,
    HelpDetailsComponent,
    GovukTextareaComponent,
  ],
  templateUrl: './application-codes-search.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApplicationCodeSearchComponent implements OnInit {
  legend = input('Find an application code');
  codePlaceholder = input('The code for the application');
  titlePlaceholder = input('Enter a concise title for this application');
  parentSubmitted = input(false);
  // Counts entry submits. parentSubmitted can stay true from one submit to the
  // next, so this is what re-checks the errors on every submit.
  parentSubmitAttempt = input(0);
  patchedFormData = input<ApplicationsListEntryForm | undefined>(undefined);
  lodgementDateDisabled = input(false);
  // Code suggestions ("Describe the application"): only the create-entry page
  // turns them on, and only while the user has the capability.
  enableSuggestions = input(false);

  // API query params
  pageSize = signal(10);

  // API query response
  totalPages = signal(0);
  currentPage = signal(0);
  sortField = signal<{ key: string; direction: 'desc' | 'asc' }>({
    key: 'code',
    direction: 'asc',
  });

  selectCodeAndLodgementDate = output<{
    code: string;
    date: string;
    applicationCodeId?: number;
  }>();
  resultsChange = output<ApplicationCodeGetSummaryDto[]>();
  resetParentErrors = output<void>();
  codeSearchErrors = output<ErrorItem[]>();
  // The suggestionId of the code suggestions a code was added from. Null when
  // a searched-for code is added, the code is cleared, or new suggestions
  // replace the ones the code came from. Only the create-entry page listens.
  codeSuggestionIdChange = output<string | null>();

  private readonly route = inject(ActivatedRoute);
  private readonly codesApi = inject(ApplicationCodesApi);
  private readonly suggestionsApi = inject(ApplicationCodeSuggestionsApi);
  private readonly destroyRef = inject(DestroyRef);

  listId!: string | null;
  codesColumns: TableColumn[] = CODES_COLUMNS;
  suggestedCodesColumns: TableColumn[] = SUGGESTED_CODES_COLUMNS;
  codesRows: CodeRow[] = [];

  submitted = signal(false);
  hasSearched = signal(false);
  loading = signal(false);
  errored = signal(false);
  private readonly errorMap: ErrorMessageMap =
    APPLICATION_CODE_SEARCH_ERROR_MESSAGES;
  private searchSubscription?: Subscription;

  // Code suggestions. The description is user free text that may contain
  // personal data: it is sent only in the POST body and never logged or saved.
  readonly suggestionCopy = CODE_SUGGESTION_MESSAGES;
  readonly descriptionId = CODE_SUGGESTION_DESCRIPTION_ID;
  readonly descriptionMaxLength = CODE_SUGGESTION_DESCRIPTION_MAX_LENGTH;
  descriptionControl = new FormControl<string | null>(null);
  descriptionError = signal<string | null>(null);
  suggestionsLoading = signal(false);
  // True while the codes table holds suggestions rather than search results.
  showingSuggestions = signal(false);
  suggestionsError = signal<string | null>(null);
  suggestionMessages = signal<string[]>([]);
  private suggestionsSubscription?: Subscription;
  // Identifies the suggestions in the codes table; null while it has none.
  private suggestionId: string | null = null;
  private suggestionsRequested = false;
  // The first well-formed code searched for before asking for suggestions.
  private searchedApplicationCode: string | null = null;

  form = new FormGroup({
    lodgementDate: new FormControl<string | null>(null),
    code: new FormControl<string | null>(null, [Validators.maxLength(10)]),
    title: new FormControl<string | null>(null),
  });

  constructor() {
    effect(() => {
      const lodgementDateControl = this.form.controls.lodgementDate;

      if (this.lodgementDateDisabled()) {
        lodgementDateControl.disable({ emitEvent: false });
        return;
      }

      lodgementDateControl.enable({ emitEvent: false });
    });

    effect(() => {
      const parentSubmitted = this.parentSubmitted();
      // Tracked so that each entry submit runs this again.
      this.parentSubmitAttempt();

      if (!parentSubmitted) {
        return;
      }

      untracked(() => {
        // The description is not part of the entry, so each entry submit
        // clears its error and reports only the search errors.
        this.descriptionError.set(null);
        this.form.updateValueAndValidity({ emitEvent: false });
        this.emitValidationErrors();
      });
    });
  }

  private setParentLodgementDate(value: string | null): void {
    const parent = this.patchedFormData() as
      | { get?: (path: string) => { setValue?: (v: string | null) => void } }
      | undefined;

    if (typeof parent?.get !== 'function') {
      return;
    }

    parent.get('lodgementDate')?.setValue?.(value);
  }

  ngOnInit(): void {
    this.initialPatchFormData();
    this.submitted.set(false);
    this.listId = this.route.snapshot.paramMap.get('id');
    this.setParentLodgementDate(this.form.controls.lodgementDate.value);

    this.form.controls.lodgementDate.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((value) => {
        // Keep the parent form control in sync so parent-level submit validation
        // (required + error summary) always reflects the entered date.
        this.setParentLodgementDate(value);
      });

    this.form.controls.code.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((v) => {
        const code = (v ?? '').trim();
        if (!code) {
          this.clear({ emitEvent: false });
        }
      });
  }

  onSearchEnter(event: Event): void {
    if (
      !(event instanceof KeyboardEvent) ||
      event.isComposing ||
      !(event.target instanceof HTMLInputElement)
    ) {
      return;
    }

    // These inputs belong to the entry form: Enter must search, not activate its submit button.
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) {
      this.search();
    }
  }

  search(): void {
    this.submitted.set(true);
    this.errored.set(false);
    this.descriptionError.set(null);

    if (!this.canSearch()) {
      this.hasSearched.set(false);
      return;
    }

    this.hasSearched.set(false);

    const {
      code: rawCode,
      title: rawTitle,
      lodgementDate: rawLodgementDate,
    } = this.form.getRawValue();
    const code = rawCode?.trim() ?? '';
    const title = rawTitle?.trim() ?? '';
    const lodgementDate = rawLodgementDate?.trim() ?? '';

    this.recordSearchedApplicationCode(code);
    this.resetSuggestions();
    this.loading.set(true);

    const sort = this.sortField();
    const apiSortKey = toApplicationCodeSortKey(sort.key);

    this.searchSubscription?.unsubscribe();
    this.searchSubscription = fetchCodeRows$(
      this.codesApi,
      {
        code: code || undefined,
        title: title || undefined,
        date: lodgementDate || undefined,
        pageNumber: this.currentPage(),
        pageSize: this.pageSize(),
        sort: [`${apiSortKey},${sort.direction}`],
      },
      true,
    )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.codesRows = result.rows;
          this.loading.set(false);
          this.totalPages.set(result.totalPages);
          this.hasSearched.set(true);
        },
        error: () => {
          this.loading.set(false);
          this.errored.set(true);
          this.hasSearched.set(false);
        },
      });
  }

  // Fills the codes table with suggestions for the description. Nothing is
  // selected: "Add code" runs the same flow as for a search result.
  suggestCodes(): void {
    const description = (this.descriptionControl.value ?? '').trim();
    const hadDescriptionError = this.descriptionError() !== null;
    const descriptionError = validateDescription(description);
    this.descriptionError.set(descriptionError);

    if (descriptionError || hadDescriptionError) {
      this.emitSuggestionValidationErrors();
    }

    if (descriptionError) {
      return;
    }

    const request = this.buildSuggestionRequest(description);
    this.suggestionsRequested = true;

    // Suggestions replace whatever the table showed, so stop a search in flight.
    this.searchSubscription?.unsubscribe();
    this.loading.set(false);
    this.errored.set(false);
    this.hasSearched.set(false);
    this.resetSuggestions();
    this.codesRows = [];
    this.suggestionsLoading.set(true);

    this.suggestionsSubscription = this.suggestionsApi
      .suggestApplicationCodes(
        { applicationCodeSuggestionRequestDto: request },
        'body',
        false,
        { transferCache: false },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.codesRows = mapCodeSuggestionRows(response?.suggestions);
          this.suggestionId = response?.suggestionId ?? null;
          this.showingSuggestions.set(true);
          this.suggestionMessages.set(
            toSuggestionMessages(response, this.codesRows.length),
          );
          this.suggestionsLoading.set(false);
          // New suggestions replace the ones a code may have been added from.
          this.codeSuggestionIdChange.emit(null);
        },
        error: (error: unknown) => {
          this.codesRows = [];
          this.suggestionsError.set(toSuggestionErrorMessage(error));
          this.suggestionsLoading.set(false);
        },
      });
  }

  onAddCode(row: CodeRow): void {
    // Set only while the table shows suggestions, so only their rows carry it.
    const codeSuggestionId = this.suggestionId;
    this.submitted.set(false);
    this.hasSearched.set(false);
    this.resetSuggestions();
    this.codesRows = [];

    if (!this.listId) {
      return;
    }

    const code = (row?.code ?? '').trim();
    if (!code) {
      return;
    }

    const title = (row?.title ?? '').trim();
    if (!title) {
      return;
    }

    this.form.patchValue({ code, title });

    this.selectCodeAndLodgementDate.emit({
      code,
      applicationCodeId: row.applicationCodeId,
      date: this.form.controls.lodgementDate.value ?? '',
    });
    this.codeSuggestionIdChange.emit(codeSuggestionId);
  }

  onPageChange(page: number): void {
    if (!this.canSearch()) {
      return;
    }

    this.currentPage.set(page);
    this.search();
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    if (!this.canSearch()) {
      return;
    }

    this.sortField.set(sort);
    this.currentPage.set(0);
    this.search();
  }

  codeError(): string | null {
    if (!this.submitted() && !this.parentSubmitted()) {
      return null;
    }

    const errors = this.getValidationErrors();
    const localError = errors.find((error) => error.id === 'code')?.text;
    if (localError) {
      return localError;
    }

    if (
      this.parentSubmitted() &&
      this.patchedFormData()?.controls.applicationCode.hasError('required')
    ) {
      return 'Enter an application code';
    }

    return null;
  }

  hasSearchFilter(): boolean {
    const { code, title, lodgementDate } = this.form.getRawValue();
    return [code, title, lodgementDate].some((value) => !!value?.trim());
  }

  clear(options?: { emitEvent?: boolean }): void {
    this.form.patchValue(
      { code: null, title: null },
      { emitEvent: options?.emitEvent ?? true },
    );
    this.resetSuggestions();
    this.descriptionError.set(null);
    this.codesRows = [];
    this.errored.set(false);
    this.submitted.set(false);
    this.selectCodeAndLodgementDate.emit({ code: '', date: '' });
    this.codeSuggestionIdChange.emit(null);
    this.resetParentErrors.emit();
    this.codeSearchErrors.emit([]);
    this.totalPages.set(0);
    this.currentPage.set(0);
    this.sortField.set({ key: 'code', direction: 'asc' });
    this.hasSearched.set(false);
  }

  private initialPatchFormData(): void {
    // set today's date as the lodgement date by default, formatted as yyyy-MM-dd for the date input
    this.form.patchValue({
      lodgementDate: this.patchedFormData()?.value?.lodgementDate
        ? this.patchedFormData()?.value?.lodgementDate
        : new Date().toISOString().split('T')[0],
      code: this.patchedFormData()?.value?.applicationCode ?? null,
      title: this.patchedFormData()?.value?.applicationTitle ?? null,
    });
  }

  private canSearch(): boolean {
    this.form.updateValueAndValidity({ emitEvent: false });
    return this.emitValidationErrors().length === 0;
  }

  private getValidationErrors(): ErrorItem[] {
    return buildFormErrorSummary(this.form, this.errorMap, {
      hrefs: {
        code: '#applicationCode',
      },
    });
  }

  private emitValidationErrors(): ErrorItem[] {
    const errors = this.getValidationErrors();
    this.codeSearchErrors.emit([...errors, ...this.descriptionErrorItems()]);
    return errors;
  }

  // Reports the description error without surfacing search errors the user
  // has not been shown yet.
  private emitSuggestionValidationErrors(): void {
    const searchErrors =
      this.submitted() || this.parentSubmitted()
        ? this.getValidationErrors()
        : [];
    this.codeSearchErrors.emit([
      ...searchErrors,
      ...this.descriptionErrorItems(),
    ]);
  }

  private descriptionErrorItems(): ErrorItem[] {
    const text = untracked(this.descriptionError);
    return text
      ? [
          {
            id: 'codeSuggestionDescription',
            text,
            href: `#${CODE_SUGGESTION_DESCRIPTION_ID}`,
          },
        ]
      : [];
  }

  // Only the trimmed code of a search that ran, before any suggestions were
  // asked for, and only when it is 1 to 10 letters and digits.
  private recordSearchedApplicationCode(code: string): void {
    if (this.suggestionsRequested || this.searchedApplicationCode !== null) {
      return;
    }

    if (SEARCHED_APPLICATION_CODE_REGEX.test(code)) {
      this.searchedApplicationCode = code;
    }
  }

  private buildSuggestionRequest(
    description: string,
  ): ApplicationCodeSuggestionRequestDto {
    const lodgementDate = this.form.getRawValue().lodgementDate?.trim() ?? '';

    return {
      description,
      ...(ISO_DATE_REGEX.test(lodgementDate) ? { lodgementDate } : {}),
      ...(this.searchedApplicationCode
        ? { searchedApplicationCode: this.searchedApplicationCode }
        : {}),
    };
  }

  // Cancels a suggestion request in flight and removes shown suggestions.
  private resetSuggestions(): void {
    this.suggestionsSubscription?.unsubscribe();
    this.suggestionsSubscription = undefined;
    this.suggestionId = null;
    this.suggestionsLoading.set(false);
    this.suggestionsError.set(null);
    this.suggestionMessages.set([]);

    if (this.showingSuggestions()) {
      this.codesRows = [];
      this.showingSuggestions.set(false);
    }
  }
}

function validateDescription(description: string): string | null {
  if (!description) {
    return CODE_SUGGESTION_MESSAGES.descriptionRequired;
  }

  if (description.length > CODE_SUGGESTION_DESCRIPTION_MAX_LENGTH) {
    return CODE_SUGGESTION_MESSAGES.descriptionTooLong;
  }

  return null;
}

// Fixed copy only: the summary, then needsMoreDetail, then each known notice.
function toSuggestionMessages(
  response: ApplicationCodeSuggestionResponseDto | null | undefined,
  rowCount: number,
): string[] {
  const messages: string[] = [
    rowCount > 0
      ? CODE_SUGGESTION_MESSAGES.suggestionsShown
      : CODE_SUGGESTION_MESSAGES.noSuggestions,
  ];

  if (response?.needsMoreDetail === true) {
    messages.push(CODE_SUGGESTION_MESSAGES.needsMoreDetail);
  }

  for (const notice of response?.notices ?? []) {
    if (Object.hasOwn(CODE_SUGGESTION_NOTICE_MESSAGES, notice)) {
      messages.push(CODE_SUGGESTION_NOTICE_MESSAGES[notice]);
    }
  }

  return [...new Set(messages)];
}

function toSuggestionErrorMessage(error: unknown): string {
  const status = error instanceof HttpErrorResponse ? error.status : null;

  return status !== null &&
    Object.hasOwn(CODE_SUGGESTION_ERROR_MESSAGES, status)
    ? CODE_SUGGESTION_ERROR_MESSAGES[status as CodeSuggestionErrorStatus]
    : CODE_SUGGESTIONS_UNAVAILABLE;
}
