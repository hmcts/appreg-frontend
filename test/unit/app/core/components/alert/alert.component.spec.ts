import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AlertType } from '@components/alert/alert-icons';
import { AlertComponent } from '@components/alert/alert.component';

describe('AlertComponent', () => {
  const alertTypes: AlertType[] = [
    'information',
    'success',
    'warning',
    'error',
  ];

  let fixture: ComponentFixture<AlertComponent>;

  const setInputs = (allowDismiss = false) => {
    fixture.componentRef.setInput('alertType', 'information');
    fixture.componentRef.setInput('title', 'The finance section has moved');
    fixture.componentRef.setInput('message', 'You can now find it in the');
    fixture.componentRef.setInput('allowDismiss', allowDismiss);
    fixture.componentRef.setInput('href', {
      href: '/dashboard',
      msg: 'dashboard',
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlertComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlertComponent);
    setInputs();
    fixture.detectChanges();
  });

  it.each(alertTypes)('renders the %s variant', (alertType) => {
    fixture.componentRef.setInput('alertType', alertType);
    fixture.detectChanges();

    const alert = fixture.debugElement.query(By.css('.moj-alert'));
    const iconPath = fixture.debugElement.query(
      By.css('.moj-alert__icon path'),
    );

    expect(alert.nativeElement.classList).toContain(`moj-alert--${alertType}`);
    expect(iconPath.attributes['d']).toBeTruthy();
    expect(alert.attributes['aria-label']).toContain(`${alertType}:`);
  });

  it('renders the heading, message, and link content', () => {
    const heading = fixture.debugElement.query(By.css('.moj-alert__heading'));
    const content = fixture.debugElement.query(By.css('.moj-alert__content'));
    const link = fixture.debugElement.query(By.css('.moj-alert__content a'));

    expect(heading.nativeElement.textContent.trim()).toBe(
      'The finance section has moved',
    );
    expect(content.nativeElement.textContent).toContain(
      'You can now find it in the',
    );
    expect(link.nativeElement.getAttribute('href')).toBe('/dashboard');
    expect(link.nativeElement.textContent.trim()).toBe('dashboard');
  });

  it('shows the dismiss button only when enabled', () => {
    let dismissButton = fixture.debugElement.query(
      By.css('.moj-alert__dismiss'),
    );

    expect(dismissButton.nativeElement.hidden).toBe(true);

    fixture.componentRef.setInput('allowDismiss', true);
    fixture.detectChanges();

    dismissButton = fixture.debugElement.query(By.css('.moj-alert__dismiss'));
    expect(dismissButton.nativeElement.hidden).toBe(false);
  });

  it('dismisses the alert when the dismiss button is clicked', () => {
    fixture.componentRef.setInput('allowDismiss', true);
    fixture.detectChanges();

    const dismissButton = fixture.debugElement.query(
      By.css('.moj-alert__dismiss'),
    );

    dismissButton.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.moj-alert'))).toBeNull();
  });
});
