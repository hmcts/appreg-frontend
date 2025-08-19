import { Component, PLATFORM_ID, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';

import { SessionService } from '../../../../../../src/app/core/session.service';
import { ServiceNavigationComponent } from '../../../../../../src/app/shared/components/service-navigation/service-navigation.component';

// A tiny standalone component to satisfy route matches
@Component({ standalone: true, template: '' })
class DummyCmp {}

describe('ServiceNavigationComponent (browser)', () => {
  let fixture: ComponentFixture<ServiceNavigationComponent>;
  let component: ServiceNavigationComponent;
  let router: Router;

  // A minimal SessionService mock with a real Angular signal
  const isAuthed = signal(false);
  const sessionMock: Pick<SessionService, 'isAuthenticated'> = {
    isAuthenticated: isAuthed,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Provide routes so Router can navigate without errors
        RouterTestingModule.withRoutes([
          { path: '', component: DummyCmp },
          { path: 'login', component: DummyCmp },
          { path: 'home', component: DummyCmp },
        ]),
        // Standalone component goes in imports
        ServiceNavigationComponent,
        DummyCmp,
        RouterLink,
        RouterLinkActive,
      ],
      providers: [
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: SessionService, useValue: sessionMock },
      ],
    })
      // avoid fetching the external template file
      .overrideComponent(ServiceNavigationComponent, { set: { template: '' } })
      .compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    // reset auth signal after each test
    isAuthed.set(false);
    jest.resetAllMocks();
  });

  it('should create', async () => {
    await router.navigateByUrl('/home');
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('sets isLoginPage on init based on current URL (browser)', async () => {
    await router.navigateByUrl('/login'); // set URL before creating component
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoginPage()).toBe(true);
  });

  it('updates isLoginPage on NavigationEnd events', async () => {
    await router.navigateByUrl('/home');
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.isLoginPage()).toBe(false);

    await router.navigateByUrl('/login'); // triggers NavigationEnd
    expect(component.isLoginPage()).toBe(true);

    await router.navigateByUrl('/home');
    expect(component.isLoginPage()).toBe(false);
  });

  it('showMenu is true only when authenticated and not on /login', async () => {
    // start on non-login route
    await router.navigateByUrl('/home');
    fixture = TestBed.createComponent(ServiceNavigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // unauthenticated -> false
    isAuthed.set(false);
    expect(component.showMenu()).toBe(false);

    // authenticated + not login -> true
    isAuthed.set(true);
    expect(component.showMenu()).toBe(true);

    // navigate to login -> false even if authenticated
    await router.navigateByUrl('/login');
    expect(component.showMenu()).toBe(false);
  });
});
