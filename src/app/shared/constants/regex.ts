/* eslint-disable no-control-regex */

export const ALPHANUMERIC_REGEX: RegExp = /^[A-Za-z0-9]*$/;

export const UK_POSTCODE_REGEX: RegExp =
  /^(?:GIR 0AA|[A-Z]{1,2}\d[A-Z\d]? \d[A-Z]{2})$/i;

export const STANDARD_APPLICANT_CODE_REGEX: RegExp = /^[a-zA-Z0-9+\-._ ]*$/;

export const APPLICATION_CODE_REGEX: RegExp = /^[a-zA-Z0-9]*$/;

// A complete application code (aligned with BE searchedApplicationCode):
// 1 to 10 letters and digits.
export const SEARCHED_APPLICATION_CODE_REGEX: RegExp = /^[A-Za-z0-9]{1,10}$/;

// A date as the date input reports it: yyyy-MM-dd.
export const ISO_DATE_REGEX: RegExp = /^\d{4}-\d{2}-\d{2}$/;

// A UUID in its 8-4-4-4-12 hex form, as the API's format: uuid fields use.
export const UUID_REGEX: RegExp =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const APPLICATION_TITLE_REGEX: RegExp =
  /^[a-zA-Z0-9\-+.,£@?'()/%_ &!:]*$/;

// Name/address free-text (aligned with BE):
// Allows any characters except control characters:
// - C0 controls: \u0000–\u001F (includes tab/newline/carriage return)
// - DEL + C1 controls: \u007F–\u009F
export const NAME_REGEX: RegExp = /^[^\u0000-\u001F\u007F-\u009F]*$/;
export const ADDRESS_REGEX: RegExp = /^[^\u0000-\u001F\u007F-\u009F]*$/;
