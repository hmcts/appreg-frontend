import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { AlertComponent, AlertType } from '@components/alert/alert.component';

@Component({
  standalone: true,
  imports: [AlertComponent],
  template: `
    <app-alert
      [alertType]="alertType"
      [title]="title"
      [message]="message"
      [allowDismiss]="allowDismiss"
      [href]="href"
    />
  `,
})
class HostComponent {
  alertType: AlertType = 'information';
  title = 'The finance section has moved';
  message = 'You can now find it in the';
  allowDismiss = false;
  href: { href: string; msg: string } | null = {
    href: '/dashboard',
    msg: 'dashboard',
  };
}

describe('AlertComponent', () => {
  const alertTypes: AlertType[] = [
    'information',
    'success',
    'warning',
    'error',
  ];

  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it.each(alertTypes)('renders the %s variant', (alertType) => {
    host.alertType = alertType;
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

    expect(heading.nativeElement.textContent.trim()).toBe(host.title);
    expect(content.nativeElement.textContent).toContain(host.message);
    expect(link.nativeElement.getAttribute('href')).toBe('/dashboard');
    expect(link.nativeElement.textContent.trim()).toBe('dashboard');
  });

  it('shows the dismiss button only when enabled', () => {
    let dismissButton = fixture.debugElement.query(
      By.css('.moj-alert__dismiss'),
    );

    expect(dismissButton.nativeElement.hidden).toBe(true);

    host.allowDismiss = true;
    fixture.detectChanges();

    dismissButton = fixture.debugElement.query(By.css('.moj-alert__dismiss'));
    expect(dismissButton.nativeElement.hidden).toBe(false);
  });

  it('dismisses the alert when the dismiss button is clicked', () => {
    host.allowDismiss = true;
    fixture.detectChanges();

    const dismissButton = fixture.debugElement.query(
      By.css('.moj-alert__dismiss'),
    );

    dismissButton.nativeElement.click();
    fixture.detectChanges();

    expect(fixture.debugElement.query(By.css('.moj-alert'))).toBeNull();
  });
});
