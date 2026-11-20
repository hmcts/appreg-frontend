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
  MicrosoftAuthHelper: { performLogin(email: string, password: string): void };
}>('../../../cypress/support/helper/auth/MicrosoftAuthHelper');

describe('Microsoft login screenshot readiness', () => {
  const originalCy = Object.getOwnPropertyDescriptor(globalThis, 'cy');
  let origin: string;
  let selector: string;
  let unavailable: string;
  let events: string[];
  const chain = {
    filter: () => chain,
    first: () => chain,
    scrollIntoView: () => chain,
    contains: () => chain,
    click: () => chain,
    then: () => chain,
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
});
