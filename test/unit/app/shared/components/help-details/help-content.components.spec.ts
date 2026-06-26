import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ApplicationWordingHelpComponent } from '@components/help-details/application-wording-help.component';
import { CivilFeeHelpComponent } from '@components/help-details/civil-fee-help.component';

@Component({
  imports: [ApplicationWordingHelpComponent, CivilFeeHelpComponent],
  template: `
    <app-application-wording-help />
    <app-civil-fee-help />
  `,
})
class HostComponent {}

describe('help content components', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders application wording help content', () => {
    const bodyText = fixture.nativeElement.textContent;

    expect(bodyText).toContain('Help with application wording');
    expect(bodyText).toContain(
      'Application wording is based on the selected application code',
    );
  });

  it('renders civil fee help content', () => {
    const details = fixture.debugElement.queryAll(By.css('app-help-details'));
    const bodyText = fixture.nativeElement.textContent;

    expect(details).toHaveLength(2);
    expect(bodyText).toContain('Help with civil fee details');
    expect(bodyText).toContain('Undertaking means the applicant');
  });
});
