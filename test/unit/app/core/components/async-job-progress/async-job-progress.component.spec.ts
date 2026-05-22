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

  it('renders progress content in an aria live status region', () => {
    const progress = fixture.nativeElement.querySelector(
      '.app-async-job-progress',
    ) as HTMLElement;
    const spinner = fixture.nativeElement.querySelector(
      '.app-async-job-progress__spinner',
    ) as HTMLElement;

    expect(progress).toBeTruthy();
    expect(progress.getAttribute('role')).toBe('status');
    expect(progress.getAttribute('aria-live')).toBe('polite');
    expect(progress.getAttribute('aria-atomic')).toBe('true');
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(progress.textContent).toContain('Report in progress');
    expect(progress.textContent).toContain(
      'Your CSV is being generated and will download automatically when ready.',
    );
  });
});
