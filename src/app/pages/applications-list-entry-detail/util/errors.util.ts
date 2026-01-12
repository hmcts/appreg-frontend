import {
  ErrorSummaryItem,
  HttpErrorSummary,
  ProblemDetails,
} from '@core-types/error/error.types';

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNumberProp(
  obj: Record<string, unknown>,
  key: string,
): number | undefined {
  const value = obj[key];
  return typeof value === 'number' ? value : undefined;
}

function getStringProp(
  obj: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = obj[key];
  return typeof value === 'string' ? value : undefined;
}

function toStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => {
      if (typeof v === 'string') {
        return v;
      }
      if (
        typeof v === 'number' ||
        typeof v === 'boolean' ||
        typeof v === 'bigint'
      ) {
        return String(v);
      }
      try {
        return JSON.stringify(v);
      } catch {
        return '[unserializable value]';
      }
    });
  }

  if (value === undefined || value === null) {
    return [];
  }

  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return [String(value)];
  }

  try {
    return [JSON.stringify(value)];
  } catch {
    return ['[unserializable value]'];
  }
}

function makeItems(...lines: (string | undefined)[]): ErrorSummaryItem[] {
  return lines
    .filter((t): t is string => !!t && t.trim().length > 0)
    .map((text) => ({ text }));
}

/* Problem extraction */

type ExtractedHttpProblem = {
  status: number;
  statusText?: string;
  problem?: ProblemDetails;
};

function extractErrors(
  rec: Record<string, unknown>,
): ProblemDetails['errors'] | undefined {
  const rawValue = rec['errors'];
  if (!isObject(rawValue)) {
    return undefined;
  }

  const raw = rawValue;
  const entries = Object.entries(raw);
  if (entries.length === 0) {
    return undefined;
  }

  const result: Record<string, string[]> = {};

  for (const [key, value] of entries) {
    const arr = toStringArray(value);
    if (arr.length > 0) {
      result[key] = arr;
    }
  }

  return result;
}

export function extractHttpProblem(err: unknown): ExtractedHttpProblem {
  if (!isObject(err)) {
    return { status: 0 };
  }

  const status = getNumberProp(err, 'status') ?? 0;
  const statusText = getStringProp(err, 'statusText');

  const rawError = (err as { error?: unknown }).error;
  if (!isObject(rawError)) {
    return { status, statusText };
  }

  const rec = rawError;
  const title = getStringProp(rec, 'title');
  const detail = getStringProp(rec, 'detail');
  const errors = extractErrors(rec);

  const problem: ProblemDetails = { title, detail, errors };

  return { status, statusText, problem };
}

/* mappers */

function buildBadRequestSummary(problem?: ProblemDetails): HttpErrorSummary {
  const errorHint = problem?.title ?? 'Bad request';

  if (problem?.errors && Object.keys(problem.errors).length > 0) {
    const summary = Object.values(problem.errors)
      .flatMap((msgs) => toStringArray(msgs))
      .map((text) => ({ text }));
    return { hasFatalError: true, errorHint, errorSummary: summary };
  }

  const errorSummary = makeItems(
    problem?.detail || 'We could not process your request.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

function buildUnauthenticatedSummary(
  problem?: ProblemDetails,
): HttpErrorSummary {
  const errorHint = problem?.title ?? 'You need to sign in';
  const errorSummary = makeItems(
    problem?.detail || 'Your session may have expired. Sign in and try again.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

function buildForbiddenSummary(problem?: ProblemDetails): HttpErrorSummary {
  const errorHint =
    problem?.title ?? 'You do not have permission to view this entry';
  const errorSummary = makeItems(
    problem?.detail || 'Ask an administrator to grant you access.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

function buildNotFoundSummary(problem?: ProblemDetails): HttpErrorSummary {
  const errorHint = problem?.title ?? 'Entry not found';
  const errorSummary = makeItems(
    problem?.detail ||
      'We could not find this Application List Entry. It may have been removed or you may not have access.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

function buildServerErrorSummary(problem?: ProblemDetails): HttpErrorSummary {
  const errorHint = problem?.title ?? 'A server error occurred';
  const errorSummary = makeItems(
    problem?.detail ||
      'Something went wrong on our side. Try again in a few moments.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

function buildGenericSummary(
  statusText?: string,
  problem?: ProblemDetails,
): HttpErrorSummary {
  const errorHint = problem?.title ?? 'There is a problem';
  const errorSummary = makeItems(
    problem?.detail || statusText || 'An unexpected error occurred. Try again.',
  );
  return { hasFatalError: true, errorHint, errorSummary };
}

/* Public mapping function */

export function mapHttpErrorToSummary(err: unknown): HttpErrorSummary {
  const { status, statusText, problem } = extractHttpProblem(err);

  if (status === 400) {
    return buildBadRequestSummary(problem);
  }

  if (status === 401) {
    return buildUnauthenticatedSummary(problem);
  }

  if (status === 403) {
    return buildForbiddenSummary(problem);
  }

  if (status === 404) {
    return buildNotFoundSummary(problem);
  }

  if (status === 0 || status >= 500) {
    return buildServerErrorSummary(problem);
  }

  return buildGenericSummary(statusText, problem);
}
