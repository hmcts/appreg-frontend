const setup = jest.fn();
const setAzureMonitorOptions = jest.fn();
const setAutoCollectRequests = jest.fn();
const setAutoCollectConsole = jest.fn();
const setAutoCollectDependencies = jest.fn();
const setAutoCollectExceptions = jest.fn();
const setSendLiveMetrics = jest.fn();
const start = jest.fn();
const getConfig = jest.fn();
const defaultClient = {
  trackException: jest.fn(),
  trackTrace: jest.fn(),
};

const mockSdkChain = {
  setAzureMonitorOptions,
  setAutoCollectRequests,
  setAutoCollectConsole,
  setAutoCollectDependencies,
  setAutoCollectExceptions,
  setSendLiveMetrics,
  start,
};

setup.mockReturnValue(mockSdkChain);
setAzureMonitorOptions.mockReturnValue(mockSdkChain);
setAutoCollectRequests.mockReturnValue(mockSdkChain);
setAutoCollectConsole.mockReturnValue(mockSdkChain);
setAutoCollectDependencies.mockReturnValue(mockSdkChain);
setAutoCollectExceptions.mockReturnValue(mockSdkChain);
setSendLiveMetrics.mockReturnValue(mockSdkChain);

jest.mock('applicationinsights', () => ({
  __esModule: true,
  defaultClient,
  setup,
}));

jest.mock('config', () => ({
  __esModule: true,
  default: {
    get: getConfig,
  },
}));

import { AppInsights } from '../../../server/modules/appinsights';

describe('AppInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConfig.mockReturnValue('InstrumentationKey=abc123');
    (AppInsights as unknown as { started: boolean }).started = false;
  });

  it('disables automatic request collection while keeping the existing telemetry features', () => {
    AppInsights.enable();

    expect(getConfig).toHaveBeenCalledWith(
      'secrets.appreg.app-insights-connection-string-fe',
    );
    expect(setup).toHaveBeenCalledWith('InstrumentationKey=abc123');
    expect(setAzureMonitorOptions).toHaveBeenCalledTimes(1);
    expect(setAutoCollectRequests).toHaveBeenCalledWith(false);
    expect(setAutoCollectConsole).toHaveBeenCalledWith(true, true);
    expect(setAutoCollectDependencies).toHaveBeenCalledWith(true);
    expect(setAutoCollectExceptions).toHaveBeenCalledWith(true);
    expect(setSendLiveMetrics).toHaveBeenCalledWith(true);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('removes query parameters only from outgoing HTTP dependency telemetry', () => {
    AppInsights.enable();

    const spanProcessor = setAzureMonitorOptions.mock.calls[0][0]
      .spanProcessors[0] as {
      onEnd: (span: {
        attributes: Record<string, string | number>;
        kind: number;
      }) => void;
      onStart: (span: {
        attributes: Record<string, string | number>;
        kind: number;
      }) => void;
    };
    const requestPath =
      '/application-list-entries?applicantSurname=SyntheticApplicant&respondentPostcode=AB1%202CD&accountReference=SYNTHETIC-ACC-1';
    const attributes: Record<string, string | number> = {
      'http.target': requestPath,
      'http.url': `https://appreg-api.example.test${requestPath}`,
      'http.request.method': 'GET',
      'http.response.status_code': 200,
      'url.full': `https://appreg-api.example.test${requestPath}`,
      'url.query':
        'applicantSurname=SyntheticApplicant&respondentPostcode=AB1%202CD&accountReference=SYNTHETIC-ACC-1',
    };

    spanProcessor.onStart({ attributes, kind: 2 });
    spanProcessor.onEnd({ attributes, kind: 2 });

    expect(requestPath).toContain('SyntheticApplicant');
    expect(attributes).toEqual({
      'http.request.method': 'GET',
      'http.response.status_code': 200,
      'http.target': '/application-list-entries',
      'http.url': 'https://appreg-api.example.test/application-list-entries',
      'url.full': 'https://appreg-api.example.test/application-list-entries',
    });
    expect(JSON.stringify(attributes)).not.toContain('SyntheticApplicant');
    expect(JSON.stringify(attributes)).not.toContain('AB1%202CD');
    expect(JSON.stringify(attributes)).not.toContain('SYNTHETIC-ACC-1');
  });

  it('sanitizes relative dependency URLs and ignores spans without attributes', async () => {
    AppInsights.enable();

    const spanProcessor = setAzureMonitorOptions.mock.calls[0][0]
      .spanProcessors[0] as {
      forceFlush: () => Promise<void>;
      onEnd: (span: {
        attributes?: Record<string, string>;
        kind: number;
      }) => void;
      onStart: (span: {
        attributes?: Record<string, string>;
        kind: number;
      }) => void;
      shutdown: () => Promise<void>;
    };
    const attributes = {
      'http.target': '/standard-applicants?name=SyntheticApplicant',
      'http.url': '/standard-applicants?name=SyntheticApplicant',
    };

    const incomingAttributes = {
      'http.url': '/sso/login-callback?code=SyntheticCode',
    };

    spanProcessor.onStart({ kind: 2 });
    spanProcessor.onStart({ attributes, kind: 2 });
    spanProcessor.onEnd({ attributes, kind: 2 });
    spanProcessor.onStart({ attributes: incomingAttributes, kind: 1 });

    expect(attributes).toEqual({
      'http.target': '/standard-applicants',
      'http.url': '/standard-applicants',
      'url.full': '/standard-applicants',
    });
    expect(incomingAttributes).toEqual({
      'http.url': '/sso/login-callback?code=SyntheticCode',
    });
    await expect(spanProcessor.forceFlush()).resolves.toBeUndefined();
    await expect(spanProcessor.shutdown()).resolves.toBeUndefined();
  });

  it('exposes the configured SDK and telemetry client', () => {
    expect(AppInsights.sdk()).toEqual(
      expect.objectContaining({ defaultClient, setup }),
    );
    expect(AppInsights.client()).toBe(defaultClient);
  });

  it('initializes only once', () => {
    AppInsights.enable();
    AppInsights.enable();

    expect(setup).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
