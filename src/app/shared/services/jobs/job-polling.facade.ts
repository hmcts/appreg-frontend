import { HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, exhaustMap, map, takeWhile, timer } from 'rxjs';

import { JobAcknowledgement, JobsApi } from '@openapi';

export type PolledJobState =
  | 'in_progress'
  | 'succeeded'
  | 'completed_with_errors'
  | 'failed';

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

const TERMINAL_SUCCESS_STATUSES = new Set(['SUCCEEDED', 'COMPLETED']);
const IN_PROGRESS_STATUSES = new Set([
  'RECEIVED',
  'VALIDATING',
  'PROCESSING',
  'PENDING',
  'QUEUED',
  'RUNNING',
  'IN_PROGRESS',
]);

@Injectable({
  providedIn: 'root',
})
export class JobPollingFacade {
  private readonly jobsApi = inject(JobsApi);

  watchJob(
    jobId: string,
    intervalMs = DEFAULT_INTERVAL_MS,
  ): Observable<PolledJobStatus> {
    return timer(0, intervalMs).pipe(
      exhaustMap(() =>
        this.jobsApi.getJobStatusById({ jobId }, 'response', false, {
          transferCache: false,
        }),
      ),
      map((response: HttpResponse<JobAcknowledgement>) => {
        if (!response.body) {
          throw new Error('No upload status returned.');
        }

        return normaliseJobStatus(response.body, jobId);
      }),
      takeWhile((job) => !job.isTerminal, true),
    );
  }
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
    'message',
    'detail',
    'reason',
  ]);
  const reportAvailable =
    readBoolean(raw, [
      'reportAvailable',
      'errorReportAvailable',
      'hasErrorReport',
    ]) ?? rawStatus === 'COMPLETED_WITH_ERRORS';

  let state: PolledJobState = 'in_progress';

  if (rawStatus === 'FAILED') {
    state = 'failed';
  } else if (
    rawStatus === 'COMPLETED_WITH_ERRORS' ||
    ((errorCount ?? 0) > 0 &&
      (TERMINAL_SUCCESS_STATUSES.has(rawStatus) || reportAvailable))
  ) {
    state = 'completed_with_errors';
  } else if (TERMINAL_SUCCESS_STATUSES.has(rawStatus)) {
    state = 'succeeded';
  } else if (!IN_PROGRESS_STATUSES.has(rawStatus)) {
    state = 'in_progress';
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

function readBoolean(
  record: Record<string, unknown>,
  keys: string[],
): boolean | null {
  for (const source of collectSearchSpace(record)) {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'boolean') {
        return value;
      }
    }
  }

  return null;
}
