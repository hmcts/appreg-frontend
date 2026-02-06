import { CommonModule } from '@angular/common';
import {
  Component,
  effect,
  forwardRef,
  input,
  output,
  signal,
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
export class SuggestionsComponent<T = unknown> implements ControlValueAccessor {
  id = input('');
  label = input('');
  hint = input('');
  disabled = input(false);
  showError = input(false);
  errorText = input('This field is required');
  suggestions = input.required<T[]>();

  search = input('');
  searchChange = output<string>();

  getItemLabel = input<((item: T) => string) | null>(null);
  selectItem = output<T>();

  value = input('');
  valueChange = output<string>();

  widthClass = input('govuk-input--width-10');
  containerWidthClass = input('govuk-grid-column-one-quarter');

  private focused = false;
  private justSelected = false;
  private committedLabel: string | null = null;
  searchState = signal('');
  suggestionsState = signal<T[]>([]);
  valueState = signal('');
  disabledState = signal(false);
  getItemLabelState = signal<((item: T) => string) | null>(null);

  private readonly syncSearchInput = effect(() => {
    const next = asString(this.search());
    if (next === null) {
      return;
    }

    this.searchState.set(next);
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
  });

  private readonly syncSuggestionsInput = effect(() => {
    this.suggestionsState.set(this.suggestions());
  });

  private readonly syncValueInput = effect(() => {
    this.valueState.set(this.value());
  });

  private readonly syncDisabledInput = effect(() => {
    this.disabledState.set(this.disabled());
  });

  private readonly syncGetItemLabelInput = effect(() => {
    this.getItemLabelState.set(this.getItemLabel());
  });
  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(next: string | null = ''): void {
    const resolved = next ?? '';
    this.valueState.set(resolved);

    if (!resolved) {
      this.searchState.set('');
      this.committedLabel = null;
      this.justSelected = false;
      this.suggestionsState.set([]);
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabledState.set(isDisabled);
  }

  onInput(v: string): void {
    this.searchState.set(v);
    this.searchChange.emit(v);

    this.justSelected = false;
    if (!this.hasQuery || !this.isCommittedText) {
      this.committedLabel = null;
    }

    if (!v.trim()) {
      this.setValueInternal('');
    }
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    setTimeout(() => (this.focused = false), 0);
  }

  labelFor(item: T): string {
    const getItemLabel = this.getItemLabelState();
    if (getItemLabel) {
      return getItemLabel(item);
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

  private valueFor(item: T): string {
    if (item === null || item === undefined) {
      return '';
    }
    if (typeof item === 'string') {
      return item;
    }

    if (isRecord(item)) {
      const v = item['value'];
      if (typeof v === 'string') {
        return v;
      }

      const lc = item['locationCode'];
      if (typeof lc === 'string') {
        return lc;
      }
    }

    return '';
  }

  choose(item: T, e: MouseEvent): void {
    e.preventDefault();

    // still emit the object if parent wants it
    this.selectItem.emit(item);

    const label = this.labelFor(item);
    const val = this.valueFor(item);

    // update UI text
    this.searchState.set(label);
    this.committedLabel = label;

    // clear list UI
    this.suggestionsState.set([]);
    this.justSelected = true;

    // update CVA/form value
    this.setValueInternal(val);

    // mark touched on selection
    this.onTouched();
  }

  private setValueInternal(v: string): void {
    this.valueState.set(v);
    this.valueChange.emit(v);
    this.onChange(v);
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
      (this.suggestionsState().length ?? 0) === 0 &&
      !this.isCommittedText &&
      !this.justSelected &&
      !this.disabledState()
    );
  }

  get open(): boolean {
    return (
      !this.disabledState() &&
      !!this.searchState().trim() &&
      !this.isCommittedText &&
      this.suggestionsState().length > 0
    );
  }

  get hasQuery(): boolean {
    return !!this.searchState().trim();
  }

  get isCommittedText(): boolean {
    return (
      !!this.committedLabel &&
      this.norm(this.searchState()) === this.norm(this.committedLabel)
    );
  }

  private norm(s: string | null | undefined) {
    return (s ?? '').trim().toLowerCase();
  }
}
