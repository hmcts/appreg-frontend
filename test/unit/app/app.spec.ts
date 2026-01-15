import { PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { App } from '../../../src/app/app';

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

/* ---------------------- Mocks ---------------------- */
const { SortableTable: mojFrontendCtor } = jest.requireMock(
  '@ministryofjustice/frontend',
);
const { initAll: govukInitAll } = jest.requireMock('govuk-frontend');

/* requestAnimationFrame: make it immediate and typed */
let rafSpy: jest.SpyInstance<number, [FrameRequestCallback]>;
beforeAll(() => {
  rafSpy = jest.spyOn(window, 'requestAnimationFrame');
  rafSpy.mockImplementation((cb: FrameRequestCallback): number => {
    cb(0);
    return 1;
  });
});
afterAll(() => {
  rafSpy.mockRestore();
});

describe('App (root)', () => {
  let fixture: ComponentFixture<App>;
  let comp: App;

  async function create(
    platform: 'browser' | 'server' = 'browser',
    tpl = '<main class="govuk-main-wrapper"></main>',
  ) {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([]),
        { provide: PLATFORM_ID, useValue: platform },
      ],
    })
      .overrideComponent(App, { set: { template: tpl } })
      .compileComponents();

    fixture = TestBed.createComponent(App);
    comp = fixture.componentInstance;

    document.body.className = '';
    document.body.innerHTML = '';
    mojFrontendCtor.mockClear();
    govukInitAll.mockClear();
  }

  it('creates the component', async () => {
    await create('browser');
    fixture.detectChanges();
    expect(comp).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('adds js-enabled and govuk-frontend-supported when noModule exists', async () => {
      await create('browser');
      Object.defineProperty(HTMLScriptElement.prototype, 'noModule', {
        value: true,
        configurable: true,
      });

      comp.ngOnInit();
      expect(document.body.classList.contains('js-enabled')).toBe(true);
      expect(document.body.classList.contains('govuk-frontend-supported')).toBe(
        true,
      );
    });

    it('adds only js-enabled when noModule is absent', async () => {
      await create('browser');
      // Ensure property absent (ok in tests)
      delete (
        HTMLScriptElement.prototype as unknown as Record<string, unknown>
      )['noModule'];

      comp.ngOnInit();
      expect(document.body.classList.contains('js-enabled')).toBe(true);
      expect(document.body.classList.contains('govuk-frontend-supported')).toBe(
        false,
      );
    });
  });

  describe('ngAfterViewInit', () => {
    it('does nothing on the server', async () => {
      await create('server');
      fixture.detectChanges();
      await nextTick();
      expect(govukInitAll).not.toHaveBeenCalled();
      expect(mojFrontendCtor).not.toHaveBeenCalled();
    });

    it('initialises GOV.UK and enhances all existing sortable tables (browser)', async () => {
      await create('browser');

      const t1 = document.createElement('table');
      t1.setAttribute('data-module', 'moj-sortable-table');
      const t2 = document.createElement('table');
      t2.setAttribute('data-module', 'moj-sortable-table');
      document.body.append(t1, t2);

      fixture.detectChanges(); // triggers ngAfterViewInit (dynamic import queued)
      await nextTick(); // allow promise callback to run

      expect(govukInitAll).toHaveBeenCalledTimes(1);
      expect(mojFrontendCtor).toHaveBeenCalledTimes(2);
      expect(mojFrontendCtor).toHaveBeenCalledWith(t1);
      expect(mojFrontendCtor).toHaveBeenCalledWith(t2);
    });

    it('enhances sortable tables added later via MutationObserver', async () => {
      await create('browser');

      fixture.detectChanges();
      await nextTick();

      const t3 = document.createElement('table');
      t3.setAttribute('data-module', 'moj-sortable-table');
      document.body.append(t3);

      await nextTick();
      expect(mojFrontendCtor).toHaveBeenCalledTimes(1);
      expect(mojFrontendCtor).toHaveBeenCalledWith(t3);
    });
  });

  it('falls back to global GOV.UK Frontend if module has no initAll', async () => {
    await create('browser');

    // Recreate the module graph for this test and provide a mock with no initAll
    jest.resetModules();
    jest.doMock('govuk-frontend', () => ({}), { virtual: true });

    const globalInit = jest.fn();
    (
      globalThis as unknown as { GOVUKFrontend: { initAll: typeof globalInit } }
    ).GOVUKFrontend = {
      initAll: globalInit,
    };

    // call the private method; the dynamic import will now see the remocked module
    await (
      comp as unknown as {
        initGovUkFrontend(scope?: HTMLElement): Promise<void>;
      }
    ).initGovUkFrontend(document.body);

    expect(globalInit).toHaveBeenCalledWith({ scope: document.body });

    // (optional) restore your default mock for subsequent tests
    jest.dontMock('govuk-frontend');
  });
});
