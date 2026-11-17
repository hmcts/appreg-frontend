/**
 * Multi-select typeahead whose form value is a `string[]` of option values.
 *
 * It wraps `app-suggestions` without a form control, as the activity audit
 * section does, and passes it only the matches to show (`showAllValues` is
 * off). `extraLabels` names values that are not in the options, such as
 * end-dated codes. At `maxItems` the typeahead stays enabled so a Remove link
 * can move focus back to it. Every change emits a new array, never the bound
 * one.
 *
 * It is also its control's validator: text typed but not added gives
 * `notAdded`, so a search cannot silently run without it.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  signal,
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { SuggestionsItem } from '@components/suggestions/suggestions.types';
import { trimStringToLowerCase } from '@util/string-helpers';

export interface MultiSuggestionsSelectedItem {
  value: string;
  label: string;
}

/** Most matches offered at once while typing. */
export const MULTI_SUGGESTIONS_MAX_MATCHES = 20;

@Component({
  selector: 'app-multi-suggestions',
  standalone: true,
  imports: [SuggestionsComponent],
  templateUrl: './multi-suggestions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.id]': 'null' },
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => MultiSuggestionsComponent),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MultiSuggestionsComponent),
      multi: true,
    },
  ],
})
export class MultiSuggestionsComponent
  implements ControlValueAccessor, Validator
{
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly id = input('');
  readonly label = input('');
  readonly hint = input('');
  readonly selectedHeading = input('Selected');
  readonly options = input<SuggestionsItem[]>([]);
  readonly extraLabels = input<Record<string, string>>({});
  readonly maxItems = input(20);
  readonly showError = input(false);
  readonly errorText = input('This field is required');
  readonly widthClass = input('govuk-input--width-10');
  readonly containerWidthClass = input('govuk-grid-column-one-quarter');

  readonly search = signal('');
  private readonly selected = signal<readonly string[]>([]);
  private readonly chosenLabels = signal<ReadonlyMap<string, string>>(
    new Map(),
  );
  private readonly controlDisabled = signal(false);

  readonly disabledState = this.controlDisabled.asReadonly();

  readonly atLimit = computed(() => this.selected().length >= this.maxItems());

  readonly hintText = computed(() =>
    this.atLimit() ? `You can add up to ${this.maxItems()}` : this.hint(),
  );

  readonly noResultsText = computed(() =>
    this.atLimit()
      ? `You can add up to ${this.maxItems()}. Remove one to add another.`
      : 'No results found',
  );

  readonly suggestions = computed<SuggestionsItem[]>(() => {
    const query = trimStringToLowerCase(this.search());

    if (!query || this.disabledState() || this.atLimit()) {
      return [];
    }

    const selected = new Set(this.selected());

    return this.options()
      .filter(
        (item) =>
          !selected.has(item.value) &&
          (trimStringToLowerCase(item.label).includes(query) ||
            trimStringToLowerCase(item.value).includes(query)),
      )
      .slice(0, MULTI_SUGGESTIONS_MAX_MATCHES);
  });

  readonly selectedItems = computed<MultiSuggestionsSelectedItem[]>(() => {
    const optionLabels = new Map(
      this.options().map((item) => [item.value, item.label]),
    );
    const extraLabels = this.extraLabels();
    const chosenLabels = this.chosenLabels();

    return this.selected().map((value) => ({
      value,
      label:
        optionLabels.get(value) ??
        (Object.hasOwn(extraLabels, value) ? extraLabels[value] : undefined) ??
        chosenLabels.get(value) ??
        value,
    }));
  });

  private onChange: (value: string[]) => void = () => {};
  private onTouched: () => void = () => {};
  private onValidatorChange: () => void = () => {};

  writeValue(value: readonly string[] | null | undefined): void {
    this.selected.set(this.coerceValues(value));
    // No re-validation request: Angular validates straight after a write, and
    // asking here would ignore the caller's emitEvent and onlySelf options.
    this.setSearch('', false);
  }

  registerOnChange(fn: (value: string[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.controlDisabled.set(isDisabled);
  }

  validate(): ValidationErrors | null {
    // Angular skips disabled controls. On enable it validates before
    // setDisabledState(false) runs, so checking controlDisabled would be wrong.
    if (!this.search().trim()) {
      return null;
    }

    return { notAdded: true };
  }

  registerOnValidatorChange(fn: () => void): void {
    this.onValidatorChange = fn;
  }

  onSearchChange(value: string): void {
    this.setSearch(value);
  }

  onSelectItem(item: SuggestionsItem): void {
    // The wrapped typeahead shows the chosen label; clearing the search
    // empties the input so the next value can be typed.
    this.setSearch('');

    const value = item.value;
    const current = this.selected();

    if (
      !value ||
      this.disabledState() ||
      current.includes(value) ||
      current.length >= this.maxItems()
    ) {
      return;
    }

    this.chosenLabels.update((labels) =>
      new Map(labels).set(value, item.label),
    );
    this.commit([...current, value]);
  }

  remove(value: string, event?: Event): void {
    event?.preventDefault();

    if (this.disabledState()) {
      return;
    }

    const current = this.selected();
    const next = current.filter((item) => item !== value);

    if (next.length === current.length) {
      return;
    }

    this.commit(next);

    // The Remove link is about to disappear, so keep focus in the field.
    this.host.nativeElement.querySelector('input')?.focus();
  }

  onFocusOut(): void {
    this.onTouched();
  }

  private setSearch(value: string, revalidate = true): void {
    if (value === this.search()) {
      return;
    }

    this.search.set(value);

    if (revalidate) {
      this.onValidatorChange();
    }
  }

  private commit(next: string[]): void {
    this.selected.set(next);
    this.onChange([...next]);
    this.onTouched();
  }

  private coerceValues(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return Array.from(
      new Set(
        value.filter(
          (item): item is string => typeof item === 'string' && item !== '',
        ),
      ),
    );
  }
}
