import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  output,
  signal,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

import { SuggestionsItem } from './suggestions.types';

import { trimStringToLowerCase } from '@util/string-helpers';

@Component({
  selector: 'app-suggestions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suggestions.component.html',
  styleUrl: './suggestions.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SuggestionsComponent),
      multi: true,
    },
  ],
})
export class SuggestionsComponent implements ControlValueAccessor {
  id = input('');
  label = input('');
  hint = input('');
  disabled = input(false);
  showError = input(false);
  errorText = input('This field is required');
  suggestions = input.required<SuggestionsItem[]>();
  showAllValues = input(false);

  search = input('');
  searchChange = output<string>();

  selectItem = output<SuggestionsItem>();

  widthClass = input('govuk-input--width-10');
  containerWidthClass = input('govuk-grid-column-one-quarter');

  private focused = false;
  private justSelected = false;
  private allValuesVisible = false;
  private committedLabel: string | null = null;
  searchState = signal('');
  private readonly controlValue = signal('');
  private readonly controlDisabledState = signal(false);
  disabledState = computed(
    () => this.disabled() || this.controlDisabledState(),
  );

  private readonly syncSearchInput = effect(() => {
    const next = this.search();
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

  private readonly syncControlValueDisplay = effect(() => {
    const value = this.controlValue();

    if (!value || this.focused) {
      return;
    }

    if (this.hasQuery && !this.isCommittedText) {
      return;
    }

    const label = this.suggestions().find(
      (item) => item.value === value,
    )?.label;

    if (!label && this.hasQuery) {
      return;
    }

    const displayValue = label ?? value;

    this.searchState.set(displayValue);
    this.committedLabel = displayValue;
    this.justSelected = true;
  });

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(next: string | null = ''): void {
    const resolved = next ?? '';
    this.controlValue.set(resolved);

    if (!resolved) {
      this.searchState.set('');
      this.committedLabel = null;
      this.justSelected = false;
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabledState.set(isDisabled);
  }

  onInput(v: string): void {
    this.searchState.set(v);
    this.searchChange.emit(v);
    this.allValuesVisible = this.showAllValues();

    this.justSelected = false;
    if (!this.hasQuery || !this.isCommittedText) {
      this.committedLabel = null;
    }

    if (!v.trim()) {
      this.setValueInternal('');
    }
  }

  onNativeInput(event: Event): void {
    this.onInput((event.target as HTMLInputElement).value ?? '');
  }

  onFocus(): void {
    this.focused = true;
    this.allValuesVisible = this.showAllValues();
  }

  onClick(): void {
    this.allValuesVisible = this.showAllValues();
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabledState()) {
      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'Enter') {
      this.allValuesVisible = this.showAllValues();
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.focused = false;
      this.allValuesVisible = false;
      this.onTouched();
    }, 0);
  }

  labelFor(item: SuggestionsItem): string {
    return item.label;
  }

  private valueFor(item: SuggestionsItem): string {
    return item.value;
  }

  choose(item: SuggestionsItem, e: MouseEvent): void {
    e.preventDefault();

    // still emit the object if parent wants it
    this.selectItem.emit(item);

    const label = this.labelFor(item);
    const val = this.valueFor(item);

    if (this.showAllValues()) {
      this.searchState.set('');
      this.searchChange.emit('');
      this.committedLabel = null;
    } else {
      // update UI text
      this.searchState.set(label);
      this.committedLabel = label;
    }

    this.allValuesVisible = false;
    this.justSelected = true;

    // update CVA/form value
    this.setValueInternal(val);

    // mark touched on selection
    this.onTouched();
  }

  private setValueInternal(v: string): void {
    this.controlValue.set(v);
    this.onChange(v);
  }

  get statusId(): string {
    return `${this.id()}-status`;
  }

  get listboxId(): string {
    return `${this.id()}-listbox`;
  }

  get popupVisible(): boolean {
    return this.open || this.noResultsVisible;
  }

  get noResultsVisible(): boolean {
    return (
      this.focused &&
      this.hasQuery &&
      (this.visibleSuggestions.length ?? 0) === 0 &&
      !this.isCommittedText &&
      !this.justSelected &&
      !this.disabledState()
    );
  }

  get open(): boolean {
    const canShowAllValues =
      this.showAllValues() && this.focused && this.allValuesVisible;

    return (
      !this.disabledState() &&
      (this.hasQuery || canShowAllValues) &&
      !this.isCommittedText &&
      this.visibleSuggestions.length > 0
    );
  }

  get hasQuery(): boolean {
    return !!this.searchState().trim();
  }

  get isCommittedText(): boolean {
    return (
      !!this.committedLabel &&
      trimStringToLowerCase(this.searchState()) ===
        trimStringToLowerCase(this.committedLabel)
    );
  }

  get visibleSuggestions(): SuggestionsItem[] {
    const suggestions = this.suggestions();

    if (!this.showAllValues()) {
      return suggestions;
    }

    const query = trimStringToLowerCase(this.searchState());

    if (!query) {
      return suggestions;
    }

    return suggestions.filter((item) =>
      trimStringToLowerCase(this.labelFor(item)).includes(query),
    );
  }
}
