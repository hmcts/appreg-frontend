import { AppInsights } from '../../../../src/modules/appinsights';

type MockConfig = {
  has: jest.Mock<boolean, [string]>;
  get: jest.Mock<string, [string]>;
};

jest.mock('config', () => {
  const cfg: MockConfig = {
    has: jest.fn(),
    get: jest.fn(),
  };
  return { __esModule: true, default: cfg };
});

// Mock that works whether the code reads `ai.setup` or `ai.default.setup`
jest.mock('applicationinsights', () => {
  const start = jest.fn();
  const api = { setup: jest.fn().mockReturnValue({ start }) };
  return { __esModule: true, ...api, default: api };
});

// Helpers to access typed mocks
const getConfigMock = (): MockConfig => jest.requireMock('config').default;

const getAiMock = () => jest.requireMock('applicationinsights');

describe('AppInsights.enable', () => {
  const KEY = 'app-insights-connection-string';

  afterEach(() => jest.resetAllMocks());

  it('initializes application insights when the key is present and non-empty', async () => {
    const config = getConfigMock();
    const ai = getAiMock();

    const connStr = 'InstrumentationKey=abc';
    config.has.mockReturnValue(true);
    config.get.mockReturnValue(connStr);

    const svc = new AppInsights();
    await svc.enable();

    // Either top-level or default.setup should have been called (both are the same mock)
    expect(ai.setup).toHaveBeenCalledWith(connStr);

    const startMock = ai.setup.mock.results[0]?.value.start as jest.Mock;
    expect(startMock).toHaveBeenCalledTimes(1);
  });

  it('does nothing when key missing', async () => {
    const config = getConfigMock();
    const ai = getAiMock();

    config.has.mockReturnValue(false);

    const svc = new AppInsights();
    await svc.enable();

    expect(config.has).toHaveBeenCalledWith(KEY);
    expect(ai.setup).not.toHaveBeenCalled();
  });

  it('does nothing when key empty', async () => {
    const config = getConfigMock();
    const ai = getAiMock();

    config.has.mockReturnValue(true);
    config.get.mockReturnValue('');

    const svc = new AppInsights();
    await svc.enable();

    expect(config.get).toHaveBeenCalledWith(KEY);
    expect(ai.setup).not.toHaveBeenCalled();
  });
});
