import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  forwardRef,
} from '@angular/core';
import {
  ControlValueAccessor,
  FormsModule,
  NG_VALUE_ACCESSOR,
} from '@angular/forms';

import { asString, hasStringProp, isRecord } from '@util/data-utils';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suggestions.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SuggestionsComponent),
      multi: true,
    },
  ],
})
export class SuggestionsComponent<T = unknown>
  implements OnChanges, ControlValueAccessor
{
  @Input() id = '';
  @Input() label = '';
  @Input() hint = '';
  @Input() disabled = false;
  @Input() showError = false;
  @Input() errorText = 'This field is required';
  @Input({ required: true }) suggestions: T[] = [];
  @Input() search = '';
  @Output() searchChange = new EventEmitter<string>();
  @Input() getItemLabel: ((item: T) => string) | null = null;
  @Output() selectItem = new EventEmitter<T>();
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
  @Input() widthClass = 'govuk-input--width-10';
  @Input() containerWidthClass = 'govuk-grid-column-one-quarter';

  private focused = false;
  private justSelected = false;
  private committedLabel: string | null = null;
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(v: string | null): void {
    const next = v ?? '';
    this.value = next;

    if (!next) {
      this.search = '';
      this.committedLabel = null;
      this.justSelected = false;
      this.suggestions = [];
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(v: string): void {
    this.search = v;
    this.searchChange.emit(v);

    this.justSelected = false;
    if (!this.hasQuery || !this.isCommittedText) {
      this.committedLabel = null;
    }

    if (!v.trim()) {
      this.setValueInternal('');
    }
  }

  onBlurInput(): void {
    this.onTouched();
    setTimeout(() => (this.focused = false), 0);
  }

  ngOnChanges(changes: SimpleChanges): void {
    const sc = changes['search'];
    const next = asString(sc?.currentValue);

    if (next === null) {
      return;
    }

    const trimmed = next.trim();

    // If parent sets a value programmatically (e.g. hydrate), treat it as committed
    // so we don't show "No results found" when suggestions is empty.

    if (!this.focused && trimmed) {
      this.committedLabel = next;
      this.justSelected = true;
      return;
    }

    // If search cleared externally, clear committed state
    if (!trimmed) {
      this.committedLabel = null;
      this.justSelected = false;
    }
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    setTimeout(() => (this.focused = false), 0);
  }

  labelFor(item: T): string {
    if (this.getItemLabel) {
      return this.getItemLabel(item);
    }
    if (isRecord(item)) {
      if (hasStringProp(item, 'name')) {
        return item.name;
      }
      if (hasStringProp(item, 'description')) {
        return item.description;
      }
    }
    return String(item as unknown);
  }

  // NEW: derive the value that should be stored in the form (default: item.code or label)
  private valueFor(item: T): string {
    if (item === null || item === undefined) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }

    if (isRecord(item)) {
      // common case: store code if present
      const code = item['code'];
      if (typeof code === 'string') {
        return code;
      }
    }

    // fallback: store label
    return this.labelFor(item);
  }

  choose(item: T, e: MouseEvent): void {
    e.preventDefault();

    // still emit the object if parent wants it
    this.selectItem.emit(item);

    const label = this.labelFor(item);
    const val = this.valueFor(item);

    // update UI text
    this.search = label;
    this.committedLabel = label;

    // clear list UI
    this.suggestions = [];
    this.justSelected = true;

    // update CVA/form value
    this.setValueInternal(val);

    // mark touched on selection
    this.onTouched();
  }

  private setValueInternal(v: string): void {
    this.value = v;
    this.valueChange.emit(v); // keep legacy API
    this.onChange(v); // <-- this is the key CVA link
  }

  labelOf(item: T): string {
    if (item === null) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }
    const o = item as { name?: string; description?: string; code?: string };
    return o.name ?? o.description ?? o.code ?? '';
  }

  get noResultsVisible(): boolean {
    return (
      this.focused &&
      this.hasQuery &&
      (this.suggestions?.length ?? 0) === 0 &&
      !this.isCommittedText &&
      !this.justSelected &&
      !this.disabled
    );
  }

  get open(): boolean {
    return (
      !this.disabled &&
      !!this.search?.trim() &&
      !this.isCommittedText &&
      (this.suggestions?.length ?? 0) > 0
    );
  }

  get hasQuery(): boolean {
    return !!this.search?.trim();
  }

  get isCommittedText(): boolean {
    return (
      !!this.committedLabel &&
      this.norm(this.search) === this.norm(this.committedLabel)
    );
  }

  private norm(s: string | null | undefined) {
    return (s ?? '').trim().toLowerCase();
  }
}
