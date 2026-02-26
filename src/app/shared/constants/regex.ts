/* eslint-disable no-control-regex */

export const ALPHANUMERIC_REGEX: RegExp = /^[A-Za-z0-9]*$/;

export const UK_POSTCODE_REGEX: RegExp =
  /^(?:[Gg][Ii][Rr] 0[Aa]{2}|(?:(?:[A-Za-z][0-9]{1,2})|(?:[A-Za-z][A-Ha-hJ-Yj-y][0-9]{1,2})|(?:[A-Za-z][0-9][A-Za-z])|(?:[A-Za-z][A-Ha-hJ-Yj-y][0-9][A-Za-z])) [0-9][A-Za-z]{2})$/;

export const STANDARD_APPLICANT_CODE_REGEX: RegExp = /^[a-zA-Z0-9+\-._ ]*$/;

export const APPLICATION_CODE_REGEX: RegExp = /^[a-zA-Z0-9]*$/;

// Name/address free-text (aligned with BE):
// Allows any characters except control characters:
// - C0 controls: \u0000–\u001F (includes tab/newline/carriage return)
// - DEL + C1 controls: \u007F–\u009F
export const NAME_REGEX: RegExp = /^[^\u0000-\u001F\u007F-\u009F]*$/;
export const ADDRESS_REGEX: RegExp = /^[^\u0000-\u001F\u007F-\u009F]*$/;
