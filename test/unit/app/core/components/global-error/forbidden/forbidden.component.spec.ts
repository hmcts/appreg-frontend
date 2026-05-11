import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ForbiddenComponent } from '@components/global-error/forbidden/forbidden.component';
import { HeaderService } from '@services/header.service';

describe('ForbiddenComponent', () => {
  let fixture: ComponentFixture<ForbiddenComponent>;
  let component: ForbiddenComponent;
  let headerServiceStub: Pick<
    HeaderService,
    'hideNavigation' | 'showNavigation'
  >;

  beforeEach(async () => {
    headerServiceStub = {
      hideNavigation: jest.fn(),
      showNavigation: jest.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ForbiddenComponent],
      providers: [{ provide: HeaderService, useValue: headerServiceStub }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForbiddenComponent);
    component = fixture.componentInstance;
  });

  it('creates and hides navigation on init', () => {
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(headerServiceStub.hideNavigation).toHaveBeenCalledTimes(1);
  });

  it('shows navigation when destroyed', () => {
    fixture.detectChanges();
    (headerServiceStub.showNavigation as jest.Mock).mockClear();

    fixture.destroy();

    expect(headerServiceStub.showNavigation).toHaveBeenCalledTimes(1);
  });

  it('renders the default forbidden heading and support link', () => {
    fixture.detectChanges();

    const heading = fixture.debugElement.query(By.css('#forbidden-heading'));
    const link = fixture.debugElement.query(By.css('#forbidden-body a'));

    expect(heading.nativeElement.textContent.trim()).toBe(
      'You do not have permission to access this page',
    );
    expect(heading.attributes['role']).toBe('alert');
    expect(link.nativeElement.getAttribute('href')).toBe(
      'mailto:DTS-ITServiceDesk@justice.gov.uk',
    );
    expect(link.nativeElement.textContent.trim()).toBe(
      'contact the Crime IT Support Team.',
    );
  });

  it('renders a custom heading when provided', () => {
    fixture.componentRef.setInput('header', 'Access to this record is denied');

    fixture.detectChanges();

    const heading = fixture.debugElement.query(By.css('#forbidden-heading'));
    expect(heading.nativeElement.textContent.trim()).toBe(
      'Access to this record is denied',
    );
  });
});
