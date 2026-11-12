import {
  HttpErrorResponse,
  HttpRequest,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  TestRequest,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { ErrorHandler, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, Subject, lastValueFrom, throwError } from 'rxjs';

import { errorInterceptor } from '@interceptors/error.interceptor';
import {
  ApplicationCodeSuggestionsApi,
  BASE_PATH,
  Configuration,
  SearchInterpretationsApi,
} from '@openapi';
import { AppConfigService } from '@services/app-config.service';
import { ErrorMessageService } from '@services/error-message.service';
import { TelemetryErrorHandler } from '@services/telemetry-error-handler.service';
import { TelemetryService } from '@services/telemetry.service';

type MockAppInsightsModule = {
  ApplicationInsights: jest.Mock;
  __mockAppInsights: {
    addTelemetryInitializer: jest.Mock;
    getTraceCtx: jest.Mock;
    loadAppInsights: jest.Mock;
    trackException: jest.Mock;
    trackPageView: jest.Mock;
    trackTrace: jest.Mock;
  };
};

// Only the real TelemetryService below uses this; the other tests stub it.
jest.mock('@microsoft/applicationinsights-web', () => ({
  __mockAppInsights: {
    addTelemetryInitializer: jest.fn(),
    getTraceCtx: jest.fn(),
    loadAppInsights: jest.fn(),
    trackException: jest.fn(),
    trackPageView: jest.fn(),
    trackTrace: jest.fn(),
  },
  ApplicationInsights: jest.fn(() => {
    const mod: MockAppInsightsModule = jest.requireMock(
      '@microsoft/applicationinsights-web',
    );

    return mod.__mockAppInsights;
  }),
}));

const appInsights = jest.requireMock<MockAppInsightsModule>(
  '@microsoft/applicationinsights-web',
).__mockAppInsights;

// Synthetic stand-ins for the free text people type into the AI features. The
// first and last words are unique markers that survive every encoding a leak
// could use (raw, percent-encoded, form-encoded or JSON-escaped).
const QUESTION =
  'qmark7f3c9a entries for a fictional applicant last week qmark7f3c9z';
const DESCRIPTION = 'dmark4b8e21 a fictional licence application dmark4b8e2z';

function markersOf(text: string): string[] {
  const words = text.split(' ');
  return [words[0], words[words.length - 1]];
}

function serialise(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    item instanceof Error
      ? { name: item.name, message: item.message, stack: item.stack }
      : item,
  );
}

function expectFreeTextAbsent(captured: unknown, text: string): void {
  const serialised = serialise(captured);

  for (const marker of markersOf(text)) {
    expect(serialised).not.toContain(marker);
  }
}

describe('errorInterceptor', () => {
  let router: { navigate: jest.Mock };
  let errorHandler: { handleError: jest.Mock };
  let errorMessageService: { handleErrorMessage: jest.Mock };
  let telemetryService: { logException: jest.Mock };

  const req = new HttpRequest('GET', '/test?user=alice');

  beforeEach(() => {
    router = { navigate: jest.fn().mockResolvedValue(true) };
    errorHandler = { handleError: jest.fn() };
    errorMessageService = { handleErrorMessage: jest.fn() };
    telemetryService = { logException: jest.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        { provide: ErrorHandler, useValue: errorHandler },
        { provide: ErrorMessageService, useValue: errorMessageService },
        { provide: TelemetryService, useValue: telemetryService },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });
  });

  function runInterceptorWithError(
    error: unknown,
    request: HttpRequest<unknown> = req,
  ) {
    return TestBed.runInInjectionContext(() =>
      errorInterceptor(request, () => throwError(() => error)),
    );
  }

  it('navigates to /login on 401 and reports to ErrorHandler', (done) => {
    const err = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/foo',
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'HttpRequestFailure',
            message: 'HTTP GET /test failed with 401 Unauthorized',
          }),
          expect.objectContaining({
            requestMethod: 'GET',
            requestUrl: '/test',
            responseUrl: '/api/foo',
            statusCode: 401,
            statusText: 'Unauthorized',
          }),
        );

        expect(router.navigate).toHaveBeenCalledTimes(1);
        expect(router.navigate).toHaveBeenCalledWith(['/login']);

        expect(errorMessageService.handleErrorMessage).not.toHaveBeenCalled();

        expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);

        done();
      },
    });
  });

  it('delegates to ErrorMessageService on non-401 HttpErrorResponse and reports to ErrorHandler', (done) => {
    const err = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: '/api/foo?query=1',
      error: { detail: 'boom', correlationId: 'correlation-123' },
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e: unknown) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'HttpRequestFailure',
            message: 'HTTP GET /test failed with 500 Server Error',
          }),
          expect.objectContaining({
            requestMethod: 'GET',
            requestUrl: '/test',
            responseUrl: '/api/foo',
            statusCode: 500,
            statusText: 'Server Error',
            correlationId: 'correlation-123',
          }),
        );

        expect(router.navigate).not.toHaveBeenCalled();

        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledTimes(1);
        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledWith(
          err,
        );

        expect(errorHandler.handleError).toHaveBeenCalledTimes(1);
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);

        done();
      },
    });
  });

  it('does not navigate to /login on server-side 401s', (done) => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });

    const err = new HttpErrorResponse({
      status: 401,
      statusText: 'Unauthorized',
      url: '/api/foo',
    });

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e) => {
        expect(e).toBe(err);

        expect(router.navigate).not.toHaveBeenCalled();
        expect(errorMessageService.handleErrorMessage).toHaveBeenCalledWith(
          err,
        );
        expect(errorHandler.handleError).toHaveBeenCalledWith(err);

        done();
      },
    });
  });

  describe('with the real ErrorMessageService', () => {
    let routerWithUrl: { navigate: jest.Mock; navigateByUrl: jest.Mock };
    let realErrorMessageService: ErrorMessageService;

    const aiEndpoints: [string, string][] = [
      ['GET', '/ai/capabilities'],
      ['POST', '/application-list-entries/search-interpretations'],
      ['POST', '/application-codes/suggestions'],
    ];

    beforeEach(() => {
      routerWithUrl = {
        navigate: jest.fn().mockResolvedValue(true),
        navigateByUrl: jest.fn().mockResolvedValue(true),
      };

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          ErrorMessageService,
          { provide: Router, useValue: routerWithUrl },
          { provide: ErrorHandler, useValue: errorHandler },
          { provide: TelemetryService, useValue: telemetryService },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });
      realErrorMessageService = TestBed.inject(ErrorMessageService);
    });

    async function runWithStatus(
      method: string,
      path: string,
      status: number,
    ): Promise<void> {
      const request = new HttpRequest(method, path, null);
      const err = new HttpErrorResponse({
        status,
        statusText: 'Error',
        url: path,
        error: { title: 'Error', status },
      });

      await expect(
        lastValueFrom(
          TestBed.runInInjectionContext(() =>
            errorInterceptor(request, () => throwError(() => err)),
          ),
        ),
      ).rejects.toBe(err);
    }

    it.each(aiEndpoints)(
      'navigates to /login on a 401 from %s %s',
      async (method, path) => {
        await runWithStatus(method, path, 401);

        expect(routerWithUrl.navigate).toHaveBeenCalledWith(['/login']);
        expect(routerWithUrl.navigateByUrl).not.toHaveBeenCalled();
        expect(realErrorMessageService.errorMessage()).toBeNull();
      },
    );

    it.each(aiEndpoints)(
      'keeps a 503 from %s %s on the page',
      async (method, path) => {
        await runWithStatus(method, path, 503);

        expect(routerWithUrl.navigate).not.toHaveBeenCalled();
        expect(routerWithUrl.navigateByUrl).not.toHaveBeenCalled();
        expect(realErrorMessageService.errorMessage()?.status).toBe(503);
      },
    );

    it('still navigates to /internal-error on a 500 from another endpoint', async () => {
      await runWithStatus('GET', '/application-list-entries', 500);

      expect(routerWithUrl.navigate).not.toHaveBeenCalled();
      expect(routerWithUrl.navigateByUrl).toHaveBeenCalledWith(
        '/internal-error',
      );
    });
  });

  describe('with the generated AI clients and real telemetry', () => {
    type AiRequest = {
      field: string;
      path: string;
      text: string;
      send: (text: string) => Observable<unknown>;
      successBody: (text: string) => object;
    };

    const aiRequests: AiRequest[] = [
      {
        field: 'question',
        path: '/application-list-entries/search-interpretations',
        text: QUESTION,
        send: (text) =>
          TestBed.inject(SearchInterpretationsApi).interpretEntrySearch(
            { searchInterpretationRequestDto: { question: text } },
            'body',
            false,
            { transferCache: false },
          ),
        // Unused parts of the question come back in the response.
        successBody: (text) => ({
          interpretationId: '00000000-0000-4000-8000-000000000001',
          filter: {},
          appliedFilters: [],
          choicesNeeded: [],
          unusedParts: [text],
          notices: [],
        }),
      },
      {
        field: 'description',
        path: '/application-codes/suggestions',
        text: DESCRIPTION,
        send: (text) =>
          TestBed.inject(ApplicationCodeSuggestionsApi).suggestApplicationCodes(
            {
              applicationCodeSuggestionRequestDto: {
                description: text,
                lodgementDate: '2026-01-05',
              },
            },
            'body',
            false,
            { transferCache: false },
          ),
        successBody: () => ({
          suggestionId: '00000000-0000-4000-8000-000000000002',
          suggestions: [],
          needsMoreDetail: true,
          notices: ['DESCRIPTION_TOO_VAGUE'],
        }),
      },
    ];

    const statusText: Record<number, string> = {
      0: 'Unknown Error',
      400: 'Bad Request',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'Not Found',
      422: 'Unprocessable Content',
      429: 'Too Many Requests',
      500: 'Internal Server Error',
      502: 'Bad Gateway',
      503: 'Service Unavailable',
      504: 'Gateway Timeout',
    };

    // Problem types the API documents for the AI endpoints.
    const aiProblemTypes: Record<number, string> = {
      422: 'AI-5',
      429: 'AI-4',
      503: 'AI-2',
      504: 'AI-3',
    };

    const errorCases = aiRequests.flatMap((aiRequest) =>
      [0, 400, 401, 403, 404, 422, 429, 500, 502, 503, 504].map(
        (status) =>
          [aiRequest.field, aiRequest.path, status, aiRequest] as const,
      ),
    );

    let aiRouter: {
      events: Subject<unknown>;
      navigate: jest.Mock;
      navigateByUrl: jest.Mock;
      navigated: boolean;
      url: string;
    };
    let consoleCalls: unknown[][];
    let consoleSpies: jest.SpyInstance[];
    let httpTesting: HttpTestingController;

    beforeEach(() => {
      jest.clearAllMocks();

      consoleCalls = [];
      consoleSpies = (['debug', 'error', 'info', 'log', 'warn'] as const).map(
        (method) =>
          jest
            .spyOn(console, method)
            .mockImplementation((...args: unknown[]) => {
              consoleCalls.push(args);
            }),
      );

      aiRouter = {
        events: new Subject<unknown>(),
        navigate: jest.fn().mockResolvedValue(true),
        navigateByUrl: jest.fn().mockResolvedValue(true),
        navigated: true,
        url: '/applications',
      };

      // Mirrors the browser providers in app.config.ts.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          provideHttpClient(withInterceptors([errorInterceptor])),
          provideHttpClientTesting(),
          { provide: BASE_PATH, useValue: '' },
          {
            provide: Configuration,
            useFactory: () =>
              new Configuration({ basePath: '', withCredentials: true }),
          },
          { provide: ErrorHandler, useExisting: TelemetryErrorHandler },
          {
            provide: AppConfigService,
            useValue: {
              getAppInsightsConnectionString: () => 'InstrumentationKey=abc123',
              isAppInsightsEnabled: () => true,
            },
          },
          { provide: Router, useValue: aiRouter },
          { provide: PLATFORM_ID, useValue: 'browser' },
        ],
      });

      TestBed.inject(TelemetryService).initialize();
      httpTesting = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpTesting.verify();
      aiRouter.events.complete();
      for (const spy of consoleSpies) {
        spy.mockRestore();
      }
    });

    function expectOneAiRequest({ path, text }: AiRequest): TestRequest {
      const testRequest = httpTesting.expectOne(path);

      // The free text really is sent: in the POST body, never in the URL.
      expect(testRequest.request.method).toBe('POST');
      expect(serialise(testRequest.request.body)).toContain(markersOf(text)[0]);
      expect(testRequest.request.urlWithParams).toBe(path);

      return testRequest;
    }

    function failWith(testRequest: TestRequest, status: number): void {
      if (status === 0) {
        testRequest.error(new ProgressEvent('error'), {
          status,
          statusText: statusText[status],
        });
        return;
      }

      testRequest.flush(
        {
          type: aiProblemTypes[status] ?? 'about:blank',
          title: statusText[status],
          status,
          detail: statusText[status],
        },
        { status, statusText: statusText[status] },
      );
    }

    function capturedOutput(): unknown {
      return {
        telemetry: [
          appInsights.trackException.mock.calls,
          appInsights.trackPageView.mock.calls,
          appInsights.trackTrace.mock.calls,
        ],
        console: consoleCalls,
        pageError: TestBed.inject(ErrorMessageService).errorMessage(),
        navigation: [
          aiRouter.navigate.mock.calls,
          aiRouter.navigateByUrl.mock.calls,
        ],
      };
    }

    it.each(errorCases)(
      'keeps the %s out of telemetry, the console and the page error when POST %s fails with status %i',
      async (_field, path, status, aiRequest) => {
        const result = lastValueFrom(aiRequest.send(aiRequest.text));

        failWith(expectOneAiRequest(aiRequest), status);

        await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
        // The failure reached telemetry and the console, so the check below
        // looks at real output.
        expect(appInsights.trackException).toHaveBeenCalledTimes(1);
        expect(appInsights.trackException).toHaveBeenCalledWith(
          {
            exception: expect.objectContaining({
              name: 'HttpRequestFailure',
              message: `HTTP POST ${path} failed with ${status} ${statusText[status]}`,
            }),
          },
          expect.objectContaining({
            requestMethod: 'POST',
            requestUrl: path,
            responseUrl: path,
            statusCode: String(status),
          }),
        );
        expect(consoleCalls).toContainEqual([
          'ERROR',
          expect.any(HttpErrorResponse),
        ]);
        expectFreeTextAbsent(capturedOutput(), aiRequest.text);
      },
    );

    // This case deliberately checks telemetry only. TelemetryErrorHandler's
    // delegate, Angular's default ErrorHandler, runs
    // console.error('ERROR', HttpErrorResponse), and that response includes
    // error.error. ErrorMessageService also keeps the problem body as `detail`.
    // So a problem body that repeats the question or description reaches the
    // console and the page error state: the frontend relies on the API never
    // repeating free text in problem responses. Once a separate fix strips the
    // body from both, check capturedOutput() here like the cases above.
    it.each(aiRequests)(
      'keeps the $field out of telemetry when the API error body repeats it',
      async (aiRequest) => {
        const { field, text } = aiRequest;
        const result = lastValueFrom(aiRequest.send(text));

        expectOneAiRequest(aiRequest).flush(
          {
            type: 'about:blank',
            title: 'Bad Request',
            status: 400,
            detail: `${field}: ${text}`,
            [field]: text,
          },
          { status: 400, statusText: 'Bad Request' },
        );

        await expect(result).rejects.toBeInstanceOf(HttpErrorResponse);
        expect(appInsights.trackException).toHaveBeenCalledTimes(1);
        expectFreeTextAbsent(
          [
            appInsights.trackException.mock.calls,
            appInsights.trackTrace.mock.calls,
          ],
          text,
        );
      },
    );

    it.each(aiRequests)(
      'sends nothing to telemetry or the console when the $field request succeeds',
      async (aiRequest) => {
        const result = lastValueFrom(aiRequest.send(aiRequest.text));

        expectOneAiRequest(aiRequest).flush(
          aiRequest.successBody(aiRequest.text),
        );

        await expect(result).resolves.toBeDefined();
        expect(appInsights.trackException).not.toHaveBeenCalled();
        expect(appInsights.trackTrace).not.toHaveBeenCalled();
        expect(consoleCalls).toEqual([]);
        expectFreeTextAbsent(capturedOutput(), aiRequest.text);
      },
    );
  });

  it('does nothing for non-HttpErrorResponse errors (still rethrows)', (done) => {
    const err = new Error('nope');

    runInterceptorWithError(err).subscribe({
      next: () => done.fail('expected error'),
      error: (e: unknown) => {
        expect(e).toBe(err);

        expect(telemetryService.logException).not.toHaveBeenCalled();
        expect(router.navigate).not.toHaveBeenCalled();
        expect(errorMessageService.handleErrorMessage).not.toHaveBeenCalled();
        expect(errorHandler.handleError).not.toHaveBeenCalled();

        done();
      },
    });
  });
});
