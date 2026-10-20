/*
Polls /jobs/{jobId} for async bulk-upload jobs.
Normalises the currently expected terminal states (SUCCEEDED, FAILED), treats COMPLETED as success for
compatibility, and reads counts/messages from a few possible response shapes
while the job-status contract is still settling.
*/

import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Observable,
  catchError,
  defer,
  exhaustMap,
  map,
  merge,
  of,
  retry,
  takeWhile,
  throwError,
  timer,
} from 'rxjs';

import { JobAcknowledgement, JobStatus, JobsApi } from '@openapi';
import { getHttpStatus, getProblemText } from '@util/http-error-to-text';

export type PolledJobState = 'in_progress' | 'succeeded' | 'failed' | 'unknown';

export interface PolledJobStatus {
  id: string;
  rawStatus: string;
  state: PolledJobState;
  isTerminal: boolean;
  createdCount: number | null;
  errorCount: number | null;
  totalCount: number | null;
  message: string | null;
  raw: Record<string, unknown>;
}

const DEFAULT_INTERVAL_MS = 2_000;
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000; // 5 mins
const RETRY_POLL_COUNT = 5;

const TERMINAL_SUCCESS_STATUSES = new Set<string>([
  'SUCCEEDED',
  String(JobStatus.COMPLETED),
]);
const FAILED_STATUS = String(JobStatus.FAILED);

@Injectable({
  providedIn: 'root',
})
export class JobPollingFacade {
  private readonly jobsApi = inject(JobsApi);

  watchJob(
    jobId: string,
    intervalMs: number = DEFAULT_INTERVAL_MS,
    timeout: number = DEFAULT_TIMEOUT_MS,
    maxAttempts: number = RETRY_POLL_COUNT,
  ): Observable<PolledJobStatus> {
    return merge(
      timer(0, intervalMs).pipe(
        exhaustMap(() =>
          defer(() =>
            this.jobsApi.getJobStatusById({ jobId }, 'response', false, {
              transferCache: false,
            }),
          ).pipe(
            map((response: HttpResponse<JobAcknowledgement>) => {
              if (!response.body) {
                throw new Error('No upload status returned.');
              }
              return normaliseJobStatus(response.body, jobId);
            }),
            retry({
              count: maxAttempts - 1,
              delay: (err: unknown) =>
                isAuthorizationError(err)
                  ? throwError(() => err)
                  : timer(intervalMs),
            }),
            catchError((err: unknown) =>
              isAuthorizationError(err)
                ? throwError(() => err)
                : of({
                    id: jobId,
                    rawStatus: 'UNKNOWN',
                    state: 'unknown',
                    isTerminal: true,
                    createdCount: null,
                    errorCount: null,
                    totalCount: null,
                    message: `Job polling status unknown: ${getProblemText(err)}`,
                    raw: {},
                  } satisfies PolledJobStatus),
            ),
          ),
        ),
      ),
      timer(timeout).pipe(
        map(
          (): PolledJobStatus => ({
            id: jobId,
            rawStatus: 'UNKNOWN',
            state: 'unknown',
            isTerminal: true,
            createdCount: null,
            errorCount: null,
            totalCount: null,
            message:
              'The job is still being processed or its status could not be confirmed.',
            raw: {},
          }),
        ),
      ),
    ).pipe(takeWhile((job) => !job.isTerminal, true));
  }
}

function isAuthorizationError(err: unknown): boolean {
  const status = getHttpStatus(err);
  return status === 401 || status === 403;
}

function normaliseJobStatus(
  payload: unknown,
  fallbackJobId: string,
): PolledJobStatus {
  const raw = toRecord(payload);
  const rawStatus = readString(raw, ['status'])?.toUpperCase() ?? 'UNKNOWN';
  const createdCount = readNumber(raw, [
    'createdCount',
    'recordsCreated',
    'successfulCount',
    'successfulRecords',
    'successCount',
    'totalRecordsCreated',
  ]);
  const errorCount = readNumber(raw, [
    'errorCount',
    'errorsCount',
    'failedCount',
    'failedRecords',
    'failureCount',
    'totalRecordsFailed',
    'validationErrorCount',
  ]);
  const totalCount = readNumber(raw, [
    'totalCount',
    'recordCount',
    'recordsProcessed',
    'processedCount',
    'totalRecords',
  ]);
  const message = readString(raw, [
    'failureMessage',
    'errorMessage',
    'error_description',
    'errorDescription',
    'message',
    'detail',
    'reason',
  ]);

  let state: PolledJobState = 'in_progress';

  if (rawStatus === FAILED_STATUS) {
    state = 'failed';
  } else if (TERMINAL_SUCCESS_STATUSES.has(rawStatus)) {
    state = 'succeeded';
  }

  const id = readString(raw, ['id', 'jobId']) ?? fallbackJobId;
  const isTerminal = state !== 'in_progress';

  return {
    id,
    rawStatus,
    state,
    isTerminal,
    createdCount,
    errorCount,
    totalCount,
    message,
    raw,
  };
}

function toRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? { ...value } : {};
}

function collectSearchSpace(
  record: Record<string, unknown>,
): Record<string, unknown>[] {
  const nestedKeys = ['summary', 'details', 'result', 'outcome'];
  const nested = nestedKeys
    .map((key) => record[key])
    .filter(
      (value): value is Record<string, unknown> =>
        typeof value === 'object' && value !== null,
    );

  return [record, ...nested];
}

function readNumber(
  record: Record<string, unknown>,
  keys: string[],
): number | null {
  for (const source of collectSearchSpace(record)) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
          return parsed;
        }
      }
    }
  }

  return null;
}

function readString(
  record: Record<string, unknown>,
  keys: string[],
): string | null {
  for (const source of collectSearchSpace(record)) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed) {
          return trimmed;
        }
      }
    }
  }

  return null;
}
