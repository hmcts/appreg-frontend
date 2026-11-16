/**
 * Applications
 * Main Component for page /applications
 *
 * Note:
 * Bulk preview endpoint contains a BE limit of 2000 max selected applications
 *
 * Functionality:
 * onSubmit():
 * - GET request to Spring API which returns applications based on given params
 * - Populates query based on fields that are  !null/!undefined/!defaultValue
 *
 * Plain-English search, only while searchInterpretationEnabled() is on:
 * - onInterpreted() replaces the form's values with a question's and runs the
 *   search through the Search button's path, unless it sets no filter or staff
 *   must choose what they meant first
 * - "Searched for" shows what a search from a question searched, above its
 *   results
 *
 * onPrintContinuous/Page():
 * - Runs bulk preview endpoint to get selected row details
 * - Runs print endpoint with entryIds + listIds
 *
 * onUpdateNotesClick():
 * - Navigates to ./update-notes/update-notes.component.ts with row context
 *
 * onResultSelectedClick():
 * - Navigates to ./applications-result-selected/applications-result-selected.component.ts with row context
 */

import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EnvironmentInjector,
  OnInit,
  PLATFORM_ID,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';

import {
  InterpretedFiltersSummaryComponent,
  interpretationChoiceHref,
  interpretationChoiceIdPrefix,
} from './plain-english-search/interpreted-filters-summary.component';
import { PlainEnglishSearchComponent } from './plain-english-search/plain-english-search.component';
import {
  type ApplicationsState,
  clearNotificationsPatch,
  defaultApplicationsSort,
  initialApplicationsState,
  searchBadRequestPatch,
  searchErrorPatch,
  searchSuccessPatch,
  startSearchPatch,
} from './util/applications.state';
import {
  type ApplicationsSearchControl,
  type InterpretationChoiceOption,
  type InterpretationFormChanges,
  applyCourtChoices,
  applyInterpretationChoice,
  controlFor,
  mapInterpretationToForm,
  setsNoFilter,
  withCourtsExclusive,
} from './util/interpretation-mapper';
import { mapToRow } from './util/table-mapper';

import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';
import { DateInputComponent } from '@components/date-input/date-input.component';
import {
  type ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';
import { HelpDetailsComponent } from '@components/help-details/help-details.component';
import { MultiSuggestionsComponent } from '@components/multi-suggestions/multi-suggestions.component';
import { NotificationBannerComponent } from '@components/notification-banner/notification-banner.component';
import { PaginationComponent } from '@components/pagination/pagination.component';
import { SelectInputComponent } from '@components/select-input/select-input.component';
import {
  SortableTableComponent,
  TableColumn,
} from '@components/sortable-table/sortable-table.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import {
  type SuggestionsItem,
  isAppcodeSuggestionItem,
  toApplicationCodeSuggestionItem,
  toCourtSuggestionItem,
  toResultCodeSuggestionItem,
} from '@components/suggestions/suggestions.types';
import { TextInputComponent } from '@components/text-input/text-input.component';
import {
  ApplicationsColumns,
  COURT_CODES_MAX_ITEMS,
  OTHER_COURTS_MAX_ITEMS,
} from '@constants/applications/applications.constants';
import {
  APPLICATIONS_ERROR_MAP,
  INTERPRETATION_CHOICE_ERROR_MESSAGE,
  PLAIN_ENGLISH_SEARCH_NOT_UNDERSTOOD,
} from '@constants/applications/error-messages';
import {
  APPLICATIONS_LIST_CHOOSE_STATUS,
  APPLICATIONS_LIST_ERROR_MESSAGES,
} from '@constants/applications-list/applications-list.constants';
import { APPLICATION_TITLE_REGEX } from '@constants/regex';
import { DateTimePipe } from '@core/pipes/dateTime.pipe';
import { PdfService } from '@core/services/pdf.service';
import { Row } from '@core-types/table/row.types';
import {
  ApplicationListEntriesApi,
  ApplicationListStatus,
  ApplicationListsApi,
  BulkActionPreviewRequestDto,
  BulkActionPreviewResponseDto,
  BulkActionSelectionDto,
  BulkActionSelectionType,
  BulkActionType,
  CourtLocationGetSummaryDto,
  EntryGetFilterDto,
  EntryGetSummaryDto,
  GetEntriesRequestParams,
  PrintApplicationListsRequestParams,
  SearchInterpretationDto,
} from '@openapi';
import { AiCapabilitiesFacade } from '@services/ai-capabilities.facade';
import {
  ApplicationsSearchFormService,
  ApplicationsSearchFormValue,
} from '@services/applications/applications-search-form.service';
import { ApplicationsSearchStateService } from '@services/applications/applications-search-state.service';
import { buildErrorSummary } from '@services/applications-list/build-applications-list-error-summary';
import { ReferenceDataFacade } from '@services/reference-data.facade';
import { ApplicationRow } from '@shared-types/applications/applications.type';
import { BulkPrintRequest } from '@shared-types/pdf/pdf.types';
import { toStatus } from '@util/application-status-helpers';
import {
  TitleSelected,
  filterAppTitles,
  titleInputChange,
} from '@util/application-title-suggestions';
import { onCreateErrorClick as onCreateErrorClickFn } from '@util/error-click';
import { getControlErrorItem } from '@util/error-summary';
import {
  getHttpStatus,
  getProblemText,
  hasProblemText,
} from '@util/http-error-to-text';
import { hasCourtCodes } from '@util/location-suggestion-helpers';
import { MojButtonMenuDirective } from '@util/moj-button-menu';
import { handlePrintContinuous, handlePrintPage } from '@util/pdf-utils';
import { PlaceFieldsBase } from '@util/place-fields.base';
import { isAllMatchingSelected } from '@util/server-paginated-selection';
import { createSignalState, setupLoadEffect } from '@util/signal-state-helpers';
import {
  hasText,
  trimStringToLowerCase,
  trimToUndefined,
} from '@util/string-helpers';
import { withDisabledColumnSort } from '@util/table-column-sort';
import { addLocationValidatorsToForm } from '@validators/add-location-validators-to-form';
import { atLeastOneRequiredValidator } from '@validators/at-least-one-value.validator';
import { singleDateOrDateRangeValidator } from '@validators/date-or-date-range.validator';
import { dateToOnOrAfterDateFromValidator } from '@validators/date-range.validator';

const APPLICATIONS_SORT_MAP: Record<string, string> = {
  date: 'date',
  applicant: 'applicantName',
  respondent: 'respondentName',
  title: 'applicationTitle',
  fee: 'feeRequired',
  resulted: 'isResulted',
  status: 'status',
};

// Error summary links for controls whose first input id differs from the name
const APPLICATIONS_ERROR_HREFS: Record<string, string> = {
  dateFrom: '#date-from-day',
  dateTo: '#date-to-day',
};

const toCodeList = (codes: readonly string[]): string[] => [
  ...new Set(codes.map((code) => code.trim()).filter((code) => !!code)),
];

// Repeats are found case-insensitively, as the API does; the first is kept
const toCourtCodeList = (
  court: string | null | undefined,
  otherCourts: readonly string[],
): string[] => {
  const seen = new Set<string>();

  return [court ?? '', ...otherCourts]
    .map((code) => code.trim())
    .filter((code) => {
      const key = code.toUpperCase();
      if (!code || seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
};

// Advanced search opens when an interpretation or a pick sets one of these
const ADVANCED_SEARCH_CONTROLS: readonly ApplicationsSearchControl[] = [
  'respondentPostcode',
  'cja',
  'location',
  'standardApplicantCode',
  'accountReference',
  'applicationTitle',
  'applicationCodes',
  'resultCodes',
];

type PageFilters = Pick<
  InterpretationFormChanges,
  'formValue' | 'courthouseSearch' | 'cjaSearch' | 'courtChipLabels'
>;

/** What one answer did to the page's filters. */
interface ChoicePick {
  /** Undoing the pick goes back to these. */
  before: PageFilters;
  after: PageFilters;
  notApplied: string[];
}

/** A plain-English search result, until its search has run. */
interface CheckedInterpretation {
  /** Before any pick. Court choices applied at once are in it. */
  changes: InterpretationFormChanges;
  answers: (string | null)[];
  picks: (ChoicePick | null)[];
  /** The courts the mapper used, so picks are applied the same way. */
  activeCourts: readonly CourtLocationGetSummaryDto[];
  matchedCourts: string[];
  /** Undefined when the error summary takes focus instead. */
  focusKey: number | undefined;
}

/** A search from a question, while it loads. */
interface QuestionSearch {
  checked: CheckedInterpretation;
  /** The form's values when it started, which staff may have edited. */
  searched: PageFilters['formValue'];
}

interface SearchedFor {
  /** Without the rows of filters staff changed by hand. */
  changes: InterpretationFormChanges;
  /** Null for a pick whose filter staff changed by hand. */
  answers: (string | null)[];
  matchedCourts: string[];
  changedByHand: boolean;
  focusKey: number;
}

// Always from the mapper's own result, never from one with a pick in it
const withAnswers = ({
  changes,
  answers,
  activeCourts,
}: CheckedInterpretation): InterpretationFormChanges =>
  changes.choices.reduce((current, choice, index) => {
    const option = choice.options.find((item) => item.value === answers[index]);
    return option
      ? applyInterpretationChoice(current, option, activeCourts)
      : current;
  }, changes);

// Adds what the page left out when it applied the picks to its own filters
const summaryChanges = (
  checked: CheckedInterpretation,
): InterpretationFormChanges => {
  const changes = withAnswers(checked);
  return {
    ...changes,
    notApplied: [
      ...new Set([
        ...changes.notApplied,
        ...checked.picks.flatMap((pick) => pick?.notApplied ?? []),
      ]),
    ],
  };
};

const LIST_CONTROLS = [
  'applicationCodes',
  'resultCodes',
  'courtCodes',
] as const;
type ListControl = (typeof LIST_CONTROLS)[number];
const isListControl = (name: string): name is ListControl =>
  (LIST_CONTROLS as readonly string[]).includes(name);

const searchedValue = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : (value ?? '');

const sameCodes = (a: readonly string[], b: readonly string[]): boolean => {
  const left = new Set(toCodeList(a));
  const right = new Set(toCodeList(b));
  return left.size === right.size && [...left].every((code) => right.has(code));
};

const searchedCourts = (value: PageFilters['formValue']): string[] =>
  toCourtCodeList(value.court, value.courtCodes).map((code) =>
    code.toUpperCase(),
  );

// Lists are compared as sets, as undoing and redoing a pick can reorder them,
// and Court with Other courts as one list, as picks made in another order can
// fill them the other way round
function controlsChangedByHand(
  expected: PageFilters['formValue'],
  searched: PageFilters['formValue'],
): Set<ApplicationsSearchControl> {
  const changed = new Set<ApplicationsSearchControl>();

  for (const name of Object.keys(expected) as ApplicationsSearchControl[]) {
    if (name === 'court' || name === 'courtCodes') {
      continue;
    }
    const same = isListControl(name)
      ? sameCodes(expected[name], searched[name])
      : searchedValue(expected[name]) === searchedValue(searched[name]);
    if (!same) {
      changed.add(name);
    }
  }

  if (!sameCodes(searchedCourts(expected), searchedCourts(searched))) {
    changed.add('court');
    changed.add('courtCodes');
  }

  return changed;
}

// Leaves out what the question set for a filter changed by hand before the
// search ran, so the summary lists no filter that was not searched
function searchedForOf(
  { checked, searched }: QuestionSearch,
  focusKey: number,
): SearchedFor {
  const changed = controlsChangedByHand(
    withAnswers(checked).formValue,
    searched,
  );
  const isChanged = (field: string): boolean => {
    const control = controlFor(field);
    return !!control && changed.has(control);
  };
  const changes = summaryChanges(checked);

  return {
    changes: {
      ...changes,
      appliedFilters: changes.appliedFilters.filter(
        (row) => !isChanged(row.field),
      ),
    },
    answers: checked.answers.map((answer, index) => {
      const option = checked.changes.choices[index]?.options.find(
        (item) => item.value === answer,
      );
      return option?.pick && isChanged(option.pick.field) ? null : answer;
    }),
    matchedCourts: changed.has('court') ? [] : [...checked.matchedCourts],
    changedByHand: changed.size > 0,
    focusKey,
  };
}

const copyFilters = (filters: PageFilters): PageFilters => ({
  formValue: {
    ...filters.formValue,
    applicationCodes: [...filters.formValue.applicationCodes],
    resultCodes: [...filters.formValue.resultCodes],
    courtCodes: [...filters.formValue.courtCodes],
  },
  courthouseSearch: filters.courthouseSearch,
  cjaSearch: filters.cjaSearch,
  courtChipLabels: { ...filters.courtChipLabels },
});

// Nothing listed yet, so the mapper's notApplied is only what it left out
const toChanges = (filters: PageFilters): InterpretationFormChanges => ({
  ...copyFilters(filters),
  appliedFilters: [],
  notApplied: [],
  choices: [],
  unusedParts: [],
  notices: [],
});

const changedValues = (
  current: PageFilters['formValue'],
  next: PageFilters['formValue'],
): Partial<PageFilters['formValue']> => {
  const patch: Record<string, unknown> = {};

  for (const name of Object.keys(next) as ApplicationsSearchControl[]) {
    const value: unknown = next[name];
    const same = isListControl(name)
      ? current[name].length === next[name].length &&
        current[name].every((code, index) => code === next[name][index])
      : current[name] === value;
    if (!same) {
      patch[name] = value;
    }
  }

  return patch;
};

/**
 * Takes a pick back out of the filters as they are now. A value goes back only
 * while it still holds what the pick left, so a hand edit since is kept. A
 * court the pick moved out of a full Other courts goes back while the court
 * limits leave room, and is otherwise listed as not applied.
 */
function undoPick(
  current: PageFilters,
  { before, after }: ChoicePick,
): { filters: PageFilters; notApplied: string[] } {
  const filters = copyFilters(current);
  const form = filters.formValue;
  const values: Record<string, unknown> = {};
  const notApplied: string[] = [];

  for (const name of Object.keys(
    after.formValue,
  ) as ApplicationsSearchControl[]) {
    if (
      !isListControl(name) &&
      before.formValue[name] !== after.formValue[name] &&
      form[name] === after.formValue[name]
    ) {
      values[name] = before.formValue[name];
    }
  }
  Object.assign(form, values);
  if (Object.hasOwn(values, 'court')) {
    filters.courthouseSearch = before.courthouseSearch;
  }
  if (Object.hasOwn(values, 'cja')) {
    filters.cjaSearch = before.cjaSearch;
  }

  for (const name of LIST_CONTROLS) {
    const added = after.formValue[name].filter(
      (code) => !before.formValue[name].includes(code),
    );
    form[name] = form[name].filter((code) => !added.includes(code));
    if (name === 'courtCodes') {
      for (const code of added) {
        delete filters.courtChipLabels[code];
      }
    }
  }

  const movedOut = before.formValue.courtCodes.filter(
    (code) => !after.formValue.courtCodes.includes(code),
  );
  for (const code of movedOut) {
    const courts = toCourtCodeList(form.court, form.courtCodes);
    if (courts.some((court) => court.toUpperCase() === code.toUpperCase())) {
      continue;
    }

    const label = before.courtChipLabels[code];
    if (
      form.courtCodes.length < OTHER_COURTS_MAX_ITEMS &&
      courts.length < COURT_CODES_MAX_ITEMS
    ) {
      form.courtCodes = [...form.courtCodes, code];
      if (label) {
        filters.courtChipLabels[code] = label;
      }
    } else {
      notApplied.push(label ?? code);
    }
  }

  return { filters, notApplied };
}

// The new option goes through the mapper, so its rules hold against what the
// form holds now rather than the interpretation
function pickAnswer(
  current: PageFilters,
  previous: ChoicePick | null,
  option: InterpretationChoiceOption | undefined,
  activeCourts: readonly CourtLocationGetSummaryDto[],
): ChoicePick {
  const undone = previous
    ? undoPick(current, previous)
    : { filters: current, notApplied: [] };
  // A CJA or Other location the previous pick took out may be back beside a
  // court that was set since; the court is kept
  const before = withCourtsExclusive(toChanges(undone.filters));
  const after = option
    ? applyInterpretationChoice(before, option, activeCourts)
    : before;

  return {
    before: copyFilters(before),
    after: copyFilters(after),
    notApplied: [...new Set([...undone.notApplied, ...after.notApplied])],
  };
}

@Component({
  selector: 'app-applications',
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    RouterLink,
    SortableTableComponent,
    DateInputComponent,
    TextInputComponent,
    PaginationComponent,
    SelectInputComponent,
    SuggestionsComponent,
    MultiSuggestionsComponent,
    ErrorSummaryComponent,
    NotificationBannerComponent,
    MojButtonMenuDirective,
    DateTimePipe,
    AsyncJobProgressComponent,
    HelpDetailsComponent,
    PlainEnglishSearchComponent,
    InterpretedFiltersSummaryComponent,
  ],
  templateUrl: './applications.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./applications.component.scss'],
})
export class Applications extends PlaceFieldsBase implements OnInit {
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly refFacade = inject(ReferenceDataFacade);
  private readonly appListEntryApi = inject(ApplicationListEntriesApi);
  private readonly appListApi = inject(ApplicationListsApi);
  private readonly pdf = inject(PdfService);
  private readonly searchForm = inject(ApplicationsSearchFormService);
  private readonly searchState = inject(ApplicationsSearchStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly aiCapabilities = inject(AiCapabilitiesFacade);

  private readonly appState = createSignalState(initialApplicationsState);
  readonly vm = this.appState.vm;
  private readonly patchApp = this.appState.patch;

  readonly tableRows = computed(() => this.vm().rows.map(mapToRow));

  readonly tableSelectedIds = computed(() => {
    const vm = this.vm();

    if (!vm.isFilterSelection) {
      return vm.selectedIds;
    }

    return new Set(
      this.tableRows()
        .map((row) => row.id)
        .filter((id) => !vm.excludedEntryIds.has(id)),
    );
  });

  readonly errorMap = APPLICATIONS_ERROR_MAP;

  readonly applicationTitleSearch = signal('');
  readonly filteredApplicationTitles = computed(() => {
    return filterAppTitles(this.applicationTitleSearch(), this.refFacade);
  });

  // app-multi-suggestions filters these by the typed text itself
  readonly applicationCodeOptions = computed<SuggestionsItem[]>(() =>
    this.refFacade.applicationCodes().map(toApplicationCodeSuggestionItem),
  );
  readonly resultCodeOptions = computed<SuggestionsItem[]>(() =>
    this.refFacade.resultCodes().map(toResultCodeSuggestionItem),
  );

  readonly courtOptions = computed<SuggestionsItem[]>(() =>
    this.state().courtLocations.map(toCourtSuggestionItem),
  );

  // Labels for codes not in courtOptions, such as end-dated courts
  readonly courtChipLabels = signal<Record<string, string>>({});

  // Court takes one of the codes the API accepts
  readonly otherCourtsMaxItems = OTHER_COURTS_MAX_ITEMS;

  readonly searchInterpretationEnabled =
    this.aiCapabilities.searchInterpretationEnabled;

  private readonly plainEnglishSearch = viewChild(PlainEnglishSearchComponent);

  readonly plainEnglishErrors = signal<ErrorItem[]>([]);

  // Shown above the form until its search has run
  private readonly checkedInterpretation = signal<CheckedInterpretation | null>(
    null,
  );
  // Never saved, as its labels can repeat the question
  private readonly searchedFor = signal<SearchedFor | null>(null);
  private questionSearch: QuestionSearch | null = null;
  private interpretationCount = 0;
  // Settling on an option reached with an arrow key searches only when set
  private picksNotSearched = false;

  // Sent once, with the first search after an interpretation. Never saved.
  private pendingInterpretationId: string | null = null;
  // So a search from a changed pick that replaces this one can resend it
  private inFlightInterpretationId: string | null = null;

  private searchRequest?: Subscription;

  readonly interpretationChanges = computed(() => {
    const checked = this.checkedInterpretation();
    return checked && this.searchInterpretationEnabled()
      ? summaryChanges(checked)
      : null;
  });
  readonly interpretationAnswers = computed(
    () => this.checkedInterpretation()?.answers ?? [],
  );
  readonly interpretationMatchedCourts = computed(
    () => this.checkedInterpretation()?.matchedCourts ?? [],
  );
  readonly interpretationFocusKey = computed(
    () => this.checkedInterpretation()?.focusKey,
  );
  readonly searchedForSummary = computed(() =>
    this.searchInterpretationEnabled() ? this.searchedFor() : null,
  );
  readonly showChoiceErrors = signal(false);

  readonly summaryItems = computed(() => {
    const { errorSummary, searchErrors } = this.vm();
    return [
      ...this.plainEnglishErrors(),
      ...(errorSummary.length ? errorSummary : searchErrors),
      ...(this.refFacade.hasLoadError()
        ? [{ text: 'Failed to load reference data' }]
        : []),
    ];
  });

  private readonly printRequest = signal<BulkPrintRequest | null>(null);

  readonly submitAttempt = signal(0);

  disableSearchButton = signal(false);

  override form = new FormGroup(
    {
      date: new FormControl<string | null>(null),
      dateFrom: new FormControl<string | null>(null),
      dateTo: new FormControl<string | null>(null),
      applicantOrg: new FormControl<string>(''),
      respondentOrg: new FormControl<string>(''),
      applicantSurname: new FormControl<string>(''),
      respondentSurname: new FormControl<string>(''),
      applicantName: new FormControl<string>('', {
        validators: [Validators.maxLength(300)],
      }),
      respondentName: new FormControl<string>('', {
        validators: [Validators.maxLength(300)],
      }),
      applicationTitle: new FormControl<string>('', {
        validators: [
          Validators.maxLength(500),
          Validators.pattern(APPLICATION_TITLE_REGEX),
        ],
      }),
      location: new FormControl<string>(''),
      standardApplicantCode: new FormControl<string>(''),
      respondentPostcode: new FormControl<string>('', {
        validators: [Validators.maxLength(8)],
      }),
      accountReference: new FormControl<string>(''),
      applicationCodes: new FormControl<string[]>([], { nonNullable: true }),
      resultCodes: new FormControl<string[]>([], { nonNullable: true }),
      court: new FormControl<string>(''),
      courtCodes: new FormControl<string[]>([], { nonNullable: true }),
      cja: new FormControl<string>(''),
      status: new FormControl<string | null>(null),
    },
    {
      validators: [
        atLeastOneRequiredValidator(),
        dateToOnOrAfterDateFromValidator(),
        singleDateOrDateRangeValidator(),
      ],
    },
  );

  readonly columns = computed<TableColumn[]>(() =>
    withDisabledColumnSort(ApplicationsColumns, this.filteredSortColumns()),
  );
  readonly disabledSortColumns = computed<readonly string[]>(() =>
    this.filteredSortColumns(),
  );

  private statusAwareSortField(
    filters: EntryGetFilterDto,
    sortField: ApplicationsState['sortField'],
  ): ApplicationsState['sortField'] {
    if (this.filteredSortColumns(filters).includes(sortField.key)) {
      return defaultApplicationsSort();
    }

    return sortField;
  }

  status = APPLICATIONS_LIST_CHOOSE_STATUS;

  onCreateErrorClick = onCreateErrorClickFn; // Clickable error summary hints

  getControlErrorItem = getControlErrorItem;

  showError(name: keyof typeof APPLICATIONS_ERROR_MAP): boolean {
    return this.vm().submitted && !!this.errorText(name);
  }

  errorText(name: keyof typeof APPLICATIONS_ERROR_MAP): string {
    return (
      getControlErrorItem(this.form.controls[name], name, this.errorMap)
        ?.text ?? ''
    );
  }

  get selectedCount(): number {
    const vm = this.vm();
    return vm.isFilterSelection
      ? Math.max(vm.totalEntries - vm.excludedEntryIds.size, 0)
      : vm.selectedIds.size;
  }

  get hasSelection(): boolean {
    return this.selectedCount > 0;
  }

  get canUseBulkActions(): boolean {
    return this.hasSelection && !this.vm().isSelectingAll;
  }

  hasOtherCourts(): boolean {
    return hasCourtCodes(this.form.controls.courtCodes.value);
  }

  ngOnInit(): void {
    this.aiCapabilities.refresh();
    this.restoreSearchState();
    this.applicationTitleSearch.set(
      this.form.controls.applicationTitle.value ?? '',
    );
    this.initPlaceFields(this.form, this.refFacade, {
      additionalCourts: this.form.controls.courtCodes,
    });
    this.refFacade.ensureResultCodes();
    this.setupEffects();

    addLocationValidatorsToForm(this.form, () => this.state());

    if (this.vm().isSearch) {
      this.loadApplications(this.vm().getFilters);
    }
  }

  constructor() {
    super();
    afterNextRender(() => {
      if (this.refFacade.hasLoadError()) {
        this.refFacade.refresh();
      }
    });
  }

  private restoreSearchState(): void {
    const storedForm = this.searchForm.state();
    const storedState = this.searchState.state();

    this.form.reset(storedForm, { emitEvent: false });
    this.courtChipLabels.set(this.searchForm.courtChipLabels());
    this.appState.state.set({
      ...initialApplicationsState,
      isSearch: storedState.hasSearched,
      submitted: storedState.hasSearched,
      isAdvancedSearch: storedForm.isAdvancedSearch,
      currentPage: storedState.currentPage,
      pageSize: storedState.pageSize,
      sortField: this.statusAwareSortField(
        storedState.appliedFilters,
        storedState.sortField,
      ),
      getFilters: { ...storedState.appliedFilters },
      selectedIds: new Set<string>(),
      selectedRows: [],
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
    });
  }

  private setupEffects(): void {
    // GET /application-lists/print
    setupLoadEffect(
      {
        request: this.printRequest,
        load: (req: BulkPrintRequest) =>
          this.appListApi.printApplicationLists(
            {
              bulkGetApplicationListEntriesRequestDto:
                req.body.bulkGetApplicationListEntriesRequestDto,
            },
            undefined,
            undefined,
            {
              transferCache: false,
            },
          ),
        onSuccess: async (dto) => {
          const mode = this.printRequest()?.mode;
          this.printRequest.set(null);

          try {
            if (mode === 'page') {
              await handlePrintPage(dto, {
                pdf: this.pdf,
                isBrowser: isPlatformBrowser(this.platformId),
                onError: (message) => this.patchPrintError(message),
                noEntriesMessage:
                  APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
                generateErrorMessage:
                  APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateRetry,
                crestUrl: '/assets/govuk-crest.png',
              });
              return;
            }

            if (mode === 'continuous') {
              await handlePrintContinuous(dto, {
                pdf: this.pdf,
                isBrowser: isPlatformBrowser(this.platformId),
                onError: (message) => this.patchPrintError(message),
                noEntriesMessage:
                  APPLICATIONS_LIST_ERROR_MESSAGES.noEntriesToPrint,
                generateErrorMessage:
                  APPLICATIONS_LIST_ERROR_MESSAGES.pdfGenerateGeneric,
                isClosed: false,
              });
            }
          } finally {
            this.appState.patch({ loading: false });
          }
        },
        onError: (err) => {
          this.printRequest.set(null);
          this.appState.patch({ loading: false });
          const errMsg = getProblemText(err);
          this.patchPrintError(errMsg);
        },
      },
      this.envInjector,
    );
  }

  onSubmit(e: SubmitEvent): void {
    e.preventDefault();

    if (this.submitSearch()) {
      // What a question set no longer describes a search staff ran themselves
      this.searchedFor.set(null);
      this.checkedInterpretation.set(null);
      this.showChoiceErrors.set(false);
      this.plainEnglishSearch()?.clearStatus();
    }
  }

  /**
   * The Search button's path, which a search from a question takes too.
   * Returns whether the search was started.
   */
  private submitSearch({
    fromQuestion = false,
    replacesPick = false,
  }: { fromQuestion?: boolean; replacesPick?: boolean } = {}): boolean {
    this.submitAttempt.update((attempt) => attempt + 1);

    if (this.refFacade.hasLoadError()) {
      this.refFacade.refresh();
    }

    this.clearPlainEnglishErrors();
    this.patchApp({
      ...clearNotificationsPatch(),
      submitted: true,
      isSearch: true,
    });

    this.form.markAllAsTouched();
    this.form.updateValueAndValidity({ emitEvent: false });

    // The choices are above the form, so their error comes first
    const choiceErrors = this.unansweredChoiceErrors();
    const validationErrors = buildErrorSummary(this.form, this.errorMap, {
      hrefs: APPLICATIONS_ERROR_HREFS,
    });
    this.persistFormState();

    if (choiceErrors.length) {
      this.showChoiceErrors.set(true);
    }

    if (choiceErrors.length || validationErrors.length) {
      this.patchApp({
        searchErrors: [...choiceErrors, ...validationErrors],
        isSelectingAll: false,
      });
      return false;
    }

    const filter = this.loadQuery();

    // The question replaced the filters of a search still loading
    if (fromQuestion) {
      if (replacesPick) {
        this.resendInterpretationId();
      }
      this.cancelSearch();
    }

    this.patchApp({
      currentPage: 0,
      rows: [],
      sortField: defaultApplicationsSort(),
      selectedIds: new Set<string>(),
      selectedRows: [],
      allMatchingSelected: false,
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
      isSelectingAll: false,
    });

    this.loadApplications(filter, { withInterpretation: true, fromQuestion });
    return true;
  }

  // What the page shows about an earlier question no longer applies
  onQuestionAsked(): void {
    this.searchedFor.set(null);
    this.checkedInterpretation.set(null);
    this.questionSearch = null;
    this.picksNotSearched = false;
    this.pendingInterpretationId = null;
    this.inFlightInterpretationId = null;
    this.showChoiceErrors.set(false);
  }

  onInterpreted(interpretation: SearchInterpretationDto): void {
    const activeCourts = [...this.state().courtLocations];
    const mapped = mapInterpretationToForm(interpretation, activeCourts);
    this.picksNotSearched = false;

    // A search with no filters returns every entry, so it is not run. What
    // the page could not use still shows above the form; with no focusKey,
    // the error summary keeps focus.
    if (setsNoFilter(mapped) && !mapped.choices.length) {
      this.plainEnglishSearch()?.fail(PLAIN_ENGLISH_SEARCH_NOT_UNDERSTOOD);
      if (
        mapped.notApplied.length ||
        mapped.unusedParts.length ||
        mapped.notices.length
      ) {
        this.checkedInterpretation.set({
          changes: mapped,
          answers: [],
          picks: [],
          activeCourts,
          matchedCourts: [],
          focusKey: undefined,
        });
      }
      return;
    }

    const courts = applyCourtChoices(mapped, activeCourts);
    const changes = courts?.changes ?? mapped;
    const checked: CheckedInterpretation = {
      changes,
      answers: changes.choices.map(() => null),
      picks: changes.choices.map(() => null),
      activeCourts,
      matchedCourts: courts?.matchedCourts ?? [],
      focusKey: undefined,
    };

    this.pendingInterpretationId =
      trimToUndefined(interpretation.interpretationId) ?? null;
    this.applyInterpretation(changes);

    if (changes.choices.length) {
      this.interpretationCount += 1;
      this.checkedInterpretation.set({
        ...checked,
        focusKey: this.interpretationCount,
      });
      this.plainEnglishSearch()?.showChoices();
      return;
    }

    this.searchFromQuestion(checked);
  }

  /**
   * Applies the changed answers to the form as it is now, so hand edits since
   * are kept. A pick reached with an arrow key (`commit` false) does not
   * search: it waits for onInterpretationCommit().
   */
  onInterpretationAnswersChange(
    answers: (string | null)[],
    commit = true,
  ): void {
    const checked = this.checkedInterpretation();
    if (!checked) {
      return;
    }

    const current = this.pageFilters();
    const picks = [...checked.picks];
    let filters = current;

    checked.changes.choices.forEach((choice, index) => {
      const answer = answers[index] ?? null;
      if (answer === checked.answers[index]) {
        return;
      }

      const option = choice.options.find((item) => item.value === answer);
      const pick = pickAnswer(
        filters,
        checked.picks[index],
        option,
        checked.activeCourts,
      );
      picks[index] = pick;
      filters = pick.after;
    });

    const next: CheckedInterpretation = {
      ...checked,
      answers: [...answers],
      picks,
    };
    this.checkedInterpretation.set(next);
    // No choice sets Application title, so applicationTitleSearch stays
    this.applyPageFilters(current, filters);
    this.openAdvancedSearchWhenUsed();
    this.picksNotSearched = true;

    if (commit) {
      this.searchWhenAnswered(next);
    } else {
      this.cancelQuestionSearch();
    }
  }

  // Staff settled on an option they reached with the arrow keys
  onInterpretationCommit(): void {
    const checked = this.checkedInterpretation();
    if (checked && this.picksNotSearched) {
      this.searchWhenAnswered(checked);
    }
  }

  onPlainEnglishErrorsChange(errors: ErrorItem[]): void {
    this.plainEnglishErrors.set(errors);
    if (errors.length) {
      // A new error cycle, so the error summary takes focus
      this.submitAttempt.update((attempt) => attempt + 1);
    }
  }

  async onPrintContinuousClick(): Promise<void> {
    this.appState.patch({ loading: true });
    const request = await this.buildPrintRequest(
      'continuous',
      BulkActionType.PRINT_CONTINUOUS,
    );
    if (!request) {
      this.appState.patch({ loading: false });
      return;
    }

    this.printRequest.set(request);
  }

  async onPrintPageClick(): Promise<void> {
    this.appState.patch({ loading: true });
    const request = await this.buildPrintRequest(
      'page',
      BulkActionType.PRINT_PAGE,
    );
    if (!request) {
      this.appState.patch({ loading: false });
      return;
    }

    this.printRequest.set(request);
  }

  async onUpdateNotesClick(row: ApplicationRow): Promise<void> {
    this.patchApp(clearNotificationsPatch());

    if (!row.applicationListId || !row.id) {
      this.showActionError('Unable to update notes for selected application');
      return;
    }

    if (!this.canUpdateNotes(row)) {
      this.showActionError(
        'Application list entry cannot be updated in its current state. The parent application list is not closed.',
      );
      return;
    }

    await this.router.navigate(
      ['/applications-list', row.applicationListId, 'update-notes', row.id],
      {
        state: {
          updateNotesApplication: {
            id: row.id,
            applicant: row.applicant,
            date: row.date,
            fee: row.fee,
            respondent: row.respondent,
            resulted: row.resulted,
            title: row.title,
          },
        },
      },
    );
  }

  private showActionError(text: string): void {
    this.patchApp({
      errorSummary: [{ text }],
    });
    this.submitAttempt.update((attempt) => attempt + 1);
  }

  canUpdateNotes(row: ApplicationRow): boolean {
    return (
      !!row.applicationListId &&
      !!row.id &&
      toStatus(row.status) === ApplicationListStatus.CLOSED
    );
  }

  async onResultSelectedClick(): Promise<void> {
    const preview = await this.getBulkPreviewData(
      BulkActionType.RESULT_SELECTED,
    );

    if (!preview) {
      return;
    }

    const rows = (preview?.entries ?? []).map(mapToRow);
    const eligibleCount = preview?.eligibleCount;

    // Only result status = 'open' applications
    if (eligibleCount <= 0) {
      this.showActionError('You can only result open application(s)');
      return;
    }

    const rowsToResult = rows.filter(
      (row) =>
        trimStringToLowerCase(row.status) !== 'closed' &&
        trimToUndefined(row.resulted)?.toLowerCase() !== 'yes',
    );

    if (!rowsToResult.length) {
      this.showActionError(
        'You can only result open and unresulted application(s)',
      );
      return;
    }

    // Exclude status as we can only result open applications
    const entriesToResult = rowsToResult.map((row) => ({
      id: row.id,
      listId: row.applicationListId,
      date: row.date,
      applicant: row.applicant,
      respondent: row.respondent,
      title: row.title,
    }));

    await this.router.navigate(['result-selected'], {
      relativeTo: this.route,
      state: {
        entriesToResult,
        ignoredSelected: rowsToResult.length !== rows.length,
      },
    });
  }

  private async buildPrintRequest(
    mode: BulkPrintRequest['mode'],
    action: BulkActionType,
  ): Promise<BulkPrintRequest | null | void> {
    this.patchApp(clearNotificationsPatch());

    const preview = await this.getBulkPreviewData(action);

    if (!preview || !mode) {
      return;
    }

    const selectedRows = (preview?.entries ?? []).map(mapToRow);
    const entryIds = preview.entryIds;

    if (!selectedRows.length || !entryIds.length) {
      return;
    }

    const selectedRowsListIds = this.getArrOfPrintListId(selectedRows);

    const params: PrintApplicationListsRequestParams = {
      bulkGetApplicationListEntriesRequestDto: {
        listIds: selectedRowsListIds,
        entryIds,
      },
    };

    return {
      body: params,
      mode,
    };
  }

  /**
   * `withInterpretation` sends the pending interpretationId, once.
   * `fromQuestion` shows the "Searched for" summary once the results are in.
   */
  loadApplications(
    filterOverride?: EntryGetFilterDto,
    {
      withInterpretation = false,
      fromQuestion = false,
    }: { withInterpretation?: boolean; fromQuestion?: boolean } = {},
  ): void {
    if (this.vm().isLoading) {
      return;
    }

    const interpretationId = withInterpretation
      ? this.takePendingInterpretationId()
      : null;
    const forQuestion = fromQuestion ? this.questionSearch : null;
    const apiSortKey =
      APPLICATIONS_SORT_MAP[this.vm().sortField.key] ?? this.vm().sortField.key;
    const params: GetEntriesRequestParams = {
      pageNumber: this.vm().currentPage,
      pageSize: this.vm().pageSize,
      sort: [`${apiSortKey},${this.vm().sortField.direction}`],
      filter: filterOverride ?? this.loadQuery(),
      // Top level, never in the filter, so it is not saved with the search
      ...(interpretationId ? { interpretationId } : {}),
    };

    this.patchApp({ ...startSearchPatch(), ...clearNotificationsPatch() });
    this.inFlightInterpretationId = interpretationId;

    this.searchRequest = this.appListEntryApi
      .getEntries(params, undefined, undefined, { transferCache: false })
      .subscribe({
        next: (page) => {
          this.inFlightInterpretationId = null;
          const rows = page?.content ?? ([] as EntryGetSummaryDto[]);
          const totalEntries = page?.totalElements ?? 0;
          this.patchApp({
            ...searchSuccessPatch(rows, page?.totalPages ?? 1, totalEntries),
            getFilters: params.filter ?? {},
          });
          this.saveSearchState();
          this.patchApp({ isLoading: false });
          if (forQuestion) {
            this.onQuestionSearchDone(forQuestion, totalEntries);
          }
        },
        error: (err: unknown) => {
          this.inFlightInterpretationId = null;
          // A 400 without a problem body (e.g. from a proxy) keeps the generic error
          this.patchApp(
            getHttpStatus(err) === 400 && hasProblemText(err)
              ? searchBadRequestPatch(getProblemText(err))
              : searchErrorPatch(),
          );
          this.patchApp({ isLoading: false });
          if (forQuestion) {
            this.onQuestionSearchFailed(forQuestion);
          }
        },
      });
  }

  onPageChange(page: number): void {
    this.patchApp({ currentPage: page });
    this.loadApplications(this.vm().getFilters); // fetch page `page`
  }

  onSortChange(sort: { key: string; direction: 'desc' | 'asc' }): void {
    if (this.filteredSortColumns().includes(sort.key)) {
      return;
    }

    this.patchApp({
      sortField: {
        key: sort.key,
        direction: sort.direction,
      },
      currentPage: 0,
    });
    this.loadApplications(this.vm().getFilters);
  }

  private filteredSortColumns(
    filters: EntryGetFilterDto = this.vm().getFilters,
  ): readonly string[] {
    const disabled: string[] = [];

    if (filters.date) {
      disabled.push('date');
    }
    if (filters.status) {
      disabled.push('status');
    }

    return disabled;
  }

  onSelectedIdsChange(selectedIds: Set<string>): void {
    const vm = this.vm();
    const excludedEntryIds = new Set(vm.excludedEntryIds);

    if (vm.isFilterSelection) {
      const visibleIds = this.tableRows().map((row) => row.id);
      for (const id of visibleIds) {
        if (!selectedIds.has(id)) {
          excludedEntryIds.add(id);
        } else {
          excludedEntryIds.delete(id);
        }
      }
    }

    this.patchApp({
      selectedIds,
      allMatchingSelected: vm.isFilterSelection
        ? excludedEntryIds.size === 0
        : isAllMatchingSelected(selectedIds, vm.totalEntries),
      excludedEntryIds,
    });
  }

  onSelectedRowsChange(rows: Row[]): void {
    const visibleIds = new Set(this.tableRows().map((row) => row.id));
    const selectedRowsFromOtherPages = this.vm().selectedRows.filter(
      (row) => !visibleIds.has(row.id),
    );

    this.patchApp({
      selectedRows: [
        ...selectedRowsFromOtherPages,
        ...(rows as ApplicationRow[]),
      ],
    });
  }

  onHeaderSelectAllChange(checked: boolean): void {
    if (checked) {
      this.appState.patch({ isSelectingAll: true });
      this.onSelectAllMatchingClick();
      return;
    }

    this.clearSelection();
  }

  clearSearch(): void {
    // Cancelled before the page state is reset (which stops it loading), so
    // its results and filters never come back after the page is cleared
    this.searchRequest?.unsubscribe();
    this.searchRequest = undefined;
    this.appState.state.set({
      ...initialApplicationsState,
      sortField: defaultApplicationsSort(),
      selectedIds: new Set<string>(),
      selectedRows: [],
      getFilters: {},
    });
    this.searchForm.reset();
    this.searchState.reset();
    this.resetPlainEnglishSearch();

    // A copy of the defaults, so the form never holds the default arrays
    this.form.reset(this.searchForm.state());
    this.applicationTitleSearch.set('');
    this.courtChipLabels.set({});

    this.patch({
      courthouseSearch: '',
      cjaSearch: '',
      filteredCourthouses: [],
      filteredCja: [],
    });
  }

  onApplicationTitleInputChange(value: string): void {
    titleInputChange(
      value,
      this.form.controls.applicationTitle,
      this.applicationTitleSearch,
    );
  }

  onApplicationTitleSuggestionSelected(item: SuggestionsItem): void {
    if (isAppcodeSuggestionItem(item)) {
      TitleSelected(
        item,
        this.applicationTitleSearch,
        this.form.controls.applicationTitle,
      );
    }
  }

  // Helpers
  private loadQuery(): EntryGetFilterDto {
    const v = this.form.getRawValue();
    const filter: EntryGetFilterDto = {};

    if (v.date?.trim()) {
      filter.date = v.date.trim();
    }

    if (v.dateFrom?.trim()) {
      filter.dateFrom = v.dateFrom.trim();
    }

    if (v.dateTo?.trim()) {
      filter.dateTo = v.dateTo.trim();
    }

    // The API rejects courtCode and courtCodes together (ALE-59)
    const courtCodes = toCourtCodeList(v.court, v.courtCodes);
    if (courtCodes.length === 1) {
      filter.courtCode = courtCodes[0];
    } else if (courtCodes.length > 1) {
      filter.courtCodes = courtCodes;
    }

    if (v.location?.trim()) {
      filter.otherLocationDescription = v.location.trim();
    }

    if (v.cja?.trim()) {
      filter.cjaCode = v.cja.trim();
    }

    if (v.applicantOrg?.trim()) {
      filter.applicantOrganisation = v.applicantOrg.trim();
    }

    if (v.applicantSurname?.trim()) {
      filter.applicantSurname = v.applicantSurname.trim();
    }

    if (v.respondentOrg?.trim()) {
      filter.respondentOrganisation = v.respondentOrg.trim();
    }

    if (v.respondentSurname?.trim()) {
      filter.respondentSurname = v.respondentSurname.trim();
    }

    if (v.applicantName?.trim()) {
      filter.applicantName = v.applicantName.trim();
    }

    if (v.respondentName?.trim()) {
      filter.respondentName = v.respondentName.trim();
    }

    if (v.applicationTitle?.trim()) {
      filter.applicationTitle = v.applicationTitle.trim();
    }

    if (v.respondentPostcode?.trim()) {
      filter.respondentPostcode = v.respondentPostcode.trim();
    }

    if (v.standardApplicantCode?.trim()) {
      filter.standardApplicantCode = v.standardApplicantCode.trim();
    }

    if (v.accountReference?.trim()) {
      filter.accountReference = v.accountReference.trim();
    }

    const applicationCodes = toCodeList(v.applicationCodes);
    if (applicationCodes.length) {
      filter.applicationCodes = applicationCodes;
    }

    const resultCodes = toCodeList(v.resultCodes);
    if (resultCodes.length) {
      filter.resultCodes = resultCodes;
    }

    if (v.status) {
      filter.status = toStatus(v.status);
    }

    return filter;
  }

  private getArrOfPrintListId(selectedRows: ApplicationRow[]): string[] {
    if (!selectedRows.length) {
      return [];
    }

    return [
      ...new Set(
        selectedRows
          .map((row) => row.applicationListId?.trim())
          .filter((id): id is string => !!id),
      ),
    ];
  }

  private onSelectAllMatchingClick(): void {
    const visibleRows = this.tableRows();

    this.patchApp({
      ...clearNotificationsPatch(),
      isSelectingAll: false,
      isFilterSelection: true,
      excludedEntryIds: new Set<string>(),
      selectedIds: new Set(visibleRows.map((row) => row.id)),
      selectedRows: visibleRows,
      allMatchingSelected: true,
    });
  }

  onAdvancedToggle(event: Event): void {
    const section = event.target as HTMLDetailsElement;
    this.patchApp({ isAdvancedSearch: section.open });
    this.searchForm.patchState({ isAdvancedSearch: section.open });
  }

  toggleAdvancedSearch(): void {
    const isAdvancedSearch = !this.vm().isAdvancedSearch;

    this.patchApp({ isAdvancedSearch });
    this.searchForm.patchState({ isAdvancedSearch });
  }

  // So staff can check what was set
  private openAdvancedSearchWhenUsed(): void {
    if (this.vm().isAdvancedSearch) {
      return;
    }

    const value = this.form.getRawValue();
    const used = ADVANCED_SEARCH_CONTROLS.some((name) => {
      const controlValue: unknown = value[name];
      return Array.isArray(controlValue)
        ? controlValue.length > 0
        : hasText(controlValue);
    });

    if (used) {
      this.patchApp({ isAdvancedSearch: true });
      this.searchForm.patchState({ isAdvancedSearch: true });
    }
  }

  private pageFilters(): PageFilters {
    // isAdvancedSearch is page state, not a filter
    const { isAdvancedSearch, ...formValue } = this.searchFormValue();
    const { courthouseSearch, cjaSearch } = this.state();

    return {
      formValue,
      courthouseSearch,
      cjaSearch,
      courtChipLabels: { ...this.courtChipLabels() },
    };
  }

  // Display text first: the court and CJA validators read it on a change
  private applyPageFilters(current: PageFilters, next: PageFilters): void {
    this.courtChipLabels.set({ ...next.courtChipLabels });
    this.patch({
      ...(current.courthouseSearch === next.courthouseSearch
        ? {}
        : { courthouseSearch: next.courthouseSearch, filteredCourthouses: [] }),
      ...(current.cjaSearch === next.cjaSearch
        ? {}
        : { cjaSearch: next.cjaSearch, filteredCja: [] }),
    });
    this.form.patchValue(changedValues(current.formValue, next.formValue));
  }

  // Search waits for every choice, so it never widens silently. One error
  // links to the first that is not answered.
  private unansweredChoiceErrors(): ErrorItem[] {
    const changes = this.interpretationChanges();
    const answers = this.interpretationAnswers();
    const index = changes?.choices.findIndex((_, i) => !answers[i]) ?? -1;

    if (index < 0) {
      return [];
    }

    return [
      {
        id: `${interpretationChoiceIdPrefix(index)}-1`,
        href: interpretationChoiceHref(index),
        text: INTERPRETATION_CHOICE_ERROR_MESSAGE,
      },
    ];
  }

  private takePendingInterpretationId(): string | null {
    const interpretationId = this.pendingInterpretationId;
    this.pendingInterpretationId = null;
    return interpretationId;
  }

  private applyInterpretation(changes: InterpretationFormChanges): void {
    this.showChoiceErrors.set(false);
    // Earlier errors were about the replaced values. Unless results are on
    // screen or loading, the "no entries found" state goes too (submitted and
    // isSearch move together for app-date-input)
    const searchOnScreen = this.vm().rows.length > 0 || this.vm().isLoading;
    this.patchApp({
      ...clearNotificationsPatch(),
      ...(searchOnScreen ? {} : { isSearch: false, submitted: false }),
    });

    // Display text first: the court and CJA validators read it on reset
    this.courtChipLabels.set({ ...changes.courtChipLabels });
    this.patch({
      courthouseSearch: changes.courthouseSearch,
      cjaSearch: changes.cjaSearch,
      filteredCourthouses: [],
      filteredCja: [],
    });
    this.form.reset(changes.formValue);
    this.applicationTitleSearch.set(changes.formValue.applicationTitle);
    this.openAdvancedSearchWhenUsed();
  }

  private searchWhenAnswered(checked: CheckedInterpretation): void {
    if (
      !checked.changes.choices.every((_, index) => !!checked.answers[index])
    ) {
      return;
    }

    this.plainEnglishSearch()?.showSearching();
    this.searchFromQuestion(checked, { replacesPick: true });
  }

  private searchFromQuestion(
    checked: CheckedInterpretation,
    { replacesPick = false } = {},
  ): void {
    this.picksNotSearched = false;
    // Set first: the results can arrive before submitSearch() returns
    this.questionSearch = { checked, searched: this.pageFilters().formValue };

    if (!this.submitSearch({ fromQuestion: true, replacesPick })) {
      this.questionSearch = null;
      this.keepInterpretation(checked);
      this.plainEnglishSearch()?.stop();
    }
  }

  private onQuestionSearchDone(
    search: QuestionSearch,
    totalEntries: number,
  ): void {
    // Cleared by Clear search or a new question while it loaded, or replaced
    if (this.questionSearch !== search) {
      return;
    }

    this.questionSearch = null;
    this.interpretationCount += 1;
    this.checkedInterpretation.set(null);
    this.showChoiceErrors.set(false);
    this.searchedFor.set(searchedForOf(search, this.interpretationCount));
    this.plainEnglishSearch()?.showResults(totalEntries);
  }

  private onQuestionSearchFailed(search: QuestionSearch): void {
    if (this.questionSearch !== search) {
      return;
    }

    this.questionSearch = null;
    this.keepInterpretation(search.checked);
    this.plainEnglishSearch()?.stop();
  }

  // Unless its choices are there already, as staff may have changed an answer
  // since. No focusKey, so the error summary keeps focus.
  private keepInterpretation(checked: CheckedInterpretation): void {
    if (!this.checkedInterpretation()) {
      this.checkedInterpretation.set({ ...checked, focusKey: undefined });
    }
  }

  private cancelSearch(): void {
    if (this.vm().isLoading) {
      this.searchRequest?.unsubscribe();
      this.patchApp({ isLoading: false });
    }
  }

  // A search from a changed pick replaces the one still loading, so it sends
  // the interpretationId that one sent
  private resendInterpretationId(): void {
    if (this.vm().isLoading && this.inFlightInterpretationId) {
      this.pendingInterpretationId = this.inFlightInterpretationId;
    }
  }

  // Staff are moving through options with the arrow keys, so a search from an
  // earlier pick no longer matches. Its id goes with the one they settle on.
  private cancelQuestionSearch(): void {
    if (!this.questionSearch || !this.vm().isLoading) {
      return;
    }

    this.resendInterpretationId();
    this.searchRequest?.unsubscribe();
    this.searchRequest = undefined;
    this.questionSearch = null;
    this.inFlightInterpretationId = null;
    this.patchApp({ isLoading: false, isSearch: false, submitted: false });
    this.plainEnglishSearch()?.stop();
  }

  private clearPlainEnglishErrors(): void {
    this.plainEnglishErrors.set([]);
    this.plainEnglishSearch()?.clearError();
  }

  private resetPlainEnglishSearch(): void {
    this.plainEnglishSearch()?.reset();
    this.plainEnglishErrors.set([]);
    this.checkedInterpretation.set(null);
    this.searchedFor.set(null);
    this.questionSearch = null;
    this.picksNotSearched = false;
    this.pendingInterpretationId = null;
    this.inFlightInterpretationId = null;
    this.showChoiceErrors.set(false);
  }

  private saveSearchState(): void {
    this.persistFormState();
    this.searchState.setState({
      hasSearched: this.vm().isSearch,
      currentPage: this.vm().currentPage,
      pageSize: this.vm().pageSize,
      sortField: { ...this.vm().sortField },
      appliedFilters: { ...this.vm().getFilters },
    });
  }

  private persistFormState(): void {
    this.searchForm.setState(this.searchFormValue());
    // Court names only, for the Other courts being saved
    this.searchForm.setCourtChipLabels(
      this.courtChipLabels(),
      this.form.controls.courtCodes.value,
    );
  }

  private searchFormValue(): ApplicationsSearchFormValue {
    const value = this.form.getRawValue();

    return {
      date: value.date ?? null,
      dateFrom: value.dateFrom ?? null,
      dateTo: value.dateTo ?? null,
      applicantOrg: value.applicantOrg ?? '',
      respondentOrg: value.respondentOrg ?? '',
      applicantSurname: value.applicantSurname ?? '',
      respondentSurname: value.respondentSurname ?? '',
      applicantName: value.applicantName ?? '',
      respondentName: value.respondentName ?? '',
      applicationTitle: value.applicationTitle ?? '',
      location: value.location ?? '',
      standardApplicantCode: value.standardApplicantCode ?? '',
      respondentPostcode: value.respondentPostcode ?? '',
      accountReference: value.accountReference ?? '',
      applicationCodes: [...value.applicationCodes],
      resultCodes: [...value.resultCodes],
      court: value.court ?? '',
      courtCodes: [...value.courtCodes],
      cja: value.cja ?? '',
      status: value.status ?? null,
      isAdvancedSearch: this.vm().isAdvancedSearch,
    };
  }

  private patchPrintError(message: string): void {
    this.patchApp({
      errorSummary: [{ text: message }],
    });
  }

  private clearSelection(): void {
    this.patchApp({
      selectedIds: new Set<string>(),
      selectedRows: [],
      allMatchingSelected: false,
      isFilterSelection: false,
      excludedEntryIds: new Set<string>(),
      isSelectingAll: false,
    });
  }

  private async getBulkPreviewData(
    action: BulkActionType,
    entryIds?: Set<string>,
    forceIds = false,
  ): Promise<BulkActionPreviewResponseDto | null> {
    const vm = this.vm();
    const isFilterSelection = vm.isFilterSelection && !forceIds;

    const selectionParams: BulkActionSelectionDto = {
      selectionType: isFilterSelection
        ? BulkActionSelectionType.FILTER
        : BulkActionSelectionType.IDS,
      ...(!isFilterSelection && {
        entryIds: [...(entryIds ?? vm.selectedIds)],
      }),
      ...(isFilterSelection && {
        filter: vm.getFilters,
      }),
      ...(isFilterSelection &&
        vm.excludedEntryIds.size > 0 && {
          excludedEntryIds: [...vm.excludedEntryIds],
        }),
    };

    const params: BulkActionPreviewRequestDto = {
      action,
      selection: selectionParams,
    };

    try {
      const response = await firstValueFrom(
        this.appListEntryApi.bulkActionPreview({
          bulkActionPreviewRequestDto: params,
        }),
      );
      this.patchApp({ previewRows: response });
      return response;
    } catch (err) {
      const code = getHttpStatus(err);
      let msg: string;

      if (code === 413) {
        msg =
          'Affected rows exceeds 2000. Please reduce the number of rows selected';
      } else {
        msg = getProblemText(err);
      }

      this.showActionError(msg);
      return null;
    }
  }
}
