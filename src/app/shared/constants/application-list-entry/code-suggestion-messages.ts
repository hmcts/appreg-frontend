/**
 * Fixed copy for application code suggestions ("Describe the application")
 * on the create-entry page.
 *
 * The page never shows model text. It shows this copy, plus each
 * suggestion's reason, which the API builds from the code's own title or
 * legislation, rendered as text.
 *
 * - CODE_SUGGESTION_MESSAGES: the field, the button, progress, results and
 *   validation errors.
 * - CODE_SUGGESTION_NOTICE_MESSAGES: one message per CodeSuggestionNotice.
 * - CODE_SUGGESTION_ERROR_MESSAGES: one message per HTTP status that stays on
 *   the page. Any other status uses CODE_SUGGESTIONS_UNAVAILABLE.
 *
 * Every message is for content design sign-off before the pilot.
 */

import { CodeSuggestionNotice } from '@openapi';

// The API accepts descriptions of 1 to 1000 characters.
export const CODE_SUGGESTION_DESCRIPTION_MAX_LENGTH = 1000;

export const CODE_SUGGESTIONS_UNAVAILABLE =
  'Code suggestions are not available. Search for a code instead.';

const NEEDS_MORE_DETAIL =
  'Add more detail to the description to get better code suggestions.';

export const CODE_SUGGESTION_MESSAGES = {
  label: 'Describe the application',
  hint: 'Codes are suggested using AI. Do not include names or other personal details.',
  suggestButton: 'Suggest codes',
  loading: 'Finding codes…',
  tableCaption: 'Suggested codes',
  suggestionsShown:
    'Suggested codes are shown in the table, best match first. Check a code is right before you add it.',
  noSuggestions:
    'No codes were suggested for that description. Add more detail, or search for a code instead.',
  needsMoreDetail: NEEDS_MORE_DETAIL,
  notActiveOnLodgementDate: 'Not active on the lodgement date',
  descriptionRequired: 'Enter a description of the application',
  descriptionTooLong: `Description must be ${CODE_SUGGESTION_DESCRIPTION_MAX_LENGTH} characters or fewer`,
} as const;

export const CODE_SUGGESTION_NOTICE_MESSAGES: Readonly<
  Record<CodeSuggestionNotice, string>
> = {
  [CodeSuggestionNotice.CODES_NOT_ACTIVE_ON_LODGEMENT_DATE]:
    'At least one suggested code was not active on the lodgement date. Check the lodgement date before you add a code.',
  [CodeSuggestionNotice.UNKNOWN_CODES_DROPPED]:
    'Some codes were left out because they do not exist or are not active today.',
  // Same meaning as needsMoreDetail, so the page shows it once.
  [CodeSuggestionNotice.DESCRIPTION_TOO_VAGUE]: NEEDS_MORE_DETAIL,
};

// The statuses ErrorMessageService keeps on the page for this endpoint.
export type CodeSuggestionErrorStatus =
  | 0
  | 400
  | 403
  | 404
  | 422
  | 429
  | 500
  | 502
  | 503
  | 504;

export const CODE_SUGGESTION_ERROR_MESSAGES: Readonly<
  Record<CodeSuggestionErrorStatus, string>
> = {
  0: CODE_SUGGESTIONS_UNAVAILABLE,
  400: CODE_SUGGESTIONS_UNAVAILABLE,
  403: CODE_SUGGESTIONS_UNAVAILABLE,
  404: CODE_SUGGESTIONS_UNAVAILABLE,
  422: 'We could not suggest any codes from that description. Add more detail, or search for a code instead.',
  429: 'You have made too many requests. Try again in a minute.',
  500: CODE_SUGGESTIONS_UNAVAILABLE,
  502: CODE_SUGGESTIONS_UNAVAILABLE,
  503: CODE_SUGGESTIONS_UNAVAILABLE,
  504: CODE_SUGGESTIONS_UNAVAILABLE,
};
