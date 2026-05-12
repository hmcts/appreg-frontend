import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { InternalErrorComponent } from '@components/global-error/internal-error/internal-error.component';

describe('InternalErrorComponent', () => {
  let fixture: ComponentFixture<InternalErrorComponent>;
  let component: InternalErrorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InternalErrorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InternalErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the internal error heading and support link', () => {
    const heading = fixture.debugElement.query(By.css('h1'));
    const link = fixture.debugElement.query(By.css('a.govuk-link'));

    expect(heading.nativeElement.textContent.trim()).toBe(
      'There is a problem with the service',
    );
    expect(heading.attributes['role']).toBe('alert');
    expect(link.nativeElement.getAttribute('href')).toBe(
      'mailto:DTS-ITServiceDesk@justice.gov.uk',
    );
    expect(link.nativeElement.textContent.trim()).toBe(
      'contact the Crime IT Support Team',
    );
  });
});
