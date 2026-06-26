import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { HelpDetailsComponent } from '@components/help-details/help-details.component';

@Component({
  imports: [HelpDetailsComponent],
  template: `
    <app-help-details summary="Help with reports">
      <p class="govuk-body">Projected help content.</p>
    </app-help-details>
  `,
})
class HostComponent {}

describe('HelpDetailsComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('renders the summary text and projected content', () => {
    const summary = fixture.debugElement.query(
      By.css('.govuk-details__summary-text'),
    );
    const body = fixture.debugElement.query(By.css('.govuk-details__text'));

    expect(summary.nativeElement.textContent).toContain('Help with reports');
    expect(body.nativeElement.textContent).toContain('Projected help content.');
  });
});
