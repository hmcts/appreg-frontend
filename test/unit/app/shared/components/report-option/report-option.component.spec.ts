import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { ReportSelectorComponent } from '@components/report-option/report-selector.component';

describe('ReportSelectorComponent', () => {
  let component: ReportSelectorComponent;
  let fixture: ComponentFixture<ReportSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FormsModule, ReportSelectorComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ReportSelectorComponent);
    component = fixture.componentInstance;

    component.legend = 'Select a report';
    component.name = 'report';
    component.idPrefix = 'report';
    component.ariaDescribedBy = 'report-hint';
    component.disabled = false;
    component.options = [
      { id: 'daily', label: 'Daily report', hint: 'Summary for the day' },
      { id: 'weekly', label: 'Weekly report' },
    ];
    component.value = null;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the legend heading', () => {
    const el: HTMLElement = fixture.nativeElement;
    const heading = el.querySelector('.govuk-fieldset__heading');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.trim()).toBe('Select a report');
  });

  it('renders a radio item for each option', () => {
    const radios = fixture.debugElement.queryAll(
      By.css('input.govuk-radios__input'),
    );
    expect(radios).toHaveLength(2);

    const first = radios[0].nativeElement as HTMLInputElement;
    const second = radios[1].nativeElement as HTMLInputElement;

    expect(first.id).toBe('report-daily');
    expect(second.id).toBe('report-weekly');
  });

  it('associates labels and hint with the correct ids', () => {
    const el: HTMLElement = fixture.nativeElement;
    const firstInput = el.querySelector(
      'input#report-daily',
    ) as HTMLInputElement;
    const firstLabel = el.querySelector(
      'label[for="report-daily"]',
    ) as HTMLLabelElement;
    const firstHint = el.querySelector('#report-daily-hint') as HTMLDivElement;

    expect(firstInput).toBeTruthy();
    expect(firstLabel).toBeTruthy();
    expect(firstHint).toBeTruthy();
    expect(firstLabel.textContent?.trim()).toBe('Daily report');
    expect(firstHint.textContent?.trim()).toBe('Summary for the day');
  });

  it('updates component value when a radio is selected', () => {
    const radios = fixture.debugElement.queryAll(
      By.css('input.govuk-radios__input'),
    );
    const second = radios[1].nativeElement as HTMLInputElement;

    second.checked = true;
    second.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.value).toBe('weekly');
  });

  it('renders "No options." when options array is empty', () => {
    component.options = [];
    fixture.detectChanges();

    const radios = fixture.debugElement.queryAll(
      By.css('input.govuk-radios__input'),
    );
    expect(radios).toHaveLength(0);

    const el: HTMLElement = fixture.nativeElement;
    const emptyMessage = el.querySelector('.govuk-hint');
    expect(emptyMessage).toBeTruthy();
    expect(emptyMessage?.textContent?.trim()).toBe('No options.');
  });
});
