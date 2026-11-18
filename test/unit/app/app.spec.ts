import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { App } from '../../../src/app/app';
import { FooterComponent } from '../../../src/app/core/components/footer/footer.component';
import { HeaderComponent } from '../../../src/app/core/components/header/header.component';
import { ServiceNavigationComponent } from '../../../src/app/shared/components/service-navigation/service-navigation.component';

const nextTick = () => new Promise<void>((r) => setTimeout(r, 0));

@Component({
  standalone: true,
  template: '',
})
class DummyRouteComponent {}

@Component({
  selector: 'app-header, app-service-navigation, app-footer',
  template: '',
})
class LayoutStub {}

/* ---------------------- Mocks ---------------------- */
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
        provideRouter([
          { path: '', component: DummyRouteComponent },
          { path: 'next', component: DummyRouteComponent },
        ]),
        { provide: PLATFORM_ID, useValue: platform },
      ],
    })
      .overrideComponent(App, { set: { template: tpl } })
      .compileComponents();

    fixture = TestBed.createComponent(App);
    comp = fixture.componentInstance;

    document.body.className = '';
    document.body.innerHTML = '';
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
    });

    it('initialises GOV.UK frontend on browser', async () => {
      await create('browser');

      fixture.detectChanges(); // triggers ngAfterViewInit (dynamic import queued)
      await nextTick(); // allow promise callback to run

      expect(govukInitAll).toHaveBeenCalledTimes(1);
    });

    it('can re-initialise GOV.UK frontend for scoped content', async () => {
      await create('browser');

      fixture.detectChanges();
      await nextTick();

      const callsBefore = govukInitAll.mock.calls.length;

      await (
        comp as unknown as {
          initGovUkFrontend(scope?: HTMLElement): Promise<void>;
        }
      ).initGovUkFrontend(document.body);

      await nextTick();

      expect(govukInitAll.mock.calls.length).toBeGreaterThan(callsBefore);
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

describe('Preview layout', () => {
  it.each(['browser', 'server'])(
    'renders a direct preview URL without app navigation or branding on %s',
    async (platform) => {
      await TestBed.configureTestingModule({
        imports: [App],
        providers: [
          { provide: PLATFORM_ID, useValue: platform },
          provideRouter([
            {
              path: 'applications-list',
              children: [
                {
                  path: ':id/preview',
                  data: { preview: true },
                  component: DummyRouteComponent,
                },
                { path: '', component: DummyRouteComponent },
              ],
            },
          ]),
        ],
      })
        .overrideComponent(App, {
          remove: {
            imports: [
              HeaderComponent,
              ServiceNavigationComponent,
              FooterComponent,
            ],
          },
          add: { imports: [LayoutStub] },
        })
        .compileComponents();

      const router = TestBed.inject(Router);
      await router.navigateByUrl('/applications-list/example/preview');
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();
      const layout = () =>
        fixture.nativeElement.querySelectorAll(
          'app-header, app-service-navigation, app-footer',
        );
      expect(layout()).toHaveLength(0);
      expect(
        fixture.nativeElement.querySelector('main router-outlet'),
      ).not.toBeNull();

      await router.navigateByUrl('/applications-list');
      fixture.detectChanges();
      expect(layout()).toHaveLength(3);

      await router.navigateByUrl('/applications-list/another/preview');
      fixture.detectChanges();
      expect(layout()).toHaveLength(0);
    },
  );
});
