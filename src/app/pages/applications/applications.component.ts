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
 * - Searches by a single List date or a date range (List date from/to), not both
 * - Court and Other courts are one list of exact court codes, without repeats
 *   (compared case-insensitively, as the API does). One code is sent as
 *   courtCode and more than one as courtCodes, never both. Other courts counts
 *   as a court, so it disables Other location and CJA, and they disable it
 * - Application codes and Result codes (Advanced search) are lists of exact
 *   codes, sent only when they hold at least one code. Text typed into either
 *   but not picked from the list blocks the search with an error
 * - A 400 from the search, such as a rejected filter combination, shows the
 *   API's problem text in the error summary. Other errors show a generic message
 *
 * Plain-English search (app-plain-english-search, with
 * app-interpreted-filters-summary above the form while the question needs
 * staff, and as "Searched for" directly above the results):
 * - Shown only while AiCapabilitiesFacade.searchInterpretationEnabled() is on.
 *   ngOnInit() calls refresh(), so the server's kill switch takes effect on the
 *   next visit. With it off nothing about it renders and no AI call is made
 * - Asking a question (onQuestionAsked) drops the "Searched for" summary, the
 *   summary above the form and the interpretationId of an earlier question
 * - onInterpreted() runs the search straight from the question:
 *   - An interpretation that sets no filter and needs no choice is not
 *     searched (a search with no filters returns every entry): the panel shows
 *     the 422 copy, as for any AI error, in the error summary, which takes
 *     focus, and the form is left as it was. When the question still asked
 *     for something the page could not use (not applied, unused parts or
 *     notices, such as a question not in English), the summary above the form
 *     lists it too. It has no choices, so it never blocks Search, and no
 *     interpretationId is kept for a later search
 *   - Otherwise it replaces the form's values (never merged;
 *     interpretation-mapper.ts), with the Court and CJA display text and Other
 *     courts labels. Advanced search opens when it sets one of its filters.
 *     Applying it clears earlier search errors and, unless results are on
 *     screen or loading, the "no entries found" state, which no longer applies
 *   - Choices that are all about courts, and fit Court and Other courts (20
 *     courts in all), are all applied at once (applyCourtChoices) and the
 *     search runs. Any other choice is shown as radios above the form and the
 *     search waits for staff
 *   - The search runs through the Search button's own path (submitSearch:
 *     validation, the error summary, saved form state, interpretationId). A
 *     search still loading is cancelled first, as its filters were replaced
 * - onInterpretationAnswersChange(): a choice pick is applied to the form as
 *   it is now, through the mapper, so its court rules and list limits hold
 *   against filters edited by hand since: a court pick never replaces a
 *   Court (it goes into Other courts) and takes out a CJA or Other location,
 *   and a CJA pick while a court is set is not applied. Changing an answer
 *   first takes out what the previous pick did, keeping later hand edits.
 *   What the page leaves out is listed in the summary as not applied. As soon
 *   as every choice is answered, the search runs (each pick checks again).
 *   A pick reached with an arrow key, which a keyboard or screen reader user
 *   may only be passing over, waits until they settle on it (Space or Enter
 *   on it, or focus leaving the choice: onInterpretationCommit()), and
 *   cancels a search from an earlier pick still loading
 * - When the search from a question has found its results, the "Searched
 *   for" summary shows above them and takes focus, and the panel says how many
 *   were found. When it is blocked by validation or fails, its errors are in
 *   the error summary (which takes focus) and what the question set stays in
 *   the summary above the form. The "Searched for" summary stays while staff
 *   page or sort its results, and goes when staff run Search themselves, on
 *   Clear search and when a new question is asked. It is never saved with the
 *   search state, as its labels can repeat the question
 * - "Searched for" describes what was searched: the form's values are kept
 *   when the search starts, and a filter staff changed by hand before then
 *   (compared with the interpretation and its answers) loses its rows, its
 *   picks and, for courts, the courts added from court choices. The summary
 *   then says filters were changed by hand, and the form shows them
 * - A search staff run themselves also empties the panel's status, which
 *   described the question's search
 * - Other courts labels (court names, never question text) are saved with the
 *   search form, so an end-dated court keeps its label when it is restored
 * - Search is blocked while any choice is not answered ("None of these" is an
 *   answer), so a search never widens silently. The error summary links to the
 *   first choice that is not answered
 * - The panel's errors go first in the page's one error summary. Search and
 *   Clear search clear them
 * - interpretationId is sent once, as a top-level query parameter of the first
 *   search after the interpretation, which is the search from the question
 *   unless that was blocked. A search from a changed pick that replaces one
 *   still loading (which sent it) sends it again, so the search whose results
 *   are shown has it. Otherwise it is never sent again: not on paging,
 *   sorting or a restored search, not after a search from the question
 *   failed, and never after Clear search or a new question. It is not saved
 *   with the search state
 * - Clear search also clears the question, both summaries and the choices,
 *   and cancels the interpretation and the search in flight, so no results
 *   or saved filters come back after it
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

// A list filter's codes, trimmed and without blanks or repeats
const toCodeList = (codes: readonly string[]): string[] => [
  ...new Set(codes.map((code) => code.trim()).filter((code) => !!code)),
];

// Court then Other courts as one list of codes, trimmed and without blanks or
// repeats. Codes are compared case-insensitively, as the API compares them,
// and the first spelling is kept.
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

// The controls inside Advanced search, which opens when an interpretation or
// a choice pick sets one of them
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

// The filters a choice pick works on: the form's values, and the display text
// of Court and CJA and the labels of Other courts
type PageFilters = Pick<
  InterpretationFormChanges,
  'formValue' | 'courthouseSearch' | 'cjaSearch' | 'courtChipLabels'
>;

/** What one answer did to the page's filters. */
interface ChoicePick {
  /** The filters just before the pick: undoing it goes back to these. */
  before: PageFilters;
  /** The filters just after the pick. */
  after: PageFilters;
  /** What the page left out for the pick, as text staff can read. */
  notApplied: string[];
}

/** A plain-English search result, until its search has run. */
interface CheckedInterpretation {
  /**
   * The mapper's changes, before any choice pick. Court choices applied all
   * at once (applyCourtChoices) are in them, and are no longer choices.
   */
  changes: InterpretationFormChanges;
  /** The picked radio value for each choice, by index (null: not answered). */
  answers: (string | null)[];
  /** What each answer did to the page's filters, by index. */
  picks: (ChoicePick | null)[];
  /** The active courts the mapper used, so picks are applied the same way. */
  activeCourts: readonly CourtLocationGetSummaryDto[];
  /** The labels of the courts applyCourtChoices added. */
  matchedCourts: string[];
  /**
   * A new value for each result whose summary should take focus (it has
   * choices); undefined when the error summary takes focus instead.
   */
  focusKey: number | undefined;
}

/** A search from a question, while it loads. */
interface QuestionSearch {
  /** The interpretation it runs from, with its answers. */
  checked: CheckedInterpretation;
  /** The form's values when it started, which staff may have edited. */
  searched: PageFilters['formValue'];
}

/** The "Searched for" summary of a search that ran from a question. */
interface SearchedFor {
  /**
   * The interpretation as it was searched, picks applied, without the rows of
   * filters staff changed by hand.
   */
  changes: InterpretationFormChanges;
  /**
   * The picked radio value for each choice, by index; null for a pick whose
   * filter staff changed by hand.
   */
  answers: (string | null)[];
  /** The labels of the courts applyCourtChoices added, unless changed. */
  matchedCourts: string[];
  /** Staff changed a filter by hand before the search ran. */
  changedByHand: boolean;
  /** A new value for each search, so focus moves to the summary. */
  focusKey: number;
}

// The interpretation's changes with every answered choice applied, each time
// from the mapper's own result (see interpretation-mapper.ts)
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

// What the summary shows: the interpretation with its answers applied, and
// also what the page left out when it applied them to its own filters
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

// The controls that hold a list of codes
const LIST_CONTROLS = [
  'applicationCodes',
  'resultCodes',
  'courtCodes',
] as const;
type ListControl = (typeof LIST_CONTROLS)[number];
const isListControl = (name: string): name is ListControl =>
  (LIST_CONTROLS as readonly string[]).includes(name);

// A control's value as the search uses it: text trimmed, nothing as ''
const searchedValue = (value: unknown): unknown =>
  typeof value === 'string' ? value.trim() : (value ?? '');

// Whether two lists hold the same codes, in any order
const sameCodes = (a: readonly string[], b: readonly string[]): boolean => {
  const left = new Set(toCodeList(a));
  const right = new Set(toCodeList(b));
  return left.size === right.size && [...left].every((code) => right.has(code));
};

// Court and Other courts as one list of courts, compared case-insensitively
const searchedCourts = (value: PageFilters['formValue']): string[] =>
  toCourtCodeList(value.court, value.courtCodes).map((code) =>
    code.toUpperCase(),
  );

/**
 * The controls staff changed by hand before a search from a question ran:
 * those whose value as searched differs from the interpretation with its
 * answers applied. Lists are compared as sets, as undoing a pick and picking
 * again can reorder them, and Court with Other courts as one list of courts,
 * as picks made in another order can fill them the other way round.
 */
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

/**
 * The "Searched for" summary of a search from a question. What the question
 * set for a control staff changed by hand before the search ran is left out
 * (its rows, its picks and, for a court, the courts added from court
 * choices), so the summary lists no filter that was not searched, and it says
 * filters were changed by hand rather than repeat what staff typed.
 */
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

// Changes for the mapper built from the page's filters, with nothing listed
// yet, so its notApplied afterwards is only what it left out
const toChanges = (filters: PageFilters): InterpretationFormChanges => ({
  ...copyFilters(filters),
  appliedFilters: [],
  notApplied: [],
  choices: [],
  unusedParts: [],
  notices: [],
});

// The form values that differ between two sets of filters
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
 * Takes a pick back out of the filters as they are now, which staff may have
 * edited since:
 * - a code the pick added to a list is removed;
 * - a value the pick set or cleared goes back only while it still holds what
 *   the pick left, so a value changed by hand since is kept. Court and CJA
 *   display text go back with their value;
 * - a court the pick moved from a full Other courts into Court goes back into
 *   Other courts while the court limits leave room, and is otherwise listed
 *   as not applied. No other pick takes a code out of a list.
 * A CJA or Other location that comes back may now sit beside a court: the
 * caller applies the court rule afterwards.
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

/**
 * Applies a changed answer to the page's filters as they are now. The
 * previous answer's pick is taken out first (undoPick), then the new option
 * is applied through the mapper, so its rules hold against what the form
 * holds rather than the interpretation: a court pick never replaces a court
 * (it goes into Other courts), a court takes out a CJA or Other location, a
 * CJA pick while a court is set is not applied, and the list and court limits
 * hold. Returns what the new answer did.
 */
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

  // Other courts offers the same active courts as the Court typeahead
  readonly courtOptions = computed<SuggestionsItem[]>(() =>
    this.state().courtLocations.map(toCourtSuggestionItem),
  );

  // Labels for Other courts codes that are not in courtOptions, such as
  // end-dated courts returned by a plain-English search
  readonly courtChipLabels = signal<Record<string, string>>({});

  // Court takes one of the codes the API accepts, so Court and Other courts
  // together can never send more than it allows
  readonly otherCourtsMaxItems = OTHER_COURTS_MAX_ITEMS;

  // Plain-English search: off until the capabilities load, and on any error
  readonly searchInterpretationEnabled =
    this.aiCapabilities.searchInterpretationEnabled;

  private readonly plainEnglishSearch = viewChild(PlainEnglishSearchComponent);

  // The panel's errors, first in the page's error summary
  readonly plainEnglishErrors = signal<ErrorItem[]>([]);

  // An interpretation whose search has not run yet: shown above the form
  private readonly checkedInterpretation = signal<CheckedInterpretation | null>(
    null,
  );
  // The summary of the last search from a question: shown above the results.
  // Never saved, as its labels can repeat the question.
  private readonly searchedFor = signal<SearchedFor | null>(null);
  // The search from a question that is loading, until it finishes
  private questionSearch: QuestionSearch | null = null;
  private interpretationCount = 0;
  // A pick was made since the last search from the answers, so settling on
  // an option reached with the arrow keys searches
  private picksNotSearched = false;

  // Sent once, with the first search after an interpretation. Never saved.
  private pendingInterpretationId: string | null = null;
  // The interpretationId the search in flight sent, so a search from a
  // changed pick that replaces it can send it again
  private inFlightInterpretationId: string | null = null;

  // The search request in flight, so a search from a question can replace it
  // and Clear search can cancel it
  private searchRequest?: Subscription;

  /**
   * The interpretation's form changes with the choice picks applied, and what
   * the page left out when it applied them, for the summary.
   */
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
  /** The "Searched for" summary, while plain-English search is on. */
  readonly searchedForSummary = computed(() =>
    this.searchInterpretationEnabled() ? this.searchedFor() : null,
  );
  // Set when a search is blocked by a choice that is not answered
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

  /** Whether Other courts holds a court, which disables the CJA field. */
  hasOtherCourts(): boolean {
    return hasCourtCodes(this.form.controls.courtCodes.value);
  }

  ngOnInit(): void {
    // Plain-English search stays off until this answers
    this.aiCapabilities.refresh();
    this.restoreSearchState();
    this.applicationTitleSearch.set(
      this.form.controls.applicationTitle.value ?? '',
    );
    // Other courts counts as a court when disabling Other location and CJA
    this.initPlaceFields(this.form, this.refFacade, {
      additionalCourts: this.form.controls.courtCodes,
    });
    // Options for Result codes; application codes are loaded by the facade
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
    // Labels for Other courts the typeahead does not know, such as end-dated
    // courts from a plain-English search
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
      // A search staff ran themselves: what a question set, and the outcome
      // of its search, no longer describe it
      this.searchedFor.set(null);
      this.checkedInterpretation.set(null);
      this.showChoiceErrors.set(false);
      this.plainEnglishSearch()?.clearStatus();
    }
  }

  /**
   * The Search button's path, which a search from a question takes too:
   * validation (choices first), the error summary, the saved form state, and
   * the pending interpretationId. Returns whether the search was started.
   * `fromQuestion` cancels a search still loading; `replacesPick` (a search
   * from changed answers) also sends the interpretationId it had sent.
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

    // The question replaced the filters of a search still loading. A search
    // from a changed pick sends the interpretationId the one it replaces sent.
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

  /**
   * A question was sent: what the page shows about an earlier question no
   * longer applies.
   */
  onQuestionAsked(): void {
    this.searchedFor.set(null);
    this.checkedInterpretation.set(null);
    this.questionSearch = null;
    this.picksNotSearched = false;
    this.pendingInterpretationId = null;
    this.inFlightInterpretationId = null;
    this.showChoiceErrors.set(false);
  }

  /**
   * Applies a plain-English search result to the form, replacing its values,
   * and runs the search, unless it sets no filter (the panel shows an error)
   * or staff must choose what they meant first.
   */
  onInterpreted(interpretation: SearchInterpretationDto): void {
    const activeCourts = [...this.state().courtLocations];
    const mapped = mapInterpretationToForm(interpretation, activeCourts);
    this.picksNotSearched = false;

    // A search with no filters returns every entry, so it is not run. The
    // form is left as it was and no interpretationId is kept. What the
    // question asked for that the page could not use is still shown above
    // the form; with no choices and no focusKey, it blocks nothing and the
    // error summary keeps focus.
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
      // Staff choose what they meant; the search waits for every answer
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
   * Applies the answers that changed to the form as it is now, so filters
   * edited by hand since are kept and the mapper's rules hold against them
   * (pickAnswer). Once every choice is answered, the search runs, unless the
   * pick is not final (`commit` false: reached with an arrow key). It then
   * waits for onInterpretationCommit(), and a search from an earlier pick
   * still loading is cancelled, as its results no longer match the answers.
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
    // No choice is for the Application title (not a SearchFilterField), so
    // applicationTitleSearch needs no update here
    this.applyPageFilters(current, filters);
    this.openAdvancedSearchWhenUsed();
    this.picksNotSearched = true;

    if (commit) {
      this.searchWhenAnswered(next);
    } else {
      this.cancelQuestionSearch();
    }
  }

  /**
   * Staff settled on an option they reached with the arrow keys (Space or
   * Enter on it, or focus leaving its choice). Searches when a pick has been
   * made since the last search and every choice is answered.
   */
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
   * Runs the search. `withInterpretation` (a submitted search only) sends the
   * pending interpretationId, once: it is cleared when the request is made.
   * `fromQuestion` (a search from a plain-English question) shows its
   * "Searched for" summary once its results are in.
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
    // Its results get the "Searched for" summary while it is still the search
    // from the question
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

    // New arrays, so the filter never shares one with the form
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

  // Opens Advanced search when it holds a value, so staff can check it
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

  // The form's values and the court and CJA display text, as they are now
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

  // Patches only what changed. Display text goes first: the court and CJA
  // validators read it when the form changes.
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

  // One error for the choices that are not answered, linking to the first
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

  // Replaces the form's values with an interpretation's
  private applyInterpretation(changes: InterpretationFormChanges): void {
    this.showChoiceErrors.set(false);
    // Errors about the replaced values no longer apply. Unless results are on
    // screen or on their way, nothing on the page is about a search any more,
    // so the "no entries found" state goes too (submitted and isSearch move
    // together for app-date-input)
    const searchOnScreen = this.vm().rows.length > 0 || this.vm().isLoading;
    this.patchApp({
      ...clearNotificationsPatch(),
      ...(searchOnScreen ? {} : { isSearch: false, submitted: false }),
    });

    // Display text first: the court and CJA validators read it when the form
    // is reset
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

  // Runs the search from the answers once every choice is answered. A search
  // from an earlier pick still loading is replaced, and the interpretationId
  // it sent goes with the new one.
  private searchWhenAnswered(checked: CheckedInterpretation): void {
    if (
      !checked.changes.choices.every((_, index) => !!checked.answers[index])
    ) {
      return;
    }

    this.plainEnglishSearch()?.showSearching();
    this.searchFromQuestion(checked, { replacesPick: true });
  }

  // Runs the search from a question through the Search button's path. When
  // validation blocks it, what the question set stays above the form.
  private searchFromQuestion(
    checked: CheckedInterpretation,
    { replacesPick = false } = {},
  ): void {
    this.picksNotSearched = false;
    // Set first: the results can arrive before submitSearch() returns. The
    // form's values are kept as they are sent, for "Searched for".
    this.questionSearch = { checked, searched: this.pageFilters().formValue };

    if (!this.submitSearch({ fromQuestion: true, replacesPick })) {
      this.questionSearch = null;
      this.keepInterpretation(checked);
      this.plainEnglishSearch()?.stop();
    }
  }

  // The search from a question found its results: they get the "Searched
  // for" summary, which takes focus
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

  // The search from a question failed: its error is in the error summary,
  // and what the question set stays above the form
  private onQuestionSearchFailed(search: QuestionSearch): void {
    if (this.questionSearch !== search) {
      return;
    }

    this.questionSearch = null;
    this.keepInterpretation(search.checked);
    this.plainEnglishSearch()?.stop();
  }

  // Shows what the question set above the form, unless its choices are there
  // already (staff may have changed an answer since this search started). It
  // has no focusKey, so the error summary keeps focus.
  private keepInterpretation(checked: CheckedInterpretation): void {
    if (!this.checkedInterpretation()) {
      this.checkedInterpretation.set({ ...checked, focusKey: undefined });
    }
  }

  // Cancels a search still loading, whose results no longer apply
  private cancelSearch(): void {
    if (this.vm().isLoading) {
      this.searchRequest?.unsubscribe();
      this.patchApp({ isLoading: false });
    }
  }

  // A search from a changed pick replaces the one still loading for the same
  // interpretation: the interpretationId that search sent goes with it
  private resendInterpretationId(): void {
    if (this.vm().isLoading && this.inFlightInterpretationId) {
      this.pendingInterpretationId = this.inFlightInterpretationId;
    }
  }

  // Staff are moving through the options with the arrow keys: a search from
  // an earlier pick still loading no longer matches the answers, so it is
  // cancelled, and the search they settle on sends its interpretationId. It
  // had emptied the results, so nothing on the page is about a search.
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
