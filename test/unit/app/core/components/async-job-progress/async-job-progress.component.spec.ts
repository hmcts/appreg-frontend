import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AsyncJobProgressComponent } from '@components/async-job-progress/async-job-progress.component';

describe('AsyncJobProgressComponent', () => {
  let fixture: ComponentFixture<AsyncJobProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AsyncJobProgressComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AsyncJobProgressComponent);
    fixture.componentRef.setInput('heading', 'Report in progress');
    fixture.componentRef.setInput(
      'body',
      'Your CSV is being generated and will download automatically when ready.',
    );
    fixture.detectChanges();
  });

  it('renders progress content with an output live region', () => {
    const progress = fixture.nativeElement.querySelector(
      '.app-async-job-progress',
    ) as HTMLElement;
    const output = fixture.nativeElement.querySelector('output') as HTMLElement;
    const spinner = fixture.nativeElement.querySelector(
      '.app-async-job-progress__spinner',
    ) as HTMLElement;

    expect(progress).toBeTruthy();
    expect(output).toBeTruthy();
    expect(output.getAttribute('aria-live')).toBe('polite');
    expect(output.getAttribute('aria-atomic')).toBe('true');
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(progress.textContent).toContain('Report in progress');
    expect(progress.textContent).toContain(
      'Your CSV is being generated and will download automatically when ready.',
    );
  });
});
