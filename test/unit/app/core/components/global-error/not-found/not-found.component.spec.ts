import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideRouter } from '@angular/router';

import { NotFoundComponent } from '@components/global-error/not-found/not-found.component';
import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

describe('NotFoundComponent', () => {
  let fixture: ComponentFixture<NotFoundComponent>;
  let component: NotFoundComponent;
  let isAuthenticated: SessionService['isAuthenticated'];
  let headerServiceStub: Pick<
    HeaderService,
    'hideNavigation' | 'showNavigation'
  >;
  let sessionServiceStub: Pick<
    SessionService,
    'isAuthenticated' | 'refresh'
  >;

  beforeEach(async () => {
    isAuthenticated = signal(false);
    headerServiceStub = {
      hideNavigation: jest.fn(),
      showNavigation: jest.fn(),
    };
    sessionServiceStub = {
      isAuthenticated,
      refresh: jest.fn<Promise<boolean>, []>().mockResolvedValue(false),
    };

    await TestBed.configureTestingModule({
      imports: [NotFoundComponent],
      providers: [
        provideRouter([]),
        { provide: HeaderService, useValue: headerServiceStub },
        { provide: SessionService, useValue: sessionServiceStub },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotFoundComponent);
    component = fixture.componentInstance;
  });

  it('creates, refreshes the session, and hides navigation on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(sessionServiceStub.refresh).toHaveBeenCalledTimes(1);
    expect(headerServiceStub.hideNavigation).toHaveBeenCalledTimes(1);
  });

  it('shows navigation when destroyed', () => {
    fixture.detectChanges();
    (headerServiceStub.showNavigation as jest.Mock).mockClear();

    fixture.destroy();

    expect(headerServiceStub.showNavigation).toHaveBeenCalledTimes(1);
  });

  it('renders a login link when the user is not authenticated', () => {
    fixture.detectChanges();

    const heading = fixture.debugElement.query(By.css('h1'));
    const link = fixture.debugElement.query(By.css('a.govuk-link'));

    expect(heading.nativeElement.textContent.trim()).toBe('Page not found');
    expect(heading.attributes['role']).toBe('alert');
    expect(link.nativeElement.textContent.trim()).toBe('Go to login');
    expect(link.nativeElement.getAttribute('href')).toBe('/login');
  });

  it('renders an application list link when the user is authenticated', () => {
    isAuthenticated.set(true);

    fixture.detectChanges();

    const link = fixture.debugElement.query(By.css('a.govuk-link'));
    expect(link.nativeElement.textContent.trim()).toBe('Go to application list');
    expect(link.nativeElement.getAttribute('href')).toBe('/applications-list');
  });
});
