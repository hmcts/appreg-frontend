import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

import { isEmpty, optional } from '@validators/optional-validator';

describe('isEmpty', () => {
  it('returns true for null/undefined', () => {
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
  });

  it('returns true for empty/whitespace-only strings', () => {
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty('\n\t ')).toBe(true);
  });

  it('returns false for non-empty strings (after trim)', () => {
    expect(isEmpty('a')).toBe(false);
    expect(isEmpty('  a  ')).toBe(false);
    expect(isEmpty('0')).toBe(false);
  });

  it('returns false for non-string values (including false/0/objects/arrays)', () => {
    expect(isEmpty(false)).toBe(false);
    expect(isEmpty(true)).toBe(false);
    expect(isEmpty(0)).toBe(false);
    expect(isEmpty(123)).toBe(false);
    expect(isEmpty({})).toBe(false);
    expect(isEmpty([])).toBe(false);
  });
});

describe('optional', () => {
  const makeControl = (value: unknown): AbstractControl =>
    ({ value }) as AbstractControl;

  it('returns null and does not call inner validator when control value is empty (null/undefined)', () => {
    const inner: ValidatorFn = jest.fn((): ValidationErrors => ({ bad: true }));
    const wrapped = optional(inner);

    expect(wrapped(makeControl(null))).toBeNull();
    expect(wrapped(makeControl(undefined))).toBeNull();
    expect(inner).not.toHaveBeenCalled();
  });

  it('returns null and does not call inner validator when control value is empty (blank string)', () => {
    const inner: ValidatorFn = jest.fn((): ValidationErrors => ({ bad: true }));
    const wrapped = optional(inner);

    expect(wrapped(makeControl(''))).toBeNull();
    expect(wrapped(makeControl('   '))).toBeNull();
    expect(wrapped(makeControl('\n\t '))).toBeNull();
    expect(inner).not.toHaveBeenCalled();
  });

  it('calls inner validator when value is non-empty string and returns its result', () => {
    const inner: ValidatorFn = jest.fn((): ValidationErrors => ({ bad: true }));
    const wrapped = optional(inner);

    const c = makeControl('  hello  ');
    expect(wrapped(c)).toEqual({ bad: true });
    expect(inner).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledWith(c);
  });

  it('calls inner validator for non-string non-null values and returns its result', () => {
    const inner: ValidatorFn = jest.fn((): ValidationErrors => ({ bad: true }));
    const wrapped = optional(inner);

    const c1 = makeControl(0);
    const c2 = makeControl(false);
    const c3 = makeControl({});

    expect(wrapped(c1)).toEqual({ bad: true });
    expect(wrapped(c2)).toEqual({ bad: true });
    expect(wrapped(c3)).toEqual({ bad: true });

    expect(inner).toHaveBeenCalledTimes(3);
    expect(inner).toHaveBeenNthCalledWith(1, c1);
    expect(inner).toHaveBeenNthCalledWith(2, c2);
    expect(inner).toHaveBeenNthCalledWith(3, c3);
  });

  it('propagates null when inner validator returns null', () => {
    const inner: ValidatorFn = jest.fn(() => null);
    const wrapped = optional(inner);

    const c = makeControl('x');
    expect(wrapped(c)).toBeNull();
    expect(inner).toHaveBeenCalledTimes(1);
    expect(inner).toHaveBeenCalledWith(c);
  });
});
