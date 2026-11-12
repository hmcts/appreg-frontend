/**
 * Interpretation mapper for /applications (plain-English search).
 *
 * Pure functions that turn a SearchInterpretationDto into changes for the
 * Applications search form. Nothing here has side effects or uses Angular
 * DI: the page (FE-14) applies the result to its form and signals.
 *
 * mapInterpretationToForm(interpretation, activeCourts):
 * - Replaces, never merges: `formValue` is a whole form value. Every control
 *   starts from the page defaults (DEFAULT_APPLICATIONS_SEARCH_FORM) and only
 *   the filters in the interpretation are set, so nothing from an earlier
 *   search is kept. Arrays are always new, never shared with the input.
 * - INTERPRETED_FILTER_CONTROLS maps each EntryGetFilterDto field to its
 *   control. Fields with no control on the page map to null.
 * - Court: `courtCode` goes into Court when it is one of `activeCourts` (the
 *   Court typeahead only knows courts that are active today). Its display text
 *   (`courthouseSearch`) is the field's appliedFilters label, or the active
 *   court's typeahead label when there is none. A `courtCode` that is not
 *   active, and every `courtCodes` code, goes into Other courts, with a label
 *   in `courtChipLabels`.
 * - Court labels: the API sends one appliedFilters row for each field, not one
 *   for each court. A `courtCode`, or a `courtCodes` list of one code, takes
 *   its row's label. For a `courtCodes` list of more than one code, the row's
 *   label is the court names joined with ", ", in the order of the codes, with
 *   the code itself for a court that has no name. Its parts are paired with
 *   the codes by position in the list as sent. When the parts do not pair up
 *   one to one (a name holds ", "), or the label was cut to the API's 200
 *   characters (it then ends "…"), each court's label is its code: a joined
 *   label is never given to one court. The join is not documented in the API
 *   contract. Open point for the API: send a label for each court (a row for
 *   each court code, or a code-to-label list) so this does not depend on it.
 * - Court limits: Court and Other courts together hold at most the 20 codes
 *   the API accepts (COURT_CODES_MAX_ITEMS), and Other courts at most 19
 *   (OTHER_COURTS_MAX_ITEMS), the page's limit, which leaves room for a Court.
 *   When Other courts is full and Court is empty, an active court goes into
 *   Court to make room: the new court, or else an active court already in
 *   Other courts, which takes its chip label as display text. A court that
 *   cannot be held is listed as not applied.
 * - CJA: `cjaCode` sets CJA and its display text (`cjaSearch`) from the
 *   field's appliedFilters label, or the code.
 * - Court and CJA stay mutually exclusive, as do court and Other location: a
 *   court is narrower, so it is kept and the CJA or location is not applied.
 * - Dates must be real YYYY-MM-DD dates, the value app-date-input holds.
 *   `status` maps to the Status options' values (OPEN to 'open').
 * - `notApplied` lists, as text staff can read, what the interpretation asked
 *   for that the form cannot hold: fields with no control (such as
 *   applicationCodeCategory and standardApplicantCodes), unknown fields,
 *   values that are not valid for their control, a CJA or location dropped for
 *   a court, and codes or courts over the list and court limits. Each entry is
 *   the API's appliedFilters label (for a court, its own label), or the value
 *   when there is no label. It is kept apart from the enum-typed `notices`.
 *   `appliedFilters` keeps only the rows for filters that were applied, so no
 *   row is in both.
 * - `applicationTitle` has no display text of its own: the page shows the
 *   control's value, so FE-14 copies it to `applicationTitleSearch`.
 *
 * Choices:
 * - Each choicesNeeded item becomes radio options (app-radio-group) built from
 *   its options[], plus "None of these". Option values are unique per choice.
 * - applyInterpretationChoice() applies one picked option to the changes and
 *   returns new changes. "None of these" changes nothing, so the search runs
 *   without that part of the question.
 *   - Array fields (applicationCodes, resultCodes, courtCodes): the code is
 *     added, unless it is already there or the list is full.
 *   - Scalar fields: the value is set, replacing any value the interpretation
 *     gave the field (its appliedFilters rows are then removed).
 *   - Courts: Court and Other courts are one list of courts on this page, so a
 *     court pick is added to it and never replaces a court. A `courtCode` pick
 *     goes into Court when Court is empty and the court is active; anything
 *     else goes into Other courts. The court limits above apply to picks too.
 *   - A CJA pick while a court is set is not applied; a court pick removes a
 *     CJA or location and lists it as not applied. A pick for a field with no
 *     control, or with a value its control cannot hold, is not applied.
 *   Picks that are not applied are added to `notApplied` by their label.
 *   Apply every answer to the result of mapInterpretationToForm() each time an
 *   answer changes, rather than to a result that already has a pick in it.
 * - The page also applies a pick to its own form, which staff may have edited
 *   since: it passes changes built from the form, with no appliedFilters or
 *   notApplied, so the same rules hold against what the form holds. After it
 *   undoes a pick, withCourtsExclusive() applies the court rule above to those
 *   changes, as a CJA or Other location the pick took out may come back.
 */

import { type RadioOption } from '@components/radio-button/radio-button.component';
import { toCourtSuggestionItem } from '@components/suggestions/suggestions.types';
import {
  COURT_CODES_MAX_ITEMS,
  OTHER_COURTS_MAX_ITEMS,
} from '@constants/applications/applications.constants';
import { APPLICATIONS_LIST_CHOOSE_STATUS } from '@constants/applications-list/applications-list.constants';
import {
  CourtLocationGetSummaryDto,
  EntryGetFilterDto,
  InterpretationChoiceDto,
  InterpretationChoiceOptionDto,
  InterpretedFilterDto,
  SearchFilterField,
  SearchInterpretationDto,
  SearchInterpretationNotice,
} from '@openapi';
import { DEFAULT_APPLICATIONS_SEARCH_FORM } from '@services/applications/applications-search-form.service';
import { ApplicationsSearchFormValue } from '@shared-types/applications/applications.type';
import { hasText, trimToUndefined } from '@util/string-helpers';

/** A control on the Applications search form. */
export type ApplicationsSearchControl = keyof ApplicationsSearchFormValue;

/**
 * The form control for each EntryGetFilterDto field, or null when the page has
 * no control for it. Typed against EntryGetFilterDto, so a field the API adds,
 * renames or removes fails to compile here.
 */
export const INTERPRETED_FILTER_CONTROLS: Readonly<
  Record<keyof EntryGetFilterDto, ApplicationsSearchControl | null>
> = {
  date: 'date',
  dateFrom: 'dateFrom',
  dateTo: 'dateTo',
  courtCode: 'court',
  courtCodes: 'courtCodes',
  cjaCode: 'cja',
  otherLocationDescription: 'location',
  applicantOrganisation: 'applicantOrg',
  applicantSurname: 'applicantSurname',
  applicantName: 'applicantName',
  respondentOrganisation: 'respondentOrg',
  respondentSurname: 'respondentSurname',
  respondentName: 'respondentName',
  respondentPostcode: 'respondentPostcode',
  accountReference: 'accountReference',
  applicationTitle: 'applicationTitle',
  standardApplicantCode: 'standardApplicantCode',
  applicationCodes: 'applicationCodes',
  resultCodes: 'resultCodes',
  status: 'status',
  // Application category waits for FE-7 (held for the SIRO decision)
  applicationCodeCategory: null,
  // Exact standard applicants wait for FE-8 (held for a product decision)
  standardApplicantCodes: null,
};

/** The radio value of the "None of these" option in every choice. */
export const NONE_OF_THESE_VALUE = 'none';
export const NONE_OF_THESE_LABEL = 'None of these';

/** A radio option for a choice, with the option it applies. */
export interface InterpretationChoiceOption extends RadioOption {
  value: string;
  /** The option to apply, or null for "None of these". */
  pick: InterpretationChoiceOptionDto | null;
}

/** A choicesNeeded item as app-radio-group options. */
export interface InterpretationChoice {
  field: SearchFilterField;
  /** The prompt to show staff (untrusted text: render it as text). */
  text: string;
  options: InterpretationChoiceOption[];
}

/** Form changes for an interpretation. Labels and text are untrusted. */
export interface InterpretationFormChanges {
  /** The whole new form value: every control, defaults where unset. */
  formValue: ApplicationsSearchFormValue;
  /** Display text for the Court typeahead (PlaceFieldsState). */
  courthouseSearch: string;
  /** Display text for the CJA typeahead (PlaceFieldsState). */
  cjaSearch: string;
  /** Labels for Other courts codes (the page's courtChipLabels). */
  courtChipLabels: Record<string, string>;
  /**
   * The API's rows for the filters that were applied. Choice picks are not
   * added here: the picked radio option shows them.
   */
  appliedFilters: InterpretedFilterDto[];
  /** What was asked for but not applied, as text staff can read. */
  notApplied: string[];
  choices: InterpretationChoice[];
  unusedParts: string[];
  notices: SearchInterpretationNotice[];
}

type ListControl = 'applicationCodes' | 'resultCodes';

// Most codes the API accepts in one search (EntryGetFilterDto maxItems). The
// court limits are COURT_CODES_MAX_ITEMS and OTHER_COURTS_MAX_ITEMS.
const LIST_MAX_ITEMS: Readonly<Record<ListControl, number>> = {
  applicationCodes: 50,
  resultCodes: 20,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

// How the API joins the court names in a courtCodes row's label, and how a
// label ends when the API cut it to its 200-character limit
const COURT_LABEL_SEPARATOR = ', ';
const CUT_LABEL_END = '…';

/**
 * Turns an interpretation into changes for the Applications search form. The
 * interpretation's values replace the form's; see the file header.
 */
export function mapInterpretationToForm(
  interpretation: SearchInterpretationDto,
  activeCourts: readonly CourtLocationGetSummaryDto[],
): InterpretationFormChanges {
  const rows = listOf(interpretation.appliedFilters).map(copyRow);
  const draft: InterpretationFormChanges = {
    formValue: defaultFormValue(),
    courthouseSearch: '',
    cjaSearch: '',
    courtChipLabels: {},
    appliedFilters: [...rows],
    notApplied: [],
    choices: listOf(interpretation.choicesNeeded).map(toInterpretationChoice),
    unusedParts: [...listOf(interpretation.unusedParts)],
    notices: [...listOf(interpretation.notices)],
  };

  const filter = (interpretation.filter ?? {}) as Record<string, unknown>;
  const appliedFields = new Set<string>();
  const unappliedValues = new Map<string, unknown>();

  for (const [field, value] of Object.entries(filter)) {
    if (!isPresent(value)) {
      continue;
    }

    if (applyFilterValue(draft, field, value, rows, activeCourts)) {
      appliedFields.add(field);
    } else {
      unappliedValues.set(field, value);
    }
  }

  keepCourtsExclusive(draft);

  // Rows for filters that were not applied, or that are not in the filter
  const notAppliedRows = draft.appliedFilters.filter(
    (row) => !appliedFields.has(row.field),
  );
  draft.appliedFilters = draft.appliedFilters.filter((row) =>
    appliedFields.has(row.field),
  );
  addNotApplied(draft, ...notAppliedRows.map((row) => row.label));

  for (const [field, value] of unappliedValues) {
    if (rowsFor(rows, field).length === 0) {
      addNotApplied(draft, describeValue(field, value));
    }
  }

  return draft;
}

/**
 * Applies one picked choice option to the changes and returns new changes
 * (the input is not changed). "None of these" returns an unchanged copy. See
 * the file header for what a pick does to each kind of field.
 */
export function applyInterpretationChoice(
  changes: InterpretationFormChanges,
  option: InterpretationChoiceOption,
  activeCourts: readonly CourtLocationGetSummaryDto[],
): InterpretationFormChanges {
  const draft = cloneChanges(changes);
  const pick = option.pick;

  if (!pick) {
    return draft;
  }

  const field: string = pick.field;
  const control = controlFor(field);
  const before = control ? draft.formValue[control] : undefined;
  const applied =
    !!control &&
    applyOneValue(draft, field, control, pick.code, pick.label, activeCourts);

  if (!applied) {
    addNotApplied(draft, pick.label);
    return draft;
  }

  // A scalar pick replaces the interpretation's value for that field
  if (
    control &&
    !Array.isArray(before) &&
    control !== 'court' &&
    before !== draft.formValue[control]
  ) {
    draft.appliedFilters = withoutField(draft.appliedFilters, field);
  }

  keepCourtsExclusive(draft);
  return draft;
}

/**
 * Applies the court rule to changes and returns new changes (the input is not
 * changed): when a court is set, a CJA or Other location is taken out and
 * listed as not applied. Changes from the functions above already follow it;
 * this is for changes the page built from its own form.
 */
export function withCourtsExclusive(
  changes: InterpretationFormChanges,
): InterpretationFormChanges {
  const draft = cloneChanges(changes);
  keepCourtsExclusive(draft);
  return draft;
}

// Applies one filter field's value from the interpretation. True when the
// field was applied (for a list, when at least one code was).
function applyFilterValue(
  draft: InterpretationFormChanges,
  field: string,
  value: unknown,
  rows: readonly InterpretedFilterDto[],
  activeCourts: readonly CourtLocationGetSummaryDto[],
): boolean {
  const control = controlFor(field);
  if (!control) {
    return false;
  }

  if (
    control === 'courtCodes' ||
    control === 'applicationCodes' ||
    control === 'resultCodes'
  ) {
    if (!Array.isArray(value)) {
      return false;
    }

    const codes = toCodeList(value);
    const labels =
      control === 'courtCodes'
        ? courtCodesLabels(value, rowsFor(rows, field))
        : new Map<string, string>();
    let applied = false;

    for (const code of codes) {
      const label = labels.get(code);
      if (applyOneValue(draft, field, control, code, label, activeCourts)) {
        applied = true;
      } else {
        addNotApplied(draft, label ?? code);
      }
    }

    return applied;
  }

  if (typeof value !== 'string') {
    return false;
  }

  // One value has one row: its label (a court's name, for a courtCode)
  const label = rowsFor(rows, field)[0]?.label;

  return applyOneValue(draft, field, control, value, label, activeCourts);
}

// Applies a single value (one code for a list) to its control. False when the
// control cannot hold it.
function applyOneValue(
  draft: InterpretationFormChanges,
  field: string,
  control: ApplicationsSearchControl,
  rawValue: string,
  label: string | undefined,
  activeCourts: readonly CourtLocationGetSummaryDto[],
): boolean {
  const value = trimToUndefined(rawValue);
  if (!value) {
    return false;
  }

  const form = draft.formValue;

  switch (control) {
    case 'court':
    case 'courtCodes':
      return addCourt(draft, value, label, activeCourts, field === 'courtCode');
    case 'applicationCodes':
    case 'resultCodes':
      return addListCode(form, control, value);
    case 'date':
    case 'dateFrom':
    case 'dateTo':
      if (!isIsoDate(value)) {
        return false;
      }
      form[control] = value;
      return true;
    case 'status': {
      const status = toStatusOptionValue(value);
      if (!status) {
        return false;
      }
      form.status = status;
      return true;
    }
    case 'cja':
      form.cja = value;
      draft.cjaSearch = hasText(label) ? label : value;
      return true;
    default:
      form[control] = value;
      return true;
  }
}

// Adds a court to Court or Other courts, within the page's limits: at most
// COURT_CODES_MAX_ITEMS courts in all, and OTHER_COURTS_MAX_ITEMS in Other
// courts. An active courtCode goes into an empty Court. When Other courts is
// full and Court is empty, an active court goes into Court to make room: this
// court, or else one already in Other courts. A court already searched counts
// as applied. False when the court cannot be held.
function addCourt(
  draft: InterpretationFormChanges,
  code: string,
  label: string | undefined,
  activeCourts: readonly CourtLocationGetSummaryDto[],
  intoCourt: boolean,
): boolean {
  const form = draft.formValue;

  if ([form.court, ...form.courtCodes].some((c) => sameCode(c, code))) {
    return true;
  }

  const courtIsEmpty = !hasText(form.court);
  const courtCount = (courtIsEmpty ? 0 : 1) + form.courtCodes.length;
  if (courtCount >= COURT_CODES_MAX_ITEMS) {
    return false;
  }

  // Court is empty here when Other courts is full, as the total is under 20
  const otherCourtsFull = form.courtCodes.length >= OTHER_COURTS_MAX_ITEMS;
  const active = courtIsEmpty ? findActiveCourt(activeCourts, code) : undefined;

  if (active && (intoCourt || otherCourtsFull)) {
    setCourt(draft, active, label);
    return true;
  }

  if (otherCourtsFull && !moveOtherCourtToCourt(draft, activeCourts)) {
    return false;
  }

  form.courtCodes = [...form.courtCodes, code];
  draft.courtChipLabels = {
    ...draft.courtChipLabels,
    [code]: hasText(label) ? label : code,
  };
  return true;
}

// Moves the first active court in Other courts into Court, which must be
// empty, with its chip label as display text. False when Other courts has no
// active court.
function moveOtherCourtToCourt(
  draft: InterpretationFormChanges,
  activeCourts: readonly CourtLocationGetSummaryDto[],
): boolean {
  const form = draft.formValue;

  for (const code of form.courtCodes) {
    const active = findActiveCourt(activeCourts, code);
    if (active) {
      const { [code]: chipLabel, ...chipLabels } = draft.courtChipLabels;

      form.courtCodes = form.courtCodes.filter((c) => c !== code);
      draft.courtChipLabels = chipLabels;
      // A chip label that is only the code is not a name to show in Court
      setCourt(draft, active, chipLabel === code ? undefined : chipLabel);
      return true;
    }
  }

  return false;
}

// Puts an active court in Court. Its display text is the label, or else the
// court's typeahead label.
function setCourt(
  draft: InterpretationFormChanges,
  active: CourtLocationGetSummaryDto,
  label: string | undefined,
): void {
  draft.formValue.court = active.locationCode;
  draft.courthouseSearch = hasText(label)
    ? label
    : toCourtSuggestionItem(active).label;
}

function findActiveCourt(
  activeCourts: readonly CourtLocationGetSummaryDto[],
  code: string,
): CourtLocationGetSummaryDto | undefined {
  return activeCourts.find((court) => sameCode(court.locationCode, code));
}

function addListCode(
  form: ApplicationsSearchFormValue,
  control: ListControl,
  code: string,
): boolean {
  const codes = form[control];

  if (codes.some((c) => sameCode(c, code))) {
    return true;
  }

  if (codes.length >= LIST_MAX_ITEMS[control]) {
    return false;
  }

  form[control] = [...codes, code];
  return true;
}

// A court is narrower than a CJA or Other location, so it is kept and they
// are listed as not applied
function keepCourtsExclusive(draft: InterpretationFormChanges): void {
  const form = draft.formValue;

  if (!hasText(form.court) && form.courtCodes.length === 0) {
    return;
  }

  if (hasText(form.cja)) {
    dropFilter(draft, SearchFilterField.CJA_CODE, draft.cjaSearch || form.cja);
    form.cja = '';
    draft.cjaSearch = '';
  }

  if (hasText(form.location)) {
    dropFilter(draft, 'otherLocationDescription', form.location);
    form.location = '';
  }
}

// Moves a field's rows from appliedFilters to notApplied, or lists the
// fallback text when it has none
function dropFilter(
  draft: InterpretationFormChanges,
  field: string,
  fallback: string,
): void {
  const labels = rowsFor(draft.appliedFilters, field).map((row) => row.label);

  draft.appliedFilters = withoutField(draft.appliedFilters, field);
  addNotApplied(draft, ...(labels.length ? labels : [fallback]));
}

/**
 * Labels for the codes of a courtCodes list, from the field's rows. The API
 * sends one row for the whole field, not one for each court:
 * - A list of one code takes its row's label.
 * - For a list of more than one code, the row's label is the court names
 *   joined with ", " in the order of the codes, with the code itself for a
 *   court that has no name. The label's parts are paired with the codes by
 *   position in the list as sent (counting repeats and blanks, so a code the
 *   form drops can never shift the others), and only when there is one row,
 *   one part for each code, and the label was not cut ("…" at the end).
 *   Otherwise no code has a label, so each chip shows its code: a joined label
 *   is never given to one court.
 * Keys are the codes as toCodeList() keeps them (the first spelling).
 */
function courtCodesLabels(
  values: readonly unknown[],
  rows: readonly InterpretedFilterDto[],
): Map<string, string> {
  const labels = new Map<string, string>();

  if (values.length === 1) {
    const code = trimToUndefined(values[0]);
    const label = rows[0]?.label;
    if (code && label) {
      labels.set(code, label);
    }
    return labels;
  }

  const label = rows.length === 1 ? rows[0].label.trim() : '';
  if (!label || label.endsWith(CUT_LABEL_END)) {
    return labels;
  }

  const parts = label.split(COURT_LABEL_SEPARATOR);
  if (parts.length !== values.length) {
    return labels;
  }

  for (const [index, value] of values.entries()) {
    const code = trimToUndefined(value);
    if (code && ![...labels.keys()].some((key) => sameCode(key, code))) {
      labels.set(code, trimToUndefined(parts[index]) ?? code);
    }
  }

  return labels;
}

function toInterpretationChoice(
  choice: InterpretationChoiceDto,
): InterpretationChoice {
  return {
    field: choice.field,
    text: choice.text,
    options: [
      ...listOf(choice.options).map((option, index) => ({
        label: option.label,
        value: `option-${index}`,
        pick: { field: option.field, code: option.code, label: option.label },
      })),
      { label: NONE_OF_THESE_LABEL, value: NONE_OF_THESE_VALUE, pick: null },
    ],
  };
}

// The Status option value for an API status (OPEN to 'open'), if there is one
function toStatusOptionValue(status: string): string | undefined {
  const wanted = status.toUpperCase();
  return APPLICATIONS_LIST_CHOOSE_STATUS.find(
    (option) => option.value !== '' && option.value.toUpperCase() === wanted,
  )?.value;
}

// A real calendar date as YYYY-MM-DD. A day or month out of range rolls the
// date over, so it no longer reads back the same.
function isIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) {
    return false;
  }

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return date.toISOString().slice(0, 10) === value;
}

function controlFor(field: string): ApplicationsSearchControl | null {
  return Object.hasOwn(INTERPRETED_FILTER_CONTROLS, field)
    ? INTERPRETED_FILTER_CONTROLS[field as keyof EntryGetFilterDto]
    : null;
}

function isPresent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === 'string') {
    return hasText(value);
  }
  return !Array.isArray(value) || value.length > 0;
}

// What to list for a value with no label: the value, or else the field name
function describeValue(field: string, value: unknown): string {
  if (typeof value === 'string') {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const codes = toCodeList(value);
    return codes.length ? codes.join(', ') : field;
  }
  return field;
}

function addNotApplied(
  draft: InterpretationFormChanges,
  ...texts: string[]
): void {
  for (const text of texts) {
    const trimmed = trimToUndefined(text);
    if (trimmed && !draft.notApplied.includes(trimmed)) {
      draft.notApplied = [...draft.notApplied, trimmed];
    }
  }
}

// String codes, trimmed and without blanks or repeats (case-insensitive)
function toCodeList(values: readonly unknown[]): string[] {
  const codes: string[] = [];

  for (const value of values) {
    const code = trimToUndefined(value);
    if (code && !codes.some((c) => sameCode(c, code))) {
      codes.push(code);
    }
  }

  return codes;
}

function sameCode(a: string | null | undefined, b: string): boolean {
  return (a ?? '').trim().toUpperCase() === b.trim().toUpperCase();
}

function rowsFor(
  rows: readonly InterpretedFilterDto[],
  field: string,
): InterpretedFilterDto[] {
  return rows.filter((row) => isRowFor(row, field) && hasText(row.label));
}

function withoutField(
  rows: readonly InterpretedFilterDto[],
  field: string,
): InterpretedFilterDto[] {
  return rows.filter((row) => !isRowFor(row, field));
}

// Row fields are SearchFilterField values, compared as plain field names
function isRowFor(row: InterpretedFilterDto, field: string): boolean {
  const rowField: string = row.field;
  return rowField === field;
}

function listOf<T>(value: readonly T[] | null | undefined): readonly T[] {
  return Array.isArray(value) ? (value as readonly T[]) : [];
}

const copyRow = (row: InterpretedFilterDto): InterpretedFilterDto => ({
  ...row,
});

function cloneFormValue(
  value: ApplicationsSearchFormValue,
): ApplicationsSearchFormValue {
  return {
    ...value,
    applicationCodes: [...value.applicationCodes],
    resultCodes: [...value.resultCodes],
    courtCodes: [...value.courtCodes],
  };
}

function defaultFormValue(): ApplicationsSearchFormValue {
  const { isAdvancedSearch, ...defaults } = DEFAULT_APPLICATIONS_SEARCH_FORM;
  return cloneFormValue(defaults);
}

function cloneChanges(
  changes: InterpretationFormChanges,
): InterpretationFormChanges {
  return {
    formValue: cloneFormValue(changes.formValue),
    courthouseSearch: changes.courthouseSearch,
    cjaSearch: changes.cjaSearch,
    courtChipLabels: { ...changes.courtChipLabels },
    appliedFilters: changes.appliedFilters.map(copyRow),
    notApplied: [...changes.notApplied],
    choices: changes.choices.map((choice) => ({
      ...choice,
      options: choice.options.map((option) => ({
        ...option,
        pick: option.pick ? { ...option.pick } : null,
      })),
    })),
    unusedParts: [...changes.unusedParts],
    notices: [...changes.notices],
  };
}
