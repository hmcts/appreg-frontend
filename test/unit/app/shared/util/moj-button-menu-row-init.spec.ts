import { TestBed } from '@angular/core/testing';

import { TelemetryService } from '@services/telemetry.service';
import { MojButtonMenu } from '@util/moj-button-menu';

jest.mock('@ministryofjustice/frontend', () => ({
  ButtonMenu: class {
    constructor(private readonly element: HTMLElement) {
      if (this.element.id === 'bad') {
        throw new TypeError('Menu failed to initialise');
      }
      if (this.element.id === 'bad-value') {
        // Simulate a third-party constructor throwing a non-Error at runtime.
        throw 42 as unknown as Error;
      }
      this.element.setAttribute('data-tested', 'true');
    }

    init(): void {
      if (this.element.id === 'bad-init') {
        throw new RangeError('Menu init failed');
      }
    }
  },
}));

describe('MojButtonMenu row initialisation', () => {
  it('logs one row failure and continues initialising later rows', async () => {
    const logException = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        MojButtonMenu,
        { provide: TelemetryService, useValue: { logException } },
      ],
    });

    const menus = TestBed.inject(MojButtonMenu);
    const root = document.createElement('div');
    root.innerHTML = [
      '<div id="bad" data-module="moj-button-menu"></div>',
      '<div id="good-1" data-module="moj-button-menu"></div>',
      '<div id="good-2" data-module="moj-button-menu"></div>',
    ].join('');

    await menus.initAll(root);
    await menus.initAll(root);

    expect(root.querySelector('#bad')?.hasAttribute('data-tested')).toBe(false);
    expect(root.querySelector('#good-1')?.hasAttribute('data-tested')).toBe(
      true,
    );
    expect(root.querySelector('#good-2')?.hasAttribute('data-tested')).toBe(
      true,
    );
    expect(logException).toHaveBeenCalledTimes(1);
    expect(logException).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'TypeError',
        message: 'Menu failed to initialise',
      }),
      { component: 'MojButtonMenu', phase: 'init' },
    );
  });

  it('uses a generic error when the constructor throws a non-Error value', async () => {
    const logException = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        MojButtonMenu,
        { provide: TelemetryService, useValue: { logException } },
      ],
    });

    const root = document.createElement('div');
    root.innerHTML = '<div id="bad-value" data-module="moj-button-menu"></div>';

    await TestBed.inject(MojButtonMenu).initAll(root);

    expect(logException).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Failed to initialise MOJ button menu',
      }),
      { component: 'MojButtonMenu', phase: 'init' },
    );
  });

  it('preserves an error thrown by init()', async () => {
    const logException = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        MojButtonMenu,
        { provide: TelemetryService, useValue: { logException } },
      ],
    });

    const root = document.createElement('div');
    root.innerHTML = '<div id="bad-init" data-module="moj-button-menu"></div>';

    await TestBed.inject(MojButtonMenu).initAll(root);

    expect(logException).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'RangeError',
        message: 'Menu init failed',
      }),
      { component: 'MojButtonMenu', phase: 'init' },
    );
  });

  it('continues to later rows when telemetry fails', async () => {
    TestBed.configureTestingModule({
      providers: [
        MojButtonMenu,
        {
          provide: TelemetryService,
          useValue: {
            logException: () => {
              throw new Error('Telemetry unavailable');
            },
          },
        },
      ],
    });

    const root = document.createElement('div');
    root.innerHTML = [
      '<div id="bad" data-module="moj-button-menu"></div>',
      '<div id="good" data-module="moj-button-menu"></div>',
    ].join('');

    await expect(
      TestBed.inject(MojButtonMenu).initAll(root),
    ).resolves.toBeUndefined();
    expect(root.querySelector('#good')?.hasAttribute('data-tested')).toBe(true);
  });
});
