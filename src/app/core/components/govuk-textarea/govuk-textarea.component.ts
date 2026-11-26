import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  effect,
  input,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

/**
 * GovukTextareaComponent
 *
 * Functionality:
 * - Displays a GOV.UK styled textarea.
 * - Tracks input and optional character count and errors.
 * - Supports a character limit, count display, and error presentation.
 */
@Component({
  selector: 'app-govuk-textarea',
  // The ID belongs to the inner element, not the component host.
  host: { '[attr.id]': 'null' },
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './govuk-textarea.component.html',
})
export class GovukTextareaComponent implements OnDestroy {
  control = input.required<FormControl<string | null>>();
  maxCharacterLimit = input(2000);
  rows = input(5);
  id = input.required<string>();
  name = input.required<string>();
  ariaDescribedBy = input.required<string>();
  isInvalid = input(false);
  characterCountEnabled = input(true);
  errorMessage = input<string>('');
  label = input<string>('');
  containerWidthClass = input('');

  private readonly value = signal<string>('');
  protected readonly isFocused = signal(false);
  protected readonly announcedCount = signal('');
  private announcementTimeout?: ReturnType<typeof setTimeout>;

  constructor() {
    effect((onCleanup) => {
      const control = this.control();
      this.value.set(control.value ?? '');

      const subscription = control.valueChanges.subscribe((value) => {
        this.value.set(value ?? '');
      });

      onCleanup(() => subscription.unsubscribe());
    });
  }

  get errorId(): string {
    return `${this.id()}-error`;
  }

  get describedBy(): string | null {
    const describedBy = [
      this.ariaDescribedBy(),
      this.characterCountEnabled() ? `${this.id()}-hint` : '',
      this.isInvalid() && this.errorMessage() ? this.errorId : '',
    ]
      .flatMap((ids) => ids.split(/\s+/))
      .filter(Boolean);

    return [...new Set(describedBy)].join(' ') || null;
  }

  onInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value.set(textarea.value);
    if (this.isFocused()) {
      this.scheduleCountAnnouncement();
    }
  }

  onFocus(): void {
    this.isFocused.set(true);
    this.scheduleCountAnnouncement();
  }

  onBlur(): void {
    this.isFocused.set(false);
    clearTimeout(this.announcementTimeout);
    this.announcedCount.set('');
  }

  ngOnDestroy(): void {
    clearTimeout(this.announcementTimeout);
  }

  private scheduleCountAnnouncement(): void {
    clearTimeout(this.announcementTimeout);
    this.announcementTimeout = setTimeout(() => {
      this.announcedCount.set(this.charLimitText);
    }, 1000);
  }

  get remainingCharacterCount(): number {
    return this.maxCharacterLimit() - this.value().length;
  }

  get charLimitText(): string {
    if (this.remainingCharacterCount < 0) {
      return `You have 0 characters remaining. Please remove ${Math.abs(this.remainingCharacterCount)} characters before submitting.`;
    }
    return `You have ${this.remainingCharacterCount} character${this.remainingCharacterCount === 1 ? '' : 's'} remaining`;
  }
}
