import {
  ActivityType,
  CourtLocationGetSummaryDto,
  CriminalJusticeAreaGetDto,
  ResultCodeGetSummaryDto,
} from '@openapi';

export type CourtSuggestionItem = CourtLocationGetSummaryDto & {
  kind: 'court';
  label: string;
  value: string;
};

export type CjaSuggestionItem = CriminalJusticeAreaGetDto & {
  kind: 'cja';
  label: string;
  value: string;
};

export type ResultCodeSuggestionItem = ResultCodeGetSummaryDto & {
  kind: 'result-code';
  label: string;
  value: string;
};

export type ActivitySuggestionItem = {
  kind: 'activity';
  label: string;
  value: ActivityType;
  activity: ActivityType;
};

export type SuggestionsItem =
  | CourtSuggestionItem
  | CjaSuggestionItem
  | ResultCodeSuggestionItem
  | ActivitySuggestionItem;

/**
 * Transform inputs into types for use in suggestions component
 */

export const toCourtSuggestionItem = (
  court: CourtLocationGetSummaryDto,
): CourtSuggestionItem => ({
  ...court,
  kind: 'court',
  label: court.name
    ? `${court.locationCode ?? ''} - ${court.name}`
    : (court.locationCode ?? ''),
  value: court.locationCode ?? '',
});

export const toCjaSuggestionItem = (
  cja: CriminalJusticeAreaGetDto,
): CjaSuggestionItem => ({
  ...cja,
  kind: 'cja',
  label: cja.description
    ? `${cja.code ?? ''} - ${cja.description}`
    : (cja.code ?? ''),
  value: cja.code ?? '',
});

export const toResultCodeSuggestionItem = (
  resultCode: ResultCodeGetSummaryDto,
): ResultCodeSuggestionItem => ({
  ...resultCode,
  kind: 'result-code',
  label: `${resultCode.resultCode} - ${resultCode.title}`,
  value: resultCode.resultCode,
});

export const toActivitySuggestionItem = (
  activity: ActivityType,
  label: string,
): ActivitySuggestionItem => ({
  kind: 'activity',
  label,
  value: activity,
  activity,
});

/**
 * Get type of suggestion it is
 */
export const isCourtSuggestionItem = (
  item: SuggestionsItem,
): item is CourtSuggestionItem => item.kind === 'court';

export const isCjaSuggestionItem = (
  item: SuggestionsItem,
): item is CjaSuggestionItem => item.kind === 'cja';

export const isResultCodeSuggestionItem = (
  item: SuggestionsItem,
): item is ResultCodeSuggestionItem => item.kind === 'result-code';

export const isActivitySuggestionItem = (
  item: SuggestionsItem,
): item is ActivitySuggestionItem => item.kind === 'activity';
