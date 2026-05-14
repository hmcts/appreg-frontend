import { HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

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
              status: 'SUCCEEDED',
              createdCount: 3,
            },
          }),
        ),
      );

    const emissions: PolledJobStatus[] = [];
    facade.watchJob('job-1', 1_000).subscribe((value) => emissions.push(value));

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

    await flushTimers(5_000);
    expect(jobsApiMock.getJobStatusById).toHaveBeenCalledTimes(2);
  });

  it('normalises completed-with-errors payloads', async () => {
    jobsApiMock.getJobStatusById.mockReturnValue(
      of(
        new HttpResponse({
          body: {
            id: 'job-2',
            status: 'COMPLETED_WITH_ERRORS',
            summary: {
              successfulRecords: 4,
              failedRecords: 2,
            },
            errorReportAvailable: true,
          },
        }),
      ),
    );

    const emissions: PolledJobStatus[] = [];
    facade.watchJob('job-2', 1_000).subscribe((value) => emissions.push(value));

    await flushTimers(0);

    expect(emissions[0]).toEqual(
      expect.objectContaining({
        id: 'job-2',
        state: 'completed_with_errors',
        isTerminal: true,
        createdCount: 4,
        errorCount: 2,
      }),
    );
  });
});
