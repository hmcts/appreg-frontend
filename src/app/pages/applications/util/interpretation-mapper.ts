// Pure functions that turn a plain-English search interpretation into changes
// for the Applications search form. The page applies the result.

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

export type ApplicationsSearchControl = keyof ApplicationsSearchFormValue;

/**
 * Null when the page has no control for the field. Typed against
 * EntryGetFilterDto, so a field the API adds, renames or removes fails here.
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

export const NONE_OF_THESE_VALUE = 'none';
export const NONE_OF_THESE_LABEL = 'None of these';

export interface InterpretationChoiceOption extends RadioOption {
  value: string;
  /** Null for "None of these". */
  pick: InterpretationChoiceOptionDto | null;
}

export interface InterpretationChoice {
  field: SearchFilterField;
  /** Untrusted text: render it as text. */
  text: string;
  options: InterpretationChoiceOption[];
}

/** Labels and text are untrusted: render them as text. */
export interface InterpretationFormChanges {
  formValue: ApplicationsSearchFormValue;
  courthouseSearch: string;
  cjaSearch: string;
  courtChipLabels: Record<string, string>;
  /** Picks are not added here: the picked radio option shows them. */
  appliedFilters: InterpretedFilterDto[];
  /** What was asked for but not applied, as text staff can read. */
  notApplied: string[];
  choices: InterpretationChoice[];
  unusedParts: string[];
  notices: SearchInterpretationNotice[];
}

type ListControl = 'applicationCodes' | 'resultCodes';

// Most codes the API accepts in one search (EntryGetFilterDto maxItems)
const LIST_MAX_ITEMS: Readonly<Record<ListControl, number>> = {
  applicationCodes: 50,
  resultCodes: 20,
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const COURT_LABEL_SEPARATOR = ', ';
const CUT_LABEL_END = '…';

/**
 * Replaces, never merges: every control starts from the page defaults, so
 * nothing from an earlier search is kept.
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
 * Returns new changes; the input is not changed. Apply every answer to the
 * result of mapInterpretationToForm() each time an answer changes, not to a
 * result that already has a pick in it.
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

// True when the field was applied (for a list, when at least one code was)
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

// False when the control cannot hold the value
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

// Court takes only active courts, as its typeahead knows no others. When
// Other courts is full and Court is empty, an active court goes into Court to
// make room. A court already searched counts as applied.
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

// Court must be empty. False when Other courts has no active court.
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

function dropFilter(
  draft: InterpretationFormChanges,
  field: string,
  fallback: string,
): void {
  const labels = rowsFor(draft.appliedFilters, field).map((row) => row.label);

  draft.appliedFilters = withoutField(draft.appliedFilters, field);
  addNotApplied(draft, ...(labels.length ? labels : [fallback]));
}

// The API sends one row for the field. For more than one code, its label is
// the court names (the code for a court with no name) joined with ", " in code
// order, which the API contract does not document. Parts are paired with the
// codes by position as sent, counting repeats and blanks so a dropped code
// never shifts the others, and only for one uncut row ("…" ends a cut label)
// with a part for each code. Otherwise each chip shows its code: a joined
// label is never given to one court. Keys are the first spelling of each code.
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

function toStatusOptionValue(status: string): string | undefined {
  const wanted = status.toUpperCase();
  return APPLICATIONS_LIST_CHOOSE_STATUS.find(
    (option) => option.value !== '' && option.value.toUpperCase() === wanted,
  )?.value;
}

// A day or month out of range rolls the date over, so it no longer reads back
// the same
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
