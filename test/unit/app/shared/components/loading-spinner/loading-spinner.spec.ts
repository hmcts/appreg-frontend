import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { LoadingSpinner } from '@components/loading-spinner/loading-spinner';

describe('LoadingSpinner', () => {
  let component: LoadingSpinner;
  let fixture: ComponentFixture<LoadingSpinner>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [LoadingSpinner],
    });
    fixture = TestBed.createComponent(LoadingSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('shows with default text and size', () => {
    const text = fixture.debugElement.query(By.css('.govuk-heading-m'))
      .nativeElement.textContent;
    const smallLoadingSpinner = fixture.debugElement.query(By.css('.small'));
    expect(smallLoadingSpinner).toBeNull();
    expect(text).toBe('Loading...');
  });

  it('shows custom text', () => {
    const loadingText = 'Custom loading text';
    component.text = loadingText;

    fixture.detectChanges();

    const text = fixture.debugElement.query(By.css('.govuk-heading-m'))
      .nativeElement.textContent;
    expect(text).toBe(loadingText);
  });

  it('shows small loading spinner', () => {
    component.size = 'small';
    fixture.detectChanges();

    const smallLoadingSpinner = fixture.debugElement.query(By.css('.small'));
    expect(smallLoadingSpinner).toBeTruthy();
  });
});
