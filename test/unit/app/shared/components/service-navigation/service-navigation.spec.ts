import { provideLocationMocks } from '@angular/common/testing';
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { ServiceNavigationComponent } from '@components/service-navigation/service-navigation.component';
import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

@Component({ standalone: true, template: '' })
class DummyComponent {}

class MockSessionService {
  readonly isAuthenticated = signal(true);
}

class MockHeaderService {
  private readonly _isVisible = signal(true);
  readonly isVisible = this._isVisible.asReadonly();

  // convenience for tests
  setVisible(v: boolean): void {
    this._isVisible.set(v);
  }
}

describe('ServiceNavigationComponent', () => {
  let fixture: ComponentFixture<ServiceNavigationComponent>;
  let component: ServiceNavigationComponent;
  let router: Router;
  let session: MockSessionService;
  let header: MockHeaderService;

  beforeEach(async () => {
    session = new MockSessionService();
    header = new MockHeaderService();

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
        { provide: HeaderService, useValue: header },
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

  it('creates and computes initial state on non-login route', async () => {
    await createAt('/');

    expect(component).toBeTruthy();
    expect(component.isLoginPage()).toBe(false);
    expect(component.showMenu()).toBe(true);
  });

  it('computes isLoginPage based on current router URL', async () => {
    await createAt('/login');

    expect(component.isLoginPage()).toBe(true);
    expect(component.showMenu()).toBe(false);
  });

  it('updates isLoginPage when navigating', async () => {
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

  it('showMenu becomes false when unauthenticated', async () => {
    await createAt('/lists');
    expect(component.showMenu()).toBe(true);

    session.isAuthenticated.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showMenu()).toBe(false);
  });

  it('showMenu becomes false when header is hidden', async () => {
    await createAt('/lists');
    expect(component.showMenu()).toBe(true);

    header.setVisible(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(component.showMenu()).toBe(false);
  });
});
