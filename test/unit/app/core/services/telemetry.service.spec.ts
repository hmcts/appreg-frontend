import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';

import { AppConfigService } from '@services/app-config.service';
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

const mockAppInsightsModule: MockAppInsightsModule = jest.requireMock(
  '@microsoft/applicationinsights-web',
);

const {
  ApplicationInsights: applicationInsightsCtor,
  __mockAppInsights: {
    addTelemetryInitializer,
    getTraceCtx,
    loadAppInsights,
    trackException,
    trackPageView,
    trackTrace,
  },
} = mockAppInsightsModule;

type TelemetryItemLike = {
  tags?: Record<string, string>;
  baseType?: string;
  baseData?: Record<string, unknown>;
};

// Synthetic stand-ins for the free text people type into the AI features. The
// first and last words are unique markers that survive every encoding a leak
// could use (raw, percent-encoded, form-encoded or JSON-escaped).
const AI_FREE_TEXT = [
  {
    field: 'question',
    path: '/application-list-entries/search-interpretations',
    text: 'qmark7f3c9a entries for a fictional applicant last week qmark7f3c9z',
  },
  {
    field: 'description',
    path: '/application-codes/suggestions',
    text: 'dmark4b8e21 a fictional licence application dmark4b8e2z',
  },
];

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

function telemetryInitializer(): (item: TelemetryItemLike) => void {
  return addTelemetryInitializer.mock.calls[0][0] as (
    item: TelemetryItemLike,
  ) => void;
}

describe('TelemetryService', () => {
  let routerEvents: Subject<unknown>;
  let router: {
    events: Subject<unknown>;
    navigated: boolean;
    url: string;
  };
  let traceContext: {
    setName: jest.Mock;
    setTraceId: jest.Mock;
    setSpanId: jest.Mock;
  };
  let appConfigService: {
    getAppInsightsConnectionString: jest.Mock;
    isAppInsightsEnabled: jest.Mock;
  };
  let service: TelemetryService;

  beforeEach(() => {
    jest.clearAllMocks();

    routerEvents = new Subject<unknown>();
    router = {
      events: routerEvents,
      navigated: true,
      url: '/applications-list?user=alice',
    };
    traceContext = {
      setName: jest.fn(),
      setTraceId: jest.fn(),
      setSpanId: jest.fn(),
    };
    appConfigService = {
      getAppInsightsConnectionString: jest
        .fn()
        .mockReturnValue('InstrumentationKey=abc123'),
      isAppInsightsEnabled: jest.fn().mockReturnValue(true),
    };
    getTraceCtx.mockReturnValue(traceContext);

    TestBed.configureTestingModule({
      providers: [
        TelemetryService,
        { provide: AppConfigService, useValue: appConfigService },
        { provide: Router, useValue: router },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    });

    service = TestBed.inject(TelemetryService);
  });

  afterEach(() => {
    routerEvents.complete();
  });

  it('initializes Application Insights and tracks route changes', () => {
    service.initialize();

    expect(applicationInsightsCtor).toHaveBeenCalledWith({
      config: {
        connectionString: 'InstrumentationKey=abc123',
        disableAjaxTracking: false,
        disableFetchTracking: false,
        enableAutoRouteTracking: false,
      },
    });
    expect(loadAppInsights).toHaveBeenCalledTimes(1);
    expect(addTelemetryInitializer).toHaveBeenCalledTimes(1);
    expect(trackPageView).toHaveBeenCalledWith({
      name: '/applications-list',
      uri: '/applications-list',
      properties: {
        route: '/applications-list',
      },
    });
    expect(traceContext.setName).toHaveBeenCalledWith('/applications-list');
    expect(traceContext.setTraceId).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f]{32}$/),
    );
    expect(traceContext.setSpanId).toHaveBeenCalledWith(
      expect.stringMatching(/^[0-9a-f]{16}$/),
    );

    routerEvents.next(
      new NavigationEnd(
        1,
        '/reports?search=alice',
        '/reports?search=alice#summary',
      ),
    );

    expect(trackPageView).toHaveBeenCalledWith({
      name: '/reports',
      uri: '/reports',
      properties: {
        route: '/reports',
      },
    });
    expect(traceContext.setName).toHaveBeenLastCalledWith('/reports');

    const initializer = addTelemetryInitializer.mock.calls[0][0] as (item: {
      tags?: Record<string, string>;
    }) => void;
    const telemetryItem = { tags: {} as Record<string, string> };
    initializer(telemetryItem);

    expect(telemetryItem.tags).toEqual(
      expect.objectContaining({
        'ai.cloud.role': 'hmcts applications register - frontend',
        'ai.operation.name': '/reports',
        'ai.operation.id': expect.stringMatching(/^[0-9a-f]{32}$/),
      }),
    );
  });

  it('adds route context to exceptions without query parameters', () => {
    service.initialize();

    const error = new Error('boom');
    service.logException(error, { statusCode: 500 });

    expect(trackException).toHaveBeenCalledWith(
      { exception: error },
      expect.objectContaining({
        route: '/applications-list',
        statusCode: '500',
      }),
    );
  });

  it('sanitizes dependency telemetry URLs before they are emitted', () => {
    service.initialize();

    const initializer = addTelemetryInitializer.mock.calls[0][0] as (item: {
      tags?: Record<string, string>;
      baseType?: string;
      baseData?: {
        name?: string;
        target?: string;
        data?: string;
      };
    }) => void;
    const telemetryItem = {
      tags: {} as Record<string, string>,
      baseType: 'RemoteDependencyData',
      baseData: {
        name: 'GET /application-list-entries?applicantSurname=SyntheticApplicant&pageNumber=0',
        target:
          'https://appreg.example.test/application-list-entries?applicantSurname=SyntheticApplicant&pageNumber=0',
        data: '/application-list-entries?applicantSurname=SyntheticApplicant&pageNumber=0',
      },
    };

    initializer(telemetryItem);

    expect(telemetryItem.baseData).toEqual({
      name: 'GET /application-list-entries',
      target: '/application-list-entries',
      data: '/application-list-entries',
    });
  });

  it('does not alter non-dependency telemetry', () => {
    service.initialize();

    const initializer = addTelemetryInitializer.mock.calls[0][0] as (item: {
      tags?: Record<string, string>;
      baseType?: string;
      baseData?: Record<string, unknown>;
    }) => void;
    const baseData = {
      name: 'Search completed',
      properties: { resultCount: 10 },
    };
    const telemetryItem = {
      tags: {} as Record<string, string>,
      baseType: 'EventData',
      baseData,
    };

    initializer(telemetryItem);

    expect(telemetryItem.baseData).toEqual({
      name: 'Search completed',
      properties: { resultCount: 10 },
    });
  });

  it('does nothing when App Insights is disabled', () => {
    appConfigService.isAppInsightsEnabled.mockReturnValue(false);

    service.initialize();
    service.logException(new Error('boom'));
    service.logTrace('hello');

    expect(applicationInsightsCtor).not.toHaveBeenCalled();
    expect(trackException).not.toHaveBeenCalled();
    expect(trackTrace).not.toHaveBeenCalled();
  });

  describe('AI free text', () => {
    it('keeps error-body and header capture off so AI request and error bodies are never collected', () => {
      service.initialize();

      const [{ config }] = applicationInsightsCtor.mock.calls[0] as [
        { config: Record<string, unknown> },
      ];

      // With these off, the SDK records an AI call's method, URL, status and
      // timing, but never its request body, headers or error response body.
      expect({
        addRequestContext: config['addRequestContext'],
        enableAjaxErrorStatusText: config['enableAjaxErrorStatusText'] ?? false,
        enableRequestHeaderTracking:
          config['enableRequestHeaderTracking'] ?? false,
        enableResponseHeaderTracking:
          config['enableResponseHeaderTracking'] ?? false,
      }).toEqual({
        addRequestContext: undefined,
        enableAjaxErrorStatusText: false,
        enableRequestHeaderTracking: false,
        enableResponseHeaderTracking: false,
      });
    });

    it.each(AI_FREE_TEXT)(
      'strips the $field from $path dependency telemetry when it reaches the URL',
      ({ field, path, text }) => {
        service.initialize();

        const url = `https://appreg.example.test${path}?${field}=${encodeURIComponent(text)}`;
        // Shaped as @microsoft/applicationinsights-dependencies-js 3.x builds a
        // failed XHR dependency (ajaxRecord.CreateTrackItem inside
        // createTelemetryItem) with the capture options above left off.
        const item = {
          tags: {} as Record<string, string>,
          baseType: 'RemoteDependencyData',
          baseData: {
            id: '|0123456789abcdef0123456789abcdef.0123456789abcdef',
            target: url,
            name: `POST ${url}`,
            type: 'Ajax',
            duration: 120,
            success: false,
            responseCode: 422,
            properties: { HttpMethod: 'POST' },
          } as Record<string, unknown>,
        };
        expect(serialise(item)).toContain(markersOf(text)[0]);

        telemetryInitializer()(item);

        expect(item.baseData).toEqual(
          expect.objectContaining({
            name: `POST ${path}`,
            target: path,
            responseCode: 422,
            properties: { HttpMethod: 'POST' },
          }),
        );
        expectFreeTextAbsent(item, text);
      },
    );

    it.each(AI_FREE_TEXT)(
      'keeps the $field out of page views and operation names when the page URL carries it',
      ({ field, text }) => {
        const query = `?${field}=${encodeURIComponent(text)}`;
        router.url = `/applications${query}`;

        service.initialize();
        routerEvents.next(
          new NavigationEnd(
            2,
            `/applications${query}`,
            `/applications${query}#${encodeURIComponent(text)}`,
          ),
        );
        const item: TelemetryItemLike = {
          tags: {},
          baseType: 'PageviewData',
          baseData: { name: '/applications' },
        };
        telemetryInitializer()(item);

        expect(trackPageView).toHaveBeenCalledTimes(2);
        expect(trackPageView).toHaveBeenLastCalledWith({
          name: '/applications',
          uri: '/applications',
          properties: { route: '/applications' },
        });
        expect(item.tags?.['ai.operation.name']).toBe('/applications');
        expectFreeTextAbsent(
          [trackPageView.mock.calls, traceContext.setName.mock.calls, item],
          text,
        );
      },
    );

    it.each(AI_FREE_TEXT)(
      'keeps the $field out of exception and trace routes when a URL carries it',
      ({ field, path, text }) => {
        const query = `?${field}=${encodeURIComponent(text)}`;
        router.url = `/applications${query}`;

        service.initialize();
        service.logException(
          new Error(`HTTP POST ${path} failed with 422 Unprocessable Content`),
          { route: `${path}${query}`, statusCode: 422 },
        );
        service.logException(new Error('Unexpected browser error'));
        service.logTrace('Frontend asset load error recovery', {
          attemptsInWindow: 1,
        });

        expect(trackException).toHaveBeenNthCalledWith(
          1,
          expect.anything(),
          expect.objectContaining({ route: path, statusCode: '422' }),
        );
        expect(trackException).toHaveBeenNthCalledWith(
          2,
          expect.anything(),
          expect.objectContaining({ route: '/applications' }),
        );
        expect(trackTrace).toHaveBeenCalledWith(
          { message: 'Frontend asset load error recovery' },
          expect.objectContaining({ route: '/applications' }),
        );
        expectFreeTextAbsent(
          [trackException.mock.calls, trackTrace.mock.calls],
          text,
        );
      },
    );
  });
});
