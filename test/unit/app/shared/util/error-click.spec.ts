import { isPlatformBrowser } from '@angular/common';

import {
  focusErrorSummary,
  focusField,
  onCreateErrorClick,
} from '@util/error-click';

jest.mock('@angular/common', () => ({
  isPlatformBrowser: jest.fn(),
}));

type TestErrorItem = { id?: string; text: string };

describe('error focus utils', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    jest.useFakeTimers();
    (isPlatformBrowser as jest.Mock).mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('onCreateErrorClick', () => {
    it('returns early when item.id/href is missing/empty', () => {
      const spy = jest.spyOn(document, 'getElementById');

      onCreateErrorClick({} as TestErrorItem);
      onCreateErrorClick({ id: '' } as TestErrorItem);
      onCreateErrorClick({ id: null } as unknown as TestErrorItem);
      onCreateErrorClick({ href: '' } as unknown as TestErrorItem);
      onCreateErrorClick({ href: '#' } as unknown as TestErrorItem);

      expect(spy).not.toHaveBeenCalled();
    });

    it('focuses when href contains a hash', () => {
      document.body.innerHTML = '<input id="x" />';
      const el = document.getElementById('x') as HTMLElement;

      const scrollSpy = jest.spyOn(el, 'scrollIntoView');
      const focusSpy = jest.spyOn(el, 'focus');

      onCreateErrorClick({ href: '#x' } as unknown as TestErrorItem);

      expect(scrollSpy).toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('focuses by id when id is provided (smooth scroll path)', () => {
      document.body.innerHTML = '<input id="x" />';
      const el = document.getElementById('x') as HTMLElement;

      // matches() true path (input)
      const scrollSpy = jest.spyOn(el, 'scrollIntoView');
      const focusSpy = jest.spyOn(el, 'focus');

      onCreateErrorClick({ id: 'x' } as TestErrorItem);

      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'center',
      });

      // focus happens after timeout
      expect(focusSpy).not.toHaveBeenCalled();
      jest.advanceTimersByTime(50);
      expect(focusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('falls back to legacy scrollIntoView signature when smooth options throw', () => {
      document.body.innerHTML = '<input id="y" />';
      const el = document.getElementById('y') as HTMLElement;

      const scrollMock = jest
        .spyOn(el, 'scrollIntoView')
        // first call throws (options object)
        .mockImplementationOnce(() => {
          throw new Error('no options supported');
        })
        // second call ok (boolean)
        .mockImplementationOnce(() => undefined);

      onCreateErrorClick({ id: 'y' } as TestErrorItem);

      expect(scrollMock).toHaveBeenCalledWith(true);

      jest.advanceTimersByTime(50);
    });
  });

  describe('focusField', () => {
    it('prevents default when event provided and focuses first focusable child when root is not itself focusable', () => {
      document.body.innerHTML = `
        <div id="root">
          <input id="child" />
        </div>
      `;
      const root = document.getElementById('root') as HTMLElement;
      const child = document.getElementById('child') as HTMLElement;

      const preventDefault = jest.fn();
      const ev = { preventDefault } as unknown as Event;

      // root does not match selector, so it should pick child
      const rootMatchesSpy = jest.spyOn(root, 'matches');
      const rootQuerySpy = jest.spyOn(root, 'querySelector');
      const childFocusSpy = jest.spyOn(child, 'focus');

      focusField('root', ev);

      expect(preventDefault).toHaveBeenCalled();
      expect(rootMatchesSpy).toHaveBeenCalled();
      expect(rootQuerySpy).toHaveBeenCalled();

      jest.advanceTimersByTime(50);
      expect(childFocusSpy).toHaveBeenCalledWith({ preventScroll: true });
    });

    it('returns when element id does not exist', () => {
      const preventDefault = jest.fn();
      const ev = { preventDefault } as unknown as Event;

      focusField('missing', ev);

      expect(preventDefault).toHaveBeenCalled();
      jest.runOnlyPendingTimers();
    });
  });

  describe('focusErrorSummary', () => {
    it('returns early when not running in browser', () => {
      (isPlatformBrowser as jest.Mock).mockReturnValue(false);

      const qSpy = jest.spyOn(document, 'querySelector');
      focusErrorSummary({});

      expect(qSpy).not.toHaveBeenCalled();
    });

    it('focuses and scrolls error summary when in browser and element exists', () => {
      (isPlatformBrowser as jest.Mock).mockReturnValue(true);

      document.body.innerHTML = `
        <div data-component="error-summary" tabindex="-1"></div>
      `;
      const el = document.querySelector(
        '[data-component="error-summary"]',
      ) as HTMLElement;

      const focusSpy = jest.spyOn(el, 'focus');
      const scrollSpy = jest.spyOn(el, 'scrollIntoView');

      focusErrorSummary({});

      // async via setTimeout(0)
      expect(focusSpy).not.toHaveBeenCalled();
      jest.advanceTimersByTime(0);

      expect(focusSpy).toHaveBeenCalled();
      expect(scrollSpy).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });

    it('does not throw when error summary element is missing (optional chaining paths)', () => {
      (isPlatformBrowser as jest.Mock).mockReturnValue(true);

      focusErrorSummary({});

      jest.advanceTimersByTime(0);
    });
  });
});
