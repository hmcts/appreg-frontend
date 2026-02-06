import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  effect,
  input,
  output,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './search-box.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchBoxComponent {
  /** Visual text */
  readonly label = input('Search for a result code');
  readonly hint = input('Start typing to see results');
  readonly buttonText = input('Save');
  readonly placeholder = input('');

  /** Form/input attributes */
  readonly name = input('search');
  readonly inputId = input<string | undefined>(undefined);
  readonly ariaDescribedBy = input<string | undefined>(undefined);

  /** Events */
  readonly submitted = output<string>();
  readonly valueChange = output<string>();

  // Monotonic counter shared by all instances
  private static nextId = 0;

  /** Internal form */
  readonly form: FormGroup<{ search: FormControl<string> }>;
  private readonly searchValue: Signal<string>;

  /** Unique id so multiple instances don’t collide */
  private readonly uid = `search-${++SearchBoxComponent.nextId}`;
  get computedId(): string {
    return this.inputId() ?? this.uid;
  }
  get hintId(): string {
    return `${this.computedId}-hint`;
  }
  get ariaDescribedByAttr(): string | null {
    const describedBy = this.ariaDescribedBy();
    if (describedBy) {
      return describedBy;
    }
    return this.hint() ? this.hintId : null;
  }

  constructor(fb: NonNullableFormBuilder) {
    this.form = fb.group({
      search: fb.control(''),
    });
    this.searchValue = toSignal(this.form.controls.search.valueChanges, {
      initialValue: this.form.controls.search.value,
    });

    let initialized = false;
    effect(() => {
      const value = this.searchValue();
      if (!initialized) {
        initialized = true;
        return;
      }
      this.valueChange.emit(value);
    });
  }

  onSubmit(): void {
    this.submitted.emit(this.form.controls.search.value);
  }
}
