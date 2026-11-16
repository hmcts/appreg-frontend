import { HttpErrorResponse } from '@angular/common/http';

import {
  getHttpStatus,
  getProblemText,
  hasProblemText,
} from '@util/http-error-to-text';

describe('hasProblemText', () => {
  it('returns true when an HTTP error body has a detail or title', () => {
    expect(
      hasProblemText(
        new HttpErrorResponse({ status: 400, error: { detail: 'Bad dates' } }),
      ),
    ).toBe(true);
    expect(
      hasProblemText(
        new HttpErrorResponse({ status: 400, error: { title: 'Bad Request' } }),
      ),
    ).toBe(true);
  });

  it.each([
    ['a non-problem body', '<html>Bad Request</html>'],
    ['an empty body', null],
    ['blank problem fields', { detail: '  ', title: '' }],
  ])('returns false for %s', (_label, error) => {
    expect(hasProblemText(new HttpErrorResponse({ status: 400, error }))).toBe(
      false,
    );
  });

  it('returns false for an error that is not an HTTP error response', () => {
    expect(hasProblemText({ detail: 'Bad dates' })).toBe(false);
  });
});

describe('getHttpStatus', () => {
  it('returns the status from an HTTP error response', () => {
    const err = new HttpErrorResponse({ status: 403 });

    expect(getHttpStatus(err)).toBe(403);
  });

  it('returns a numeric status from a plain object', () => {
    expect(getHttpStatus({ status: 413 })).toBe(413);
  });

  it.each([null, undefined, {}, { status: '403' }, '403'])(
    'returns zero when no numeric status is available: %p',
    (err) => {
      expect(getHttpStatus(err)).toBe(0);
    },
  );
});

describe('getProblemText', () => {
  const problem = {
    title: '  Application list entries have changed  ',
    detail: '  invalid_entry_ids=[entry-1]  ',
  };

  it('uses detail by default for an HTTP error response', () => {
    const err = new HttpErrorResponse({ status: 403, error: problem });

    expect(getProblemText(err)).toBe('invalid_entry_ids=[entry-1]');
  });

  it('uses title when selected for an HTTP error response', () => {
    const err = new HttpErrorResponse({ status: 403, error: problem });

    expect(getProblemText(err, 'title')).toBe(
      'Application list entries have changed',
    );
  });

  it('applies the same text priority to a plain problem response', () => {
    expect(getProblemText(problem)).toBe('invalid_entry_ids=[entry-1]');
    expect(getProblemText(problem, 'title')).toBe(
      'Application list entries have changed',
    );
  });

  it('uses the other field when the preferred field is empty', () => {
    const noTitle = new HttpErrorResponse({
      status: 403,
      error: { title: '  ', detail: 'Details remain available' },
    });

    expect(getProblemText(noTitle, 'title')).toBe('Details remain available');
    expect(
      getProblemText({ detail: '  ', title: 'Title remains available' }),
    ).toBe('Title remains available');
  });

  it('returns the request fallback when no problem text is available', () => {
    expect(getProblemText({ title: '  ', detail: '  ' }, 'title')).toBe(
      'Request failed',
    );
    expect(getProblemText(null, 'title')).toBe('Request failed');
  });
});
