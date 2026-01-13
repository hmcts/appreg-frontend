import {
  extractHttpProblem,
  mapHttpErrorToSummary,
} from '@components/applications-list-entry-detail/util/errors.util';
import { HttpErrorSummary } from '@core-types/error/error.types';

describe('http-error-mapper', () => {
  describe('extractHttpProblem', () => {
    it('returns status 0 when err is not an object', () => {
      expect(extractHttpProblem('nope')).toEqual({ status: 0 });
      expect(extractHttpProblem(null)).toEqual({ status: 0 });
      expect(extractHttpProblem(123)).toEqual({ status: 0 });
    });

    it('extracts status and statusText even when error body is missing/non-object', () => {
      const err = { status: 404, statusText: 'Not Found', error: 'x' };
      expect(extractHttpProblem(err)).toEqual({
        status: 404,
        statusText: 'Not Found',
      });
    });

    it('extracts title/detail and errors map (string trimming / coercion)', () => {
      const err = {
        status: 400,
        statusText: 'Bad Request',
        error: {
          title: 'Validation failed',
          detail: 'Fix fields',
          errors: {
            a: ['m1', 2, true],
            b: 'single',
            c: null, // becomes []
            d: [{ x: 1 }], // json string
          },
        },
      };

      const res = extractHttpProblem(err);

      expect(res.status).toBe(400);
      expect(res.statusText).toBe('Bad Request');
      expect(res.problem?.title).toBe('Validation failed');
      expect(res.problem?.detail).toBe('Fix fields');

      // c is omitted because it becomes []
      expect(res.problem?.errors).toMatchObject({
        a: ['m1', '2', 'true'],
        b: ['single'],
        d: ['{"x":1}'],
      });
      expect(Object.keys(res.problem?.errors ?? {})).not.toContain('c');
    });

    it('handles unserializable values in errors by returning placeholder', () => {
      const cyclic: Record<string, unknown> = {};
      cyclic['self'] = cyclic;

      const err = {
        status: 400,
        error: {
          errors: {
            x: [cyclic],
          },
        },
      };

      const res = extractHttpProblem(err);
      expect(res.problem?.errors).toEqual({ x: ['[unserializable value]'] });
    });

    it('returns problem with undefined title/detail when not present', () => {
      const err = { status: 500, error: { errors: { a: ['x'] } } };
      const res = extractHttpProblem(err);

      expect(res.problem).toEqual({
        title: undefined,
        detail: undefined,
        errors: { a: ['x'] },
      });
    });
  });

  describe('mapHttpErrorToSummary', () => {
    const fatal = (s: HttpErrorSummary) => {
      expect(s.hasFatalError).toBe(true);
      expect(Array.isArray(s.errorSummary)).toBe(true);
    };

    it('maps 400 with field errors into flat summary list and uses title as hint', () => {
      const err = {
        status: 400,
        error: {
          title: 'Bad input',
          errors: {
            f1: ['a', 'b'],
            f2: ['c'],
          },
        },
      };

      const s = mapHttpErrorToSummary(err);
      fatal(s);

      expect(s.errorHint).toBe('Bad input');
      expect(s.errorSummary).toEqual([
        { text: 'a' },
        { text: 'b' },
        { text: 'c' },
      ]);
    });

    it('maps 400 without errors -> uses detail fallback (or default text)', () => {
      const err = {
        status: 400,
        error: { title: 'Bad input', detail: 'Nope' },
      };

      const s = mapHttpErrorToSummary(err);
      fatal(s);

      expect(s.errorHint).toBe('Bad input');
      expect(s.errorSummary).toEqual([{ text: 'Nope' }]);
    });

    it('maps 401 -> unauthenticated defaults when no problem fields exist', () => {
      const err = { status: 401, error: {} };

      const s = mapHttpErrorToSummary(err);
      fatal(s);

      expect(s.errorHint).toBe('You need to sign in');
      expect(s.errorSummary).toEqual([
        { text: 'Your session may have expired. Sign in and try again.' },
      ]);
    });

    it('maps 403 -> forbidden message', () => {
      const err = {
        status: 403,
        error: { title: 'Forbidden', detail: 'Denied' },
      };

      const s = mapHttpErrorToSummary(err);
      fatal(s);

      expect(s.errorHint).toBe('Forbidden');
      expect(s.errorSummary).toEqual([{ text: 'Denied' }]);
    });

    it('maps 404 -> not found defaults', () => {
      const err = { status: 404, error: {} };

      const s = mapHttpErrorToSummary(err);
      fatal(s);

      expect(s.errorHint).toBe('Entry not found');
      expect(s.errorSummary[0]?.text).toContain(
        'We could not find this Application List Entry',
      );
    });

    it('maps 0 and >=500 -> server error summary', () => {
      const s0 = mapHttpErrorToSummary({ status: 0, error: {} });
      fatal(s0);
      expect(s0.errorHint).toBe('A server error occurred');

      const s500 = mapHttpErrorToSummary({
        status: 500,
        error: { title: 'Oops' },
      });
      fatal(s500);
      expect(s500.errorHint).toBe('Oops');
    });

    it('maps other statuses -> generic summary using detail, otherwise statusText', () => {
      const s = mapHttpErrorToSummary({
        status: 418,
        statusText: "I'm a teapot",
        error: {},
      });
      fatal(s);

      expect(s.errorHint).toBe('There is a problem');
      expect(s.errorSummary).toEqual([{ text: "I'm a teapot" }]);

      const s2 = mapHttpErrorToSummary({
        status: 418,
        statusText: "I'm a teapot",
        error: { detail: 'Custom detail' },
      });
      fatal(s2);
      expect(s2.errorSummary).toEqual([{ text: 'Custom detail' }]);
    });

    it('filters empty/whitespace summary lines (makeItems) and does not apply a second fallback', () => {
      const s = mapHttpErrorToSummary({
        status: 401,
        error: { title: 'T', detail: '   ' },
      });

      expect(s.errorHint).toBe('T');
      expect(s.errorSummary).toEqual([]);
    });
  });
});
