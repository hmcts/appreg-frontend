import { provideLocationMocks } from '@angular/common/testing';
import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { SessionService } from '../../../../../../src/app/core/session.service';
import {
  ServiceNavigationComponent
} from '../../../../../../src/app/shared/components/service-navigation/service-navigation.component';

@Component({ standalone: true, template: '' })
class DummyComponent {}

class MockSessionService {
  isAuthenticated = jest.fn<boolean, []>().mockReturnValue(true);
}

/* --------------------------- Browser platform suite --------------------------- */
describe('ServiceNavigationComponent (browser)', () => {
  let fixture: ComponentFixture<ServiceNavigationComponent>;
  let component: ServiceNavigationComponent;
  let router: Router;
  let session: MockSessionService;

  beforeEach(async () => {
    session = new MockSessionService();

    await TestBed.configureTestingModule({
      imports: [ServiceNavigationComponent, DummyComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
          { path: 'lists', component: DummyComponent },
        ]),
        provideLocationMocks(),
        { provide: SessionService, useValue: session },
        { provide: PLATFORM_ID, useValue: 'browser' },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    session.isAuthenticated.mockReturnValue(true);
  });

  async function createAt(url: string) {
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('creates and sets initial isLoginPage to false', async () => {
    await createAt('/');
    expect(component).toBeTruthy();
    expect(component.isLoginPage()).toBe(false);
    expect(component.showMenu()).toBe(true);
  });

  it('updates isLoginPage on real navigations', async () => {
    await createAt('/');

    await router.navigateByUrl('/login');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.isLoginPage()).toBe(true);
    expect(component.showMenu()).toBe(false);

    await router.navigateByUrl('/lists');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(component.isLoginPage()).toBe(false);
    expect(component.showMenu()).toBe(true);
  });

  it('showMenu becomes false when unauthenticated (after recompute)', async () => {
    await createAt('/lists');
    expect(component.showMenu()).toBe(true);

    session.isAuthenticated.mockReturnValue(false);

    component['isLoginPage'].set(true);
    expect(component.showMenu()).toBe(false);

    component['isLoginPage'].set(false);
    expect(component.showMenu()).toBe(false);
  });

  it('onSignOutClicked cancels when the user rejects confirm', async () => {
    await createAt('/lists');

    const preventDefault = jest.fn<void, []>();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.onSignOutClicked({ preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledTimes(1);
    expect(consoleErrSpy).not.toHaveBeenCalled();
  });

  it('onSignOutClicked attempts redirect when confirmed (jsdom logs not-implemented)', async () => {
    await createAt('/lists');

    const preventDefault = jest.fn<void, []>();
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
    const consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    component.onSignOutClicked({ preventDefault } as unknown as Event);

    expect(preventDefault).toHaveBeenCalled();
    expect(confirmSpy).toHaveBeenCalledTimes(1);

    // jsdom logs: "Not implemented: navigation (except hash changes)"
    expect(consoleErrSpy).toHaveBeenCalled();

    const joined = consoleErrSpy.mock.calls.map(args => args.join(' ')).join(' ');
    expect(joined).toContain('Not implemented: navigation');
  });
});

/* ---------------------------- Server platform suite --------------------------- */
describe('ServiceNavigationComponent (server)', () => {
  let fixture: ComponentFixture<ServiceNavigationComponent>;
  let component: ServiceNavigationComponent;
  let router: Router;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServiceNavigationComponent, DummyComponent],
      providers: [
        provideRouter([
          { path: '', component: DummyComponent },
          { path: 'login', component: DummyComponent },
        ]),
        provideLocationMocks(),
        { provide: SessionService, useValue: new MockSessionService() },
        { provide: PLATFORM_ID, useValue: 'server' },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  async function createAt(url: string) {
    await router.navigateByUrl(url);
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  }

  it('does not set isLoginPage from initial URL during server render', async () => {
    await createAt('/login');
    expect(component.isLoginPage()).toBe(false);
  });
});
