import { TestBed } from '@angular/core/testing';

import { TelemetryService } from '@services/telemetry.service';
import { recoverFromModuleLoadError } from '@util/global-module-load-error-listener';
import { MojButtonMenu } from '@util/moj-button-menu';

jest.mock('@util/global-module-load-error-listener', () => ({
  recoverFromModuleLoadError: jest.fn(),
}));

jest.mock('@ministryofjustice/frontend', () => {
  throw new Error('MOJ module unavailable');
});

describe('MojButtonMenu', () => {
  it('reports a failed module import once while leaving menus uninitialised', async () => {
    const logException = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        MojButtonMenu,
        { provide: TelemetryService, useValue: { logException } },
      ],
    });

    const menus = TestBed.inject(MojButtonMenu);
    const root = document.createElement('div');
    root.innerHTML =
      '<div data-module="moj-button-menu"><button>Open</button><button>Delete</button></div>';

    await menus.initAll(root);
    await menus.initAll(root);

    expect(logException).toHaveBeenCalledTimes(1);
    expect(logException).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'MOJ module unavailable' }),
      { component: 'MojButtonMenu', phase: 'load' },
    );
    expect(recoverFromModuleLoadError).toHaveBeenCalledTimes(1);
    expect(root.querySelector('.moj-button-menu__toggle-button')).toBeNull();
    expect(root.querySelectorAll('button')).toHaveLength(2);
  });

  it('still requests recovery when telemetry fails', async () => {
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

    await expect(
      TestBed.inject(MojButtonMenu).initAll(document),
    ).resolves.toBeUndefined();
    expect(recoverFromModuleLoadError).toHaveBeenCalled();
  });
});
