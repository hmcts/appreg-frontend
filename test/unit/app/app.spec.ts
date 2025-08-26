import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { Subscription } from 'rxjs';

import { App } from '../../../src/app/app';

@Component({ standalone: true, template: '' })
class DummyCmp {}

describe('App (browser platform)', () => {
  let fixture: ComponentFixture<App>;
  let component: App;
  let router: Router;

  // Make requestAnimationFrame immediate for deterministic assertions
  const originalRAF = globalThis.requestAnimationFrame;
  beforeAll(() => {
    (
      globalThis as unknown as {
        requestAnimationFrame: (cb: FrameRequestCallback) => number;
      }
    ).requestAnimationFrame = (cb) => {
      cb(0);
      return 0;
    };
  });
  afterAll(() => {
    if (originalRAF) {
      (
        globalThis as unknown as {
          requestAnimationFrame: (cb: FrameRequestCallback) => number;
        }
      ).requestAnimationFrame = originalRAF;
    }
  });

  beforeEach(async () => {
    // ensure clean body classes each test
    document.body.className = '';

    await TestBed.configureTestingModule({
      imports: [
        // Standalone component goes in imports
        App,
        RouterTestingModule.withRoutes([
          { path: '', component: DummyCmp },
          { path: 'foo', component: DummyCmp },
        ]),
        DummyCmp,
      ],
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    })
      // keep template minimal to avoid extra dependencies
      .overrideComponent(App, {
        set: { template: '<main class="govuk-main-wrapper"></main>' },
      })
      .compileComponents();

    router = TestBed.inject(Router);

    // Create the component *before* detectChanges so we can spy on the private method
    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('ngOnInit adds body classes (js-enabled, and govuk-frontend-supported when supported)', () => {
    // Simulate `'noModule' in HTMLScriptElement.prototype` being true
    let addedNoModule = false;
    if (!('noModule' in HTMLScriptElement.prototype)) {
      Object.defineProperty(HTMLScriptElement.prototype, 'noModule', {
        configurable: true,
        get() {
          return true;
        },
      });
      addedNoModule = true;
    }

    // Trigger lifecycle (OnInit + AfterViewInit)
    // but first, stub init method so it doesn't try to import anything
    const initSpy = jest
      .spyOn(
        component as unknown as {
          initGovUkFrontend: (scope?: HTMLElement) => Promise<void>;
        },
        'initGovUkFrontend',
      )
      .mockResolvedValue();

    fixture.detectChanges();

    expect(document.body.classList.contains('js-enabled')).toBe(true);
    // With `noModule` present, we expect the extra class:
    expect(document.body.classList.contains('govuk-frontend-supported')).toBe(
      true,
    );

    initSpy.mockRestore();

    // Clean up noModule if we added it
    if (addedNoModule) {
      delete (HTMLScriptElement.prototype as unknown as { noModule?: unknown })
        .noModule;
    }
  });

  it('ngAfterViewInit calls initGovUkFrontend once globally, then on NavigationEnd with the <main> scope', async () => {
    const initSpy = jest
      .spyOn(
        component as unknown as {
          initGovUkFrontend: (scope?: HTMLElement) => Promise<void>;
        },
        'initGovUkFrontend',
      )
      .mockResolvedValue();

    // Initial CD: should call once with undefined (global init)
    fixture.detectChanges();
    expect(initSpy).toHaveBeenCalledTimes(1);
    expect(initSpy.mock.calls[0]).toHaveLength(0);

    // Navigate to trigger NavigationEnd -> requestAnimationFrame -> scoped init
    await router.navigateByUrl('/foo');

    // main element used by the component’s querySelector
    const mainEl = document.querySelector('main.govuk-main-wrapper');
    expect(mainEl).not.toBeNull();

    // Should have been called again with the main element as scope
    expect(initSpy).toHaveBeenCalledTimes(2);
    expect(initSpy).toHaveBeenLastCalledWith(mainEl!);

    initSpy.mockRestore();
  });

  it('ngOnDestroy unsubscribes the navigation subscription', () => {
    // Spy on Subscription.prototype.unsubscribe before it’s created
    const unsubSpy = jest.spyOn(Subscription.prototype, 'unsubscribe');

    // Trigger lifecycle to create the nav subscription, then destroy
    const initSpy = jest
      .spyOn(
        component as unknown as {
          initGovUkFrontend: (scope?: HTMLElement) => Promise<void>;
        },
        'initGovUkFrontend',
      )
      .mockResolvedValue();
    fixture.detectChanges();

    fixture.destroy(); // calls ngOnDestroy
    expect(unsubSpy).toHaveBeenCalled();

    initSpy.mockRestore();
    unsubSpy.mockRestore();
  });
});

describe('App (server platform)', () => {
  let fixture: ComponentFixture<App>;
  let component: App;

  beforeEach(async () => {
    // ensure clean body classes each test
    document.body.className = '';

    await TestBed.configureTestingModule({
      imports: [App, RouterTestingModule.withRoutes([])],
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    })
      .overrideComponent(App, {
        set: { template: '' },
      })
      .compileComponents();

    fixture = TestBed.createComponent(App);
    component = fixture.componentInstance;
  });

  it('ngOnInit does nothing to body classes on non-browser', () => {
    const initSpy = jest
      .spyOn(
        component as unknown as {
          initGovUkFrontend: (scope?: HTMLElement) => Promise<void>;
        },
        'initGovUkFrontend',
      )
      .mockResolvedValue();

    fixture.detectChanges();

    expect(document.body.classList.contains('js-enabled')).toBe(false);
    expect(document.body.classList.contains('govuk-frontend-supported')).toBe(
      false,
    );

    // AfterViewInit should early-return too; no init calls
    expect(initSpy).not.toHaveBeenCalled();
    initSpy.mockRestore();
  });

  type GovUkInitAll = (opts: { scope?: HTMLElement }) => void;
  type G = typeof globalThis & { GOVUKFrontend?: { initAll?: GovUkInitAll } };
  const GBL = globalThis as G; // local, typed reference

  it('initGovUkFrontend uses npm module when available', async () => {
    jest.resetModules();
    const initAllMock: jest.Mock<void, [{ scope?: HTMLElement }]> = jest.fn();

    jest.doMock('govuk-frontend', () => ({ initAll: initAllMock }), {
      virtual: true,
    });

    const globalInit: jest.Mock<void, [{ scope?: HTMLElement }]> = jest.fn();
    GBL.GOVUKFrontend = { initAll: globalInit };

    const scope = document.createElement('main');
    await (
      component as unknown as {
        initGovUkFrontend(scope?: HTMLElement): Promise<void>;
      }
    ).initGovUkFrontend(scope);

    expect(initAllMock).toHaveBeenCalledWith({ scope });
    expect(globalInit).not.toHaveBeenCalled();

    jest.dontMock('govuk-frontend');
    delete GBL.GOVUKFrontend;
  });

  it('initGovUkFrontend falls back to global initAll when module missing or throws', async () => {
    jest.resetModules();
    // Case A: module present but no initAll
    jest.doMock('govuk-frontend', () => ({}), { virtual: true });

    const globalInit: jest.Mock<void, [{ scope?: HTMLElement }]> = jest.fn();
    GBL.GOVUKFrontend = { initAll: globalInit };

    const scopeA = document.createElement('main');
    await (
      component as unknown as {
        initGovUkFrontend(scope?: HTMLElement): Promise<void>;
      }
    ).initGovUkFrontend(scopeA);
    expect(globalInit).toHaveBeenLastCalledWith({ scope: scopeA });

    // Case B: import throws
    jest.resetModules();
    jest.doMock(
      'govuk-frontend',
      () => {
        throw new Error('boom');
      },
      { virtual: true },
    );

    const scopeB = document.createElement('main');
    await (
      component as unknown as {
        initGovUkFrontend(scope?: HTMLElement): Promise<void>;
      }
    ).initGovUkFrontend(scopeB);
    expect(globalInit).toHaveBeenLastCalledWith({ scope: scopeB });

    jest.dontMock('govuk-frontend');
    delete GBL.GOVUKFrontend;
  });
});
