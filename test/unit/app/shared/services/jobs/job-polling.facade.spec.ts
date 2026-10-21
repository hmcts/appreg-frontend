import { HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { NEVER, of, throwError } from 'rxjs';

import { JobsApi } from '@openapi';
import {
  JobPollingFacade,
  PolledJobStatus,
} from '@services/jobs/job-polling.facade';

describe('JobPollingFacade', () => {
  let facade: JobPollingFacade;

  const jobsApiMock = {
    getJobStatusById: jest.fn(),
  };

  const flushTimers = async (ms: number): Promise<void> => {
    jest.advanceTimersByTime(ms);
    await Promise.resolve();
  };

  beforeEach(() => {
    jest.useFakeTimers();

    TestBed.configureTestingModule({
      providers: [
        JobPollingFacade,
        { provide: JobsApi, useValue: jobsApiMock },
      ],
    });

    facade = TestBed.inject(JobPollingFacade);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('polls immediately, stops on a terminal success state, and does not call the API again afterwards', async () => {
    jobsApiMock.getJobStatusById
      .mockReturnValueOnce(
        of(
          new HttpResponse({
            body: {
              id: 'job-1',
              status: 'PROCESSING',
            },
          }),
        ),
      )
      .mockReturnValueOnce(
        of(
          new HttpResponse({
            body: {
              id: 'job-1',
              status: 'COMPLETED',
              createdCount: 3,
            },
          }),
        ),
      );

    const emissions: PolledJobStatus[] = [];
    const error = jest.fn();
    const complete = jest.fn();
    facade.watchJob('job-1', 1_000).subscribe({
      next: (value) => emissions.push(value),
      error,
      complete,
    });

    await flushTimers(0);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
    expect(emissions[0]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        state: 'in_progress',
        isTerminal: false,
      }),
    );

    await flushTimers(1_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
    expect(emissions[1]).toEqual(
      expect.objectContaining({
        id: 'job-1',
        state: 'succeeded',
        isTerminal: true,
        createdCount: 3,
      }),
    );

    await flushTimers(5 * 60 * 1_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);
  });

  it('emits a terminal status after the ten-minute polling deadline and stops polling', async () => {
    jobsApiMock.getJobStatusById.mockReturnValue(
      of(new HttpResponse({ body: { id: 'job-1', status: 'PROCESSING' } })),
    );

    const emissions: PolledJobStatus[] = [];
    const error = jest.fn();
    const complete = jest.fn();
    facade.watchJob('job-1', 11 * 60 * 1_000).subscribe({
      next: (job) => emissions.push(job),
      error,
      complete,
    });

    await flushTimers(0);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);

    await flushTimers(10 * 60 * 1_000 - 1);
    expect(emissions).toHaveLength(1);

    await flushTimers(1);
    expect(emissions[1]).toEqual({
      id: 'job-1',
      rawStatus: 'UNKNOWN',
      state: 'unknown',
      isTerminal: true,
      createdCount: null,
      errorCount: null,
      totalCount: null,
      message:
        'The job is still being processed or its status could not be confirmed.',
      raw: {},
    });
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);

    await flushTimers(11 * 60 * 1_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
  });

  it('uses a custom request timeout before retrying a stalled read', async () => {
    jobsApiMock.getJobStatusById
      .mockReturnValueOnce(NEVER)
      .mockReturnValueOnce(
        of(new HttpResponse({ body: { id: 'job-1', status: 'COMPLETED' } })),
      );

    const emissions: PolledJobStatus[] = [];
    const error = jest.fn();
    const complete = jest.fn();
    facade.watchJob('job-1', 1_000, 2_500).subscribe({
      next: (job) => emissions.push(job),
      error,
      complete,
    });

    await flushTimers(2_499);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
    expect(emissions).toHaveLength(0);

    await flushTimers(1);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
    expect(emissions).toHaveLength(0);

    await flushTimers(1_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
    expect(emissions).toEqual([
      expect.objectContaining({ state: 'succeeded', isTerminal: true }),
    ]);
    expect(error).not.toHaveBeenCalled();
    expect(complete).toHaveBeenCalledTimes(1);

    await flushTimers(10 * 60 * 1_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
  });

  it('retries status reads and reports unknown when they all fail', async () => {
    jobsApiMock.getJobStatusById.mockReturnValue(
      throwError(() => new Error('status unavailable')),
    );

    const emissions: PolledJobStatus[] = [];
    facade
      .watchJob('job-1', 1_000, 10_000, 3)
      .subscribe((job) => emissions.push(job));

    await flushTimers(3_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(3);
    expect(emissions).toEqual([
      expect.objectContaining({
        id: 'job-1',
        state: 'unknown',
        isTerminal: true,
      }),
    ]);
  });

  it('retries a stalled status read after its request timeout', async () => {
    jobsApiMock.getJobStatusById
      .mockReturnValueOnce(NEVER)
      .mockReturnValueOnce(
        of(new HttpResponse({ body: { id: 'job-1', status: 'COMPLETED' } })),
      );

    const emissions: PolledJobStatus[] = [];
    const complete = jest.fn();
    facade.watchJob('job-1', 1_000, 60_000, 3).subscribe({
      next: (job) => emissions.push(job),
      complete,
    });

    await flushTimers(59_999);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
    expect(emissions).toHaveLength(0);

    await flushTimers(1);
    expect(emissions).toHaveLength(0);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);

    await flushTimers(1_000);
    expect(emissions).toEqual([
      expect.objectContaining({ state: 'succeeded', isTerminal: true }),
    ]);
    expect(complete).toHaveBeenCalledTimes(1);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
  });

  it('reports unknown after a later read exhausts its request timeout retries', async () => {
    jobsApiMock.getJobStatusById
      .mockReturnValueOnce(
        of(new HttpResponse({ body: { id: 'job-1', status: 'PROCESSING' } })),
      )
      .mockReturnValue(NEVER);

    const emissions: PolledJobStatus[] = [];
    const complete = jest.fn();
    facade.watchJob('job-1', 1_000, 120_000, 3).subscribe({
      next: (job) => emissions.push(job),
      complete,
    });

    await flushTimers(362_999);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(4);
    expect(emissions).toEqual([
      expect.objectContaining({ state: 'in_progress', isTerminal: false }),
    ]);

    await flushTimers(1);
    expect(emissions[1]).toEqual(
      expect.objectContaining({
        state: 'unknown',
        isTerminal: true,
        message: expect.stringContaining('Job polling status unknown:'),
      }),
    );
    expect(complete).toHaveBeenCalledTimes(1);

    await flushTimers(120_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(4);
  });

  it.each([401, 403])(
    'passes through HTTP %i without retrying or reporting an unknown job',
    async (status) => {
      const authorizationError = new HttpErrorResponse({ status });
      jobsApiMock.getJobStatusById.mockReturnValue(
        throwError(() => authorizationError),
      );
      const next = jest.fn();
      const error = jest.fn();

      facade.watchJob('job-1', 1_000).subscribe({ next, error });
      await flushTimers(0);

      expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(1);
      expect(next).not.toHaveBeenCalled();
      expect(error).toHaveBeenCalledWith(authorizationError);
    },
  );
});
