/**
 * Multi-select typeahead (`app-multi-suggestions`): a ControlValueAccessor
 * whose value is a `string[]` of option values.
 *
 * It wraps `app-suggestions` without a form control and drives it through
 * `[search]`, `(searchChange)`, `[suggestions]` and `(selectItem)`, as the
 * activity audit section does. The wrapped typeahead runs with
 * `showAllValues` off, so it shows exactly what this component passes it:
 * the `options` whose label or value contains the search text, without the
 * values already selected, up to 20 matches. Choosing a match adds its value,
 * clears the search and emits `searchChange('')`. Pages can use
 * `searchChange` to load `options` from the API.
 *
 * Selected values are listed under `selectedHeading` (`#<id>-selected`), each
 * with a Remove link. A value's label comes from `options`, then
 * `extraLabels` (values not in the options, such as end-dated codes), then the
 * label it was chosen with, and finally the value itself.
 *
 * Adding stops at `maxItems`, and the hint then reads "You can add up to N".
 * The typeahead stays enabled so the Remove links can move focus back to it,
 * and its live status then gives the limit rather than "No results found".
 * Disabling, through the `disabled` input or the form control, disables the
 * typeahead and hides the Remove links. Every change emits a new array, so the
 * array bound to the control is never changed.
 *
 * Writing a value to the control (a reset, a restore, or filters applied by
 * the page) also clears any typed search text and emits `searchChange('')`.
 *
 * It is also the control's validator. Text typed but not added from the list
 * makes the control invalid with `notAdded`, so a search cannot silently run
 * without it. Picking a match, clearing the text or writing a value makes it
 * valid again. A disabled field has no errors. Changing the `disabled` input
 * does not re-validate the control by itself (the next keystroke or write
 * does), so a page that may disable the field while text is typed should
 * disable the form control instead, which Angular re-validates.
 */

import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  forwardRef,
  inject,
  input,
  output,
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
  readonly disabled = input(false);
  readonly showError = input(false);
  readonly errorText = input('This field is required');
  readonly widthClass = input('govuk-input--width-10');
  readonly containerWidthClass = input('govuk-grid-column-one-quarter');

  readonly searchChange = output<string>();

  readonly search = signal('');
  private readonly selected = signal<readonly string[]>([]);
  private readonly chosenLabels = signal<ReadonlyMap<string, string>>(
    new Map(),
  );
  private readonly controlDisabled = signal(false);

  readonly disabledState = computed(
    () => this.disabled() || this.controlDisabled(),
  );

  readonly atLimit = computed(() => this.selected().length >= this.maxItems());

  readonly hintText = computed(() =>
    this.atLimit() ? `You can add up to ${this.maxItems()}` : this.hint(),
  );

  /** Live status shown by the typeahead when typing offers nothing. */
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
    // A programmatic write replaces whatever was being typed. The control
    // validates itself straight after a write, so this does not ask it to
    // (which would also ignore the caller's emitEvent and onlySelf options).
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
    // Angular does not validate a disabled control, so only the input is
    // checked here. When a control is enabled it is validated before
    // setDisabledState(false) runs, so checking controlDisabled would wrongly
    // pass typed text then.
    if (this.disabled() || !this.search().trim()) {
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
    this.searchChange.emit(value);

    // Typed text that has not been added makes the control invalid.
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
