import {
  computeSuccessBanner,
  focusLocalBanner,
  focusSuccessBanner,
} from '@components/applications-list-entry-detail/util/banners.util';
import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';

const BROWSER_PLATFORM_ID = 'browser' as unknown as object;
const SERVER_PLATFORM_ID = 'server' as unknown as object;

describe('computeSuccessBanner', () => {
  it('returns the wording-required banner when the wording reference regex matches', () => {
    const banner = computeSuccessBanner(
      'Result requires [wording] before submission',
      /\[wording\]/,
    );

    expect(banner).toBe(
      ENTRY_SUCCESS_MESSAGES.applicationCodeAdded.needsWording,
    );
  });

  it('returns the standard banner when the wording reference regex does not match', () => {
    const banner = computeSuccessBanner(
      'Result wording is already complete',
      /\[wording\]/,
    );

    expect(banner).toBe(ENTRY_SUCCESS_MESSAGES.applicationCodeAdded.ok);
  });
});

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
    const banner = document.createElement('app-success-banner');
    const focusSpy = jest.spyOn(banner, 'focus');
    const scrollIntoView = jest.fn<
      void,
      Parameters<HTMLElement['scrollIntoView']>
    >();
    banner.scrollIntoView = scrollIntoView;
    document.body.appendChild(banner);

    focusSuccessBanner(BROWSER_PLATFORM_ID);
    expect(focusSpy).not.toHaveBeenCalled();

    jest.runOnlyPendingTimers();

    expect(focusSpy).toHaveBeenCalledTimes(1);
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

    expect(focusSpy).toHaveBeenCalledTimes(1);
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    });
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
