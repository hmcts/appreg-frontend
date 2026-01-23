import { HeaderService } from '@services/header.service';

describe('HeaderService', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('starts visible', () => {
    const service = new HeaderService();
    expect(service.isVisible()).toBe(true);
  });

  it('hideNavigation sets isVisible to false after timers run', () => {
    const service = new HeaderService();

    service.hideNavigation();

    // not yet (async)
    expect(service.isVisible()).toBe(true);

    jest.runOnlyPendingTimers();

    expect(service.isVisible()).toBe(false);
  });

  it('showNavigation sets isVisible to true after timers run', () => {
    const service = new HeaderService();

    // put it into hidden state first
    service.hideNavigation();
    jest.runOnlyPendingTimers();
    expect(service.isVisible()).toBe(false);

    service.showNavigation();

    // still false until timer flush
    expect(service.isVisible()).toBe(false);

    jest.runOnlyPendingTimers();

    expect(service.isVisible()).toBe(true);
  });

  it('last call wins when hide then show are scheduled', () => {
    const service = new HeaderService();

    service.hideNavigation();
    service.showNavigation();

    jest.runOnlyPendingTimers();

    expect(service.isVisible()).toBe(true);
  });

  it('last call wins when show then hide are scheduled', () => {
    const service = new HeaderService();

    service.showNavigation();
    service.hideNavigation();

    jest.runOnlyPendingTimers();

    expect(service.isVisible()).toBe(false);
  });
});
