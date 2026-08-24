const setup = jest.fn();
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
  setAutoCollectRequests,
  setAutoCollectConsole,
  setAutoCollectDependencies,
  setAutoCollectExceptions,
  setSendLiveMetrics,
  start,
};

setup.mockReturnValue(mockSdkChain);
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
    expect(setAutoCollectRequests).toHaveBeenCalledWith(false);
    expect(setAutoCollectConsole).toHaveBeenCalledWith(true, true);
    expect(setAutoCollectDependencies).toHaveBeenCalledWith(true);
    expect(setAutoCollectExceptions).toHaveBeenCalledWith(true);
    expect(setSendLiveMetrics).toHaveBeenCalledWith(true);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('initializes only once', () => {
    AppInsights.enable();
    AppInsights.enable();

    expect(setup).toHaveBeenCalledTimes(1);
    expect(start).toHaveBeenCalledTimes(1);
  });
});
