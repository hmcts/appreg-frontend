import {
  focusLocalBanner,
  focusSuccessBanner,
} from '@components/applications-list-entry-detail/util/banners.util';

const BROWSER_PLATFORM_ID = 'browser' as unknown as object;
const SERVER_PLATFORM_ID = 'server' as unknown as object;

describe('focusSuccessBanner', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('does nothing on the server platform', () => {
    jest.useFakeTimers();
    const querySelectorSpy = jest.spyOn(document, 'querySelector');

    focusSuccessBanner(SERVER_PLATFORM_ID);
    jest.runOnlyPendingTimers();

    expect(querySelectorSpy).not.toHaveBeenCalled();
  });

  it('focuses and scrolls the success banner on the browser platform', () => {
    jest.useFakeTimers();
    const host = document.createElement('app-success-banner');
    const banner = document.createElement('div');
    banner.tabIndex = -1;
    host.appendChild(banner);
    const focusSpy = jest.spyOn(banner, 'focus');
    const scrollIntoView = jest.fn<
      void,
      Parameters<HTMLElement['scrollIntoView']>
    >();
    banner.scrollIntoView = scrollIntoView;
    document.body.appendChild(host);

    focusSuccessBanner(BROWSER_PLATFORM_ID);
    expect(focusSpy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(document.activeElement).toBe(banner);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
    });
  });

  it('does not throw on the browser platform when the banner is absent', () => {
    jest.useFakeTimers();

    focusSuccessBanner(BROWSER_PLATFORM_ID);

    expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  });
});

describe('focusLocalBanner', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('does nothing on the server platform', () => {
    jest.useFakeTimers();
    const querySelectorSpy = jest.spyOn(document, 'querySelector');

    focusLocalBanner(SERVER_PLATFORM_ID);
    jest.runOnlyPendingTimers();

    expect(querySelectorSpy).not.toHaveBeenCalled();
  });

  it('focuses and scrolls the local banner on the browser platform', () => {
    jest.useFakeTimers();
    const banner = document.createElement('app-alert');
    banner.id = 'results-local-banner';
    banner.tabIndex = -1;
    const focusSpy = jest.spyOn(banner, 'focus');
    const scrollIntoView = jest.fn<
      void,
      Parameters<HTMLElement['scrollIntoView']>
    >();
    banner.scrollIntoView = scrollIntoView;
    document.body.appendChild(banner);

    focusLocalBanner(BROWSER_PLATFORM_ID, '#results-local-banner');
    expect(focusSpy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    expect(document.activeElement).toBe(banner);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('does not focus or scroll when the caller reports that the user has moved on', () => {
    jest.useFakeTimers();
    const banner = document.createElement('app-alert');
    banner.tabIndex = -1;
    const focusSpy = jest.spyOn(banner, 'focus');
    const scrollSpy = jest.fn();
    banner.scrollIntoView = scrollSpy;
    document.body.appendChild(banner);
    focusLocalBanner(BROWSER_PLATFORM_ID, 'app-alert', () => false);
    jest.runOnlyPendingTimers();
    expect(focusSpy).not.toHaveBeenCalled();
    expect(scrollSpy).not.toHaveBeenCalled();
  });

  it('uses app-alert as the default selector when no banner id is provided', () => {
    jest.useFakeTimers();
    const banner = document.createElement('app-alert');
    const focusSpy = jest.spyOn(banner, 'focus');
    const scrollIntoView = jest.fn<
      void,
      Parameters<HTMLElement['scrollIntoView']>
    >();
    banner.scrollIntoView = scrollIntoView;
    document.body.appendChild(banner);

    focusLocalBanner(BROWSER_PLATFORM_ID);
    jest.runOnlyPendingTimers();

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
  });

  it('does not throw on the browser platform when the local banner is absent', () => {
    jest.useFakeTimers();

    focusLocalBanner(BROWSER_PLATFORM_ID);

    expect(() => jest.runOnlyPendingTimers()).not.toThrow();
  });
});
