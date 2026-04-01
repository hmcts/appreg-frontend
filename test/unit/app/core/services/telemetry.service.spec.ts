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
        disableAjaxTracking: true,
        disableFetchTracking: true,
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

    expect(trackPageView).toHaveBeenCalledWith(
      {
        name: '/reports',
        uri: '/reports',
        properties: {
          route: '/reports',
        },
      },
    );
    expect(traceContext.setName).toHaveBeenLastCalledWith('/reports');

    const initializer = addTelemetryInitializer.mock.calls[0][0] as (
      item: { tags?: Record<string, string> },
    ) => void;
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

  it('does nothing when App Insights is disabled', () => {
    appConfigService.isAppInsightsEnabled.mockReturnValue(false);

    service.initialize();
    service.logException(new Error('boom'));
    service.logTrace('hello');

    expect(applicationInsightsCtor).not.toHaveBeenCalled();
    expect(trackException).not.toHaveBeenCalled();
    expect(trackTrace).not.toHaveBeenCalled();
  });
});
