import { readFileSync } from 'node:fs';

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

type SpanAttributes = Record<string, string | number>;

type SpanProcessor = {
  onEnd: (span: { attributes: SpanAttributes; kind: number }) => void;
  onStart: (span: { attributes: SpanAttributes; kind: number }) => void;
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

function expectFreeTextAbsent(captured: unknown, text: string): void {
  const serialised = JSON.stringify(captured);

  for (const marker of markersOf(text)) {
    expect(serialised).not.toContain(marker);
  }
}

describe('AppInsights', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getConfig.mockReturnValue('InstrumentationKey=abc123');
    (AppInsights as unknown as { started: boolean }).started = false;
  });

  it('registers the OpenTelemetry ESM loader before starting the production server', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>;
    };

    expect(packageJson.scripts['start']).toBe(
      'node --import @azure/monitor-opentelemetry/loader dist/appreg-frontend/server/server.mjs',
    );
  });

  it('enables automatic request collection while keeping the existing telemetry features', () => {
    AppInsights.enable();

    expect(getConfig).toHaveBeenCalledWith(
      'secrets.appreg.app-insights-connection-string-fe',
    );
    expect(setup).toHaveBeenCalledWith('InstrumentationKey=abc123');
    expect(setAzureMonitorOptions).toHaveBeenCalledTimes(1);
    expect(setAutoCollectRequests).toHaveBeenCalledWith(true);
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

  it('sanitizes relative incoming and dependency URLs and ignores spans without attributes', async () => {
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
      'http.url': '/sso/login-callback',
      'url.full': '/sso/login-callback',
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

  describe('AI free text', () => {
    it('adds no HTTP instrumentation hooks or header capture that could copy an AI request body into telemetry', () => {
      AppInsights.enable();

      // The default HTTP instrumentation records URLs, methods and statuses,
      // never request bodies; only the query-stripping processor is added.
      expect(setAzureMonitorOptions).toHaveBeenCalledWith({
        spanProcessors: [
          {
            forceFlush: expect.any(Function),
            onEnd: expect.any(Function),
            onStart: expect.any(Function),
            shutdown: expect.any(Function),
          },
        ],
      });
    });

    it.each(AI_FREE_TEXT)(
      'strips the $field from incoming and outgoing $path spans when it reaches the URL',
      ({ field, path, text }) => {
        AppInsights.enable();

        const spanProcessor = setAzureMonitorOptions.mock.calls[0][0]
          .spanProcessors[0] as SpanProcessor;
        const query = `${field}=${encodeURIComponent(text)}`;
        // Old and stable OpenTelemetry HTTP attribute names, as the HTTP
        // instrumentation sets them for the browser's POST to the Express proxy
        // (server span) and the proxy's POST to the API (client span).
        const incoming: SpanAttributes = {
          'http.method': 'POST',
          'http.request.method': 'POST',
          'http.status_code': 422,
          'http.target': `${path}?${query}`,
          'http.url': `https://appreg.example.test${path}?${query}`,
          'url.path': path,
          'url.query': query,
          'url.scheme': 'https',
        };
        const outgoing: SpanAttributes = {
          'http.method': 'POST',
          'http.request.method': 'POST',
          'http.response.status_code': 422,
          'http.target': `${path}?${query}`,
          'http.url': `https://appreg-api.example.test${path}?${query}`,
          'server.address': 'appreg-api.example.test',
          'url.full': `https://appreg-api.example.test${path}?${query}`,
        };
        expect(JSON.stringify([incoming, outgoing])).toContain(
          markersOf(text)[0],
        );

        for (const span of [
          { attributes: incoming, kind: 1 },
          { attributes: outgoing, kind: 2 },
        ]) {
          spanProcessor.onStart(span);
          spanProcessor.onEnd(span);
        }

        expect(incoming).toEqual({
          'http.method': 'POST',
          'http.request.method': 'POST',
          'http.status_code': 422,
          'http.target': path,
          'http.url': `https://appreg.example.test${path}`,
          'url.full': `https://appreg.example.test${path}`,
          'url.path': path,
          'url.scheme': 'https',
        });
        expect(outgoing).toEqual({
          'http.method': 'POST',
          'http.request.method': 'POST',
          'http.response.status_code': 422,
          'http.target': path,
          'http.url': `https://appreg-api.example.test${path}`,
          'server.address': 'appreg-api.example.test',
          'url.full': `https://appreg-api.example.test${path}`,
        });
        expectFreeTextAbsent([incoming, outgoing], text);
      },
    );
  });
});
