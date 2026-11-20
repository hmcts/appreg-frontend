import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

// Runtime loading keeps Cypress globals out of the Jest TypeScript project.
const { MicrosoftAuthHelper } = jest.requireActual<{
  MicrosoftAuthHelper: {
    performLogin(email: string, password: string): void;
    performSignOut(): void;
  };
}>('../../../cypress/support/helper/auth/MicrosoftAuthHelper');

describe('Microsoft login screenshot readiness', () => {
  const originalCy = Object.getOwnPropertyDescriptor(globalThis, 'cy');
  let origin: string;
  let selector: string;
  let unavailable: string;
  let events: string[];
  let readingValue: boolean;
  let typedValue: string;
  let staleValue: boolean;
  let staySignedInPrompt: boolean;
  const chain = {
    clear: () => chain,
    type: (value: string) => {
      typedValue = value;
      return chain;
    },
    filter: () => chain,
    first: () => chain,
    scrollIntoView: () => chain,
    contains: () => chain,
    click: () => chain,
    invoke: () => {
      readingValue = true;
      return chain;
    },
    then: (callback: (subject: unknown) => void) => {
      const subject = readingValue
        ? staleValue
          ? ''
          : typedValue
        : {
            text: () => (staySignedInPrompt ? 'Stay signed in' : ''),
            val: () => 'No',
          };
      if (readingValue) {
        staleValue = false;
      }
      readingValue = false;
      callback(subject);
      return chain;
    },
    should: (matcher: unknown) => {
      if (matcher === 'be.visible') {
        if (unavailable && selector.includes(unavailable)) {
          throw new Error('Page readiness timed out');
        }
        events.push(`visible:${origin}:${selector}`);
      }
      return chain;
    },
  };

  beforeEach(() => {
    origin = 'app';
    selector = '';
    unavailable = '';
    events = [];
    readingValue = false;
    typedValue = '';
    staleValue = false;
    staySignedInPrompt = true;
    Object.defineProperty(globalThis, 'cy', {
      configurable: true,
      value: {
        origin: (
          host: string,
          options: { args: object },
          run: (args: object) => void,
        ) => {
          origin = host;
          run(options.args);
          origin = 'app';
        },
        get: (value: string) => {
          selector = value;
          return chain;
        },
        wrap: () => chain,
        screenshot: (name: string) =>
          events.push(`screenshot:${origin}:${name}`),
        log: () => undefined,
        location: () => chain,
        url: () => chain,
      },
    });
  });

  afterAll(() => {
    if (originalCy) {
      Object.defineProperty(globalThis, 'cy', originalCy);
    } else {
      Reflect.deleteProperty(globalThis, 'cy');
    }
  });

  it('captures the Microsoft page only after the login input is visible in that origin', () => {
    MicrosoftAuthHelper.performLogin('', '');
    const screenshot = events.indexOf(
      'screenshot:https://login.microsoftonline.com:03-Microsoft-Login-Page',
    );
    expect(screenshot).toBeGreaterThan(0);
    expect(events[screenshot - 1]).toContain(
      'visible:https://login.microsoftonline.com:input[name="loginfmt"]',
    );
    const returned = events.indexOf('screenshot:app:04-After-Microsoft-Auth');
    expect(returned).toBeGreaterThan(screenshot);
    expect(events[returned - 1]).toContain(
      'visible:app:.govuk-service-navigation__item',
    );
  });

  it.each(['loginfmt', 'govuk-service-navigation'])(
    'fails readiness instead of capturing an unready page: %s',
    (missing) => {
      unavailable = missing;
      expect(() => MicrosoftAuthHelper.performLogin('', '')).toThrow(
        'Page readiness timed out',
      );
      const screenshot =
        missing === 'loginfmt'
          ? '03-Microsoft-Login-Page'
          : '04-After-Microsoft-Auth';
      expect(events.some((event) => event.endsWith(screenshot))).toBe(false);
    },
  );
  it('retypes a stale Microsoft input value before continuing', () => {
    staleValue = true;
    MicrosoftAuthHelper.performLogin('synthetic@example.test', 'test-password');

    expect(events).toContain('screenshot:app:04-After-Microsoft-Auth');
  });

  it('continues when Microsoft omits the stay-signed-in prompt', () => {
    staySignedInPrompt = false;
    MicrosoftAuthHelper.performLogin('', '');

    expect(events).toContain('screenshot:app:04-After-Microsoft-Auth');
  });
});

describe('Microsoft logout screenshot readiness', () => {
  const appOrigin = 'https://appreg.example.test';
  const originalCy = Object.getOwnPropertyDescriptor(globalThis, 'cy');
  let location: { origin: string; pathname: string };
  let loginVisible: boolean;
  let loginButton: boolean;
  let pickerVisible: boolean;
  let events: string[];
  let chain: Record<string, unknown>;

  beforeEach(() => {
    location = { origin: appOrigin, pathname: '/login' };
    loginVisible = true;
    loginButton = false;
    pickerVisible = true;
    events = [];
    chain = {
      contains: () => chain,
      click: () => {
        events.push('click');
        return chain;
      },
      should: (matcher: string) => {
        if (matcher === 'be.visible' && !loginButton && !pickerVisible) {
          throw new Error('Account picker not visible');
        }
        if (matcher === 'be.visible' && loginButton && !loginVisible) {
          throw new Error('Login content not visible');
        }
        events.push('visible');
        return chain;
      },
    };
    Object.defineProperty(globalThis, 'cy', {
      configurable: true,
      value: {
        get: (selector: string) => {
          events.push(`get:${selector}`);
          return chain;
        },
        contains: (selector: string, text: string) => {
          loginButton = true;
          events.push(`content:${selector}:${text}`);
          return chain;
        },
        log: () => undefined,
        origin: (_host: string, callback: () => void) => callback(),
        location: (query: 'origin' | 'pathname') => ({
          then: (callback: (origin: string) => void) => {
            events.push('capture-origin');
            callback(appOrigin);
          },
          should: (_matcher: string, expected: string) => {
            expect(location[query]).toBe(expected);
            events.push(`location:${query}`);
          },
        }),
      },
    });
  });

  afterAll(() => {
    if (originalCy) {
      Object.defineProperty(globalThis, 'cy', originalCy);
    } else {
      Reflect.deleteProperty(globalThis, 'cy');
    }
  });

  it('waits for the account picker, app login location and visible login button', () => {
    MicrosoftAuthHelper.performSignOut();

    expect(events[0]).toBe('capture-origin');
    expect(events.filter((event) => event === 'click')).toHaveLength(2);
    const pickerIndex = events.indexOf('get:.table-cell.tile-img > .tile-img');
    expect(pickerIndex).toBeGreaterThan(-1);
    expect(events.slice(pickerIndex + 1, pickerIndex + 3)).toEqual([
      'visible',
      'click',
    ]);
    expect(events.slice(-4)).toEqual([
      'location:origin',
      'location:pathname',
      'content:button:Sign in with your Justice SSO account',
      'visible',
    ]);
  });

  it('does not skip a Microsoft account picker that is not yet rendered', () => {
    pickerVisible = false;

    expect(() => MicrosoftAuthHelper.performSignOut()).toThrow(
      'Account picker not visible',
    );
    expect(events.filter((event) => event === 'click')).toHaveLength(1);
  });

  it.each([
    { origin: 'https://login.microsoftonline.com', pathname: '/login' },
    { origin: 'https://other.example.test', pathname: '/login' },
    { origin: appOrigin, pathname: '/login/pending' },
    { origin: appOrigin, pathname: '/applications-list' },
  ])('rejects an unfinished logout at %j', (pendingLocation) => {
    location = pendingLocation;

    expect(() => MicrosoftAuthHelper.performSignOut()).toThrow();
    expect(events.some((event) => event.startsWith('content:'))).toBe(false);
  });

  it('does not finish while the app login content is unready', () => {
    loginVisible = false;

    expect(() => MicrosoftAuthHelper.performSignOut()).toThrow(
      'Login content not visible',
    );
  });
});
