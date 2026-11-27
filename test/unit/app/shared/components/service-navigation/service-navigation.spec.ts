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
          ...[
            'applications-list',
            'applications',
            'standard-applicants',
            'reports',
          ].map((path) => ({
            path,
            children: [
              { path: '', component: DummyComponent },
              { path: 'detail', component: DummyComponent },
            ],
          })),
        ]),
        provideLocationMocks(),
        { provide: SessionService, useValue: session },
        { provide: HeaderService, useValue: header },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  afterEach(() => {
    document.cookie =
      'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
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

  it('renders sign out as a POST form', async () => {
    document.cookie = 'XSRF-TOKEN=test-token; path=/';
    await createAt('/lists');

    const form = fixture.nativeElement.querySelector(
      'form[action="/sso/logout"]',
    ) as HTMLFormElement | null;
    const csrfInput = form?.querySelector(
      'input[name="_csrf"]',
    ) as HTMLInputElement | null;
    const button = form?.querySelector('button[type="submit"]');

    expect(form?.getAttribute('action')).toBe('/sso/logout');
    expect(form?.getAttribute('method')).toBe('post');
    expect(csrfInput?.getAttribute('type')).toBe('hidden');
    expect(csrfInput?.value).toBe('test-token');
    expect(button?.classList.contains('govuk-service-navigation__link')).toBe(
      true,
    );
    expect(button?.textContent?.trim()).toBe('Sign out');
  });

  it.each([
    'applications-list',
    'applications',
    'standard-applicants',
    'reports',
  ])(
    'marks only the current %s link and clears the previous state on navigation',
    async (path) => {
      await createAt('/');
      for (const destination of [path, 'login', `${path}?page=2#results`]) {
        await router.navigateByUrl(`/${destination}`);
        fixture.detectChanges();
        await fixture.whenStable();
        fixture.detectChanges();

        const current =
          fixture.nativeElement.querySelectorAll('a[aria-current]');
        expect(current).toHaveLength(destination === 'login' ? 0 : 1);
        if (destination !== 'login') {
          expect(current[0].getAttribute('href')).toBe(`/${path}`);
          expect(current[0].getAttribute('aria-current')).toBe('page');
          expect(
            current[0]
              .closest('li')
              .classList.contains('govuk-service-navigation__item--active'),
          ).toBe(true);
        }
      }
    },
  );

  it.each(['applications-list', 'applications', 'standard-applicants'])(
    'marks %s as the current section on a child page',
    async (path) => {
      await createAt(`/${path}/detail`);
      fixture.detectChanges();
      const current = fixture.nativeElement.querySelectorAll('a[aria-current]');
      expect(current).toHaveLength(1);
      expect(current[0].getAttribute('href')).toBe(`/${path}`);
      expect(current[0].getAttribute('aria-current')).toBe('true');
    },
  );

  it('does not mark Reports as current on an unmatched child page', async () => {
    await createAt('/reports/detail');
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelectorAll('a[aria-current]'),
    ).toHaveLength(0);
  });
});
