/**
 * TODO: arcpoc-816
 * valueChanges subscription
 * can be toSignal/effect.
 */

import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
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
  @Input() label = 'Search for a result code';
  @Input() hint = 'Start typing to see results';
  @Input() buttonText = 'Save';
  @Input() placeholder = '';

  /** Form/input attributes */
  @Input() name = 'search';
  @Input() inputId?: string;
  @Input() ariaDescribedBy?: string;

  /** Events */
  @Output() submitted = new EventEmitter<string>();
  @Output() valueChange = new EventEmitter<string>();

  // Monotonic counter shared by all instances
  private static nextId = 0;

  /** Internal form */
  readonly form: FormGroup<{ search: FormControl<string> }>;

  /** Unique id so multiple instances don’t collide */
  private readonly uid = `search-${++SearchBoxComponent.nextId}`;
  get computedId(): string {
    return this.inputId ?? this.uid;
  }
  get hintId(): string {
    return `${this.computedId}-hint`;
  }
  get ariaDescribedByAttr(): string | null {
    if (this.ariaDescribedBy) {
      return this.ariaDescribedBy;
    }
    return this.hint ? this.hintId : null;
  }

  constructor(fb: NonNullableFormBuilder) {
    this.form = fb.group({
      search: fb.control(''),
    });

    this.form.controls.search.valueChanges.subscribe((v) => {
      this.valueChange.emit(v);
    });
  }

  onSubmit(): void {
    this.submitted.emit(this.form.controls.search.value);
  }
}
