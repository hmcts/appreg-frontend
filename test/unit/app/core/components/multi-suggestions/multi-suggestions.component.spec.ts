import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import {
  MULTI_SUGGESTIONS_MAX_MATCHES,
  MultiSuggestionsComponent,
} from '@components/multi-suggestions/multi-suggestions.component';
import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import {
  CourtSuggestionItem,
  SuggestionsItem,
  toCourtSuggestionItem,
} from '@components/suggestions/suggestions.types';

const court = (locationCode: string, name: string): CourtSuggestionItem =>
  toCourtSuggestionItem({ locationCode, name });

const ALPHA = court('CRT001', 'Alpha Court');
const BRAVO = court('CRT002', 'Bravo Court');
const CHARLIE = court('CRT003', 'Charlie Court');

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, MultiSuggestionsComponent],
  template: `
    <app-multi-suggestions
      id="host-courts"
      label="Other courts"
      hint="Start typing a court code or name"
      selectedHeading="Selected courts"
      [options]="options()"
      [extraLabels]="extraLabels()"
      [maxItems]="maxItems()"
      [formControl]="control"
      (searchChange)="searches.push($event)"
    />
  `,
})
class MultiSuggestionsHostComponent {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
  readonly options = signal<SuggestionsItem[]>([ALPHA, BRAVO, CHARLIE]);
  readonly extraLabels = signal<Record<string, string>>({});
  readonly maxItems = signal(20);
  readonly searches: string[] = [];
}

describe('MultiSuggestionsComponent', () => {
  let fixture: ComponentFixture<MultiSuggestionsHostComponent>;
  let host: MultiSuggestionsHostComponent;
  let element: HTMLElement;

  const component = (): MultiSuggestionsComponent =>
    fixture.debugElement.query(By.directive(MultiSuggestionsComponent))
      .componentInstance as MultiSuggestionsComponent;

  const typeahead = (): SuggestionsComponent =>
    fixture.debugElement.query(By.directive(SuggestionsComponent))
      .componentInstance as SuggestionsComponent;

  const input = (): HTMLInputElement =>
    element.querySelector('input#host-courts') as HTMLInputElement;

  const type = (text: string): void => {
    input().focus();
    input().value = text;
    input().dispatchEvent(new Event('input'));
    fixture.detectChanges();
  };

  const offeredLabels = (): string[] =>
    Array.from(element.querySelectorAll<HTMLElement>('[role="option"]')).map(
      (option) => option.textContent?.trim() ?? '',
    );

  const selectedLabels = (): string[] =>
    Array.from(
      element.querySelectorAll<HTMLElement>(
        '#host-courts-selected .govuk-summary-list__value',
      ),
    ).map((row) => row.textContent?.trim() ?? '');

  const removeLinks = (): HTMLAnchorElement[] =>
    Array.from(
      element.querySelectorAll<HTMLAnchorElement>(
        '#host-courts-selected .govuk-summary-list__actions a',
      ),
    );

  const hintText = (): string | undefined =>
    element.querySelector('#host-courts-hint')?.textContent?.trim();

  const statusText = (): string | undefined =>
    element.querySelector('#host-courts-status')?.textContent?.trim();

  const clickOption = (label: string): void => {
    const option = Array.from(
      element.querySelectorAll<HTMLElement>('[role="option"]'),
    ).find((item) => item.textContent?.trim() === label);
    expect(option).toBeDefined();
    option?.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    option?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();
  };

  const setValue = (value: string[]): void => {
    host.control.setValue(value);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSuggestionsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSuggestionsHostComponent);
    host = fixture.componentInstance;
    element = fixture.nativeElement as HTMLElement;
    fixture.detectChanges();
  });

  it('renders the label and hint without a selected list when nothing is selected', () => {
    expect(
      element.querySelector('#host-courts-label')?.textContent?.trim(),
    ).toBe('Other courts');
    expect(hintText()).toBe('Start typing a court code or name');
    expect(element.querySelector('#host-courts-selected')).toBeNull();
    expect(element.textContent).not.toContain('Selected courts');
  });

  it('keeps the id on the input only, not on the host element', () => {
    expect(document.querySelectorAll('#host-courts')).toHaveLength(1);
    expect(
      element.querySelector('app-multi-suggestions')?.getAttribute('id'),
    ).toBeNull();
  });

  it('emits searchChange as the user types and offers matching options', () => {
    type('bravo');

    expect(host.searches).toEqual(['bravo']);
    expect(offeredLabels()).toEqual([BRAVO.label]);
  });

  it('matches options by code as well as label, ignoring case and spaces', () => {
    type('  crt00 ');

    expect(offeredLabels()).toEqual([ALPHA.label, BRAVO.label, CHARLIE.label]);
  });

  it('adds a chosen suggestion and clears the search', () => {
    type('alp');

    clickOption(ALPHA.label);

    expect(host.control.value).toEqual([ALPHA.value]);
    expect(input().value).toBe('');
    expect(typeahead().searchState()).toBe('');
    expect(component().search()).toBe('');
    expect(host.searches).toEqual(['alp', '']);
    expect(offeredLabels()).toEqual([]);
    expect(element.textContent).toContain('Selected courts');
    expect(selectedLabels()).toEqual([ALPHA.label]);
  });

  it('adds the only match when Enter is pressed and clears the search', () => {
    type('charlie');

    input().dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(host.control.value).toEqual([CHARLIE.value]);
    expect(input().value).toBe('');
    expect(host.searches).toEqual(['charlie', '']);
  });

  it('marks the control dirty and touched when a value is added', () => {
    type('alp');
    clickOption(ALPHA.label);

    expect(host.control.dirty).toBe(true);
    expect(host.control.touched).toBe(true);
  });

  it('marks the control touched when focus leaves the field', () => {
    input().focus();
    input().blur();

    expect(host.control.touched).toBe(true);
  });

  it('does not offer values that are already selected', () => {
    setValue([ALPHA.value, CHARLIE.value]);

    type('court');

    expect(offeredLabels()).toEqual([BRAVO.label]);
  });

  it('does not add a value that is already selected', () => {
    setValue([ALPHA.value]);

    component().onSelectItem(ALPHA);
    fixture.detectChanges();

    expect(host.control.value).toEqual([ALPHA.value]);
    expect(selectedLabels()).toEqual([ALPHA.label]);
  });

  it(`offers at most ${MULTI_SUGGESTIONS_MAX_MATCHES} matches`, () => {
    host.options.set(
      Array.from({ length: MULTI_SUGGESTIONS_MAX_MATCHES + 5 }, (_, index) =>
        court(`CRT${String(index + 100)}`, `Court ${index + 1}`),
      ),
    );
    fixture.detectChanges();

    type('court');

    expect(offeredLabels()).toHaveLength(MULTI_SUGGESTIONS_MAX_MATCHES);
  });

  it('removes a value when its Remove link is clicked', () => {
    setValue([ALPHA.value, BRAVO.value]);

    removeLinks()[0].click();
    fixture.detectChanges();

    expect(host.control.value).toEqual([BRAVO.value]);
    expect(selectedLabels()).toEqual([BRAVO.label]);
    expect(host.control.touched).toBe(true);
  });

  it('gives each Remove link a visually hidden label and keeps focus in the field after removing', () => {
    setValue([ALPHA.value, BRAVO.value]);

    const links = removeLinks();
    expect(
      links.map((link) => link.textContent?.replaceAll(/\s+/g, ' ').trim()),
    ).toEqual([`Remove ${ALPHA.label}`, `Remove ${BRAVO.label}`]);
    expect(
      links[0].querySelector('.govuk-visually-hidden')?.textContent?.trim(),
    ).toBe(ALPHA.label);

    links[0].focus();
    links[0].click();
    fixture.detectChanges();

    expect(document.activeElement).toBe(input());
  });

  it('does not emit when asked to remove a value that is not selected', () => {
    setValue([ALPHA.value]);
    const bound = host.control.value;

    component().remove(BRAVO.value);
    fixture.detectChanges();

    expect(host.control.value).toBe(bound);
    expect(host.control.dirty).toBe(false);
  });

  it('hides the selected list once the last value is removed', () => {
    setValue([ALPHA.value]);

    removeLinks()[0].click();
    fixture.detectChanges();

    expect(host.control.value).toEqual([]);
    expect(element.querySelector('#host-courts-selected')).toBeNull();
    expect(element.textContent).not.toContain('Selected courts');
  });

  it('offers a removed value again', () => {
    setValue([ALPHA.value]);
    removeLinks()[0].click();
    fixture.detectChanges();

    type('alpha');

    expect(offeredLabels()).toEqual([ALPHA.label]);
  });

  it('emits a new array without changing the bound one', () => {
    const bound = [ALPHA.value];
    setValue(bound);

    type('bra');
    clickOption(BRAVO.label);

    const added = host.control.value;
    expect(added).toEqual([ALPHA.value, BRAVO.value]);
    expect(added).not.toBe(bound);
    expect(bound).toEqual([ALPHA.value]);

    removeLinks()[0].click();
    fixture.detectChanges();

    expect(host.control.value).toEqual([BRAVO.value]);
    expect(host.control.value).not.toBe(added);
    expect(added).toEqual([ALPHA.value, BRAVO.value]);
  });

  it('is not affected when the written array is changed afterwards', () => {
    const bound = [ALPHA.value];
    setValue(bound);

    bound.push(BRAVO.value);
    fixture.detectChanges();

    expect(selectedLabels()).toEqual([ALPHA.label]);

    // Typing re-reads the selected values, so Bravo is only offered if the
    // component kept its own copy of the written array.
    type('bravo');
    expect(offeredLabels()).toEqual([BRAVO.label]);
  });

  it('clears typed text when the control is reset', () => {
    setValue([ALPHA.value]);
    type('bra');
    expect(offeredLabels()).toEqual([BRAVO.label]);

    host.control.reset([]);
    fixture.detectChanges();

    expect(input().value).toBe('');
    expect(component().search()).toBe('');
    expect(typeahead().searchState()).toBe('');
    expect(offeredLabels()).toEqual([]);
    expect(element.querySelector('#host-courts-selected')).toBeNull();
    expect(host.searches).toEqual(['bra', '']);

    input().blur();
    input().focus();
    fixture.detectChanges();

    expect(offeredLabels()).toEqual([]);
    expect(statusText()).toBeUndefined();

    host.control.reset([]);
    fixture.detectChanges();

    expect(host.searches).toEqual(['bra', '']);
  });

  it('ignores duplicate, empty and non-string values written to the control', () => {
    setValue([ALPHA.value, ALPHA.value, '', 7 as unknown as string]);

    expect(selectedLabels()).toEqual([ALPHA.label]);

    component().writeValue(null);
    fixture.detectChanges();

    expect(element.querySelector('#host-courts-selected')).toBeNull();
  });

  it('shows an extra label for a value that is not in the options', () => {
    host.extraLabels.set({ CRT900: 'CRT900 - Ended Court' });
    setValue([ALPHA.value, 'CRT900', 'CRT901']);

    expect(selectedLabels()).toEqual([
      ALPHA.label,
      'CRT900 - Ended Court',
      'CRT901',
    ]);
  });

  it('prefers the option label over an extra label for the same value', () => {
    host.extraLabels.set({ [ALPHA.value]: 'Old label' });
    setValue([ALPHA.value]);

    expect(selectedLabels()).toEqual([ALPHA.label]);
  });

  it('does not treat object properties as extra labels', () => {
    setValue(['toString']);

    expect(selectedLabels()).toEqual(['toString']);
  });

  it('keeps the label a value was chosen with when the options change', () => {
    type('alp');
    clickOption(ALPHA.label);

    host.options.set([BRAVO]);
    fixture.detectChanges();

    expect(selectedLabels()).toEqual([ALPHA.label]);
  });

  it('stops adding at maxItems and shows the limit hint', () => {
    host.maxItems.set(2);
    fixture.detectChanges();

    type('alp');
    clickOption(ALPHA.label);
    expect(hintText()).toBe('Start typing a court code or name');

    type('bra');
    clickOption(BRAVO.label);

    expect(host.control.value).toEqual([ALPHA.value, BRAVO.value]);
    expect(hintText()).toBe('You can add up to 2');
    expect(input().getAttribute('aria-describedby')).toContain(
      'host-courts-hint',
    );

    type('charlie');
    expect(offeredLabels()).toEqual([]);
    expect(input().disabled).toBe(false);
    expect(statusText()).toBe(
      'You can add up to 2. Remove one to add another.',
    );
    expect(statusText()).not.toContain('No results found');

    component().onSelectItem(CHARLIE);
    fixture.detectChanges();
    expect(host.control.value).toEqual([ALPHA.value, BRAVO.value]);

    removeLinks()[0].click();
    fixture.detectChanges();

    expect(hintText()).toBe('Start typing a court code or name');
    type('charlie');
    expect(offeredLabels()).toEqual([CHARLIE.label]);

    type('zulu');
    expect(statusText()).toBe('No results found');
  });

  it('stops adding at 20 values by default', () => {
    const defaultFixture = TestBed.createComponent(MultiSuggestionsComponent);
    const multi = defaultFixture.componentInstance;
    const defaultElement = defaultFixture.nativeElement as HTMLElement;
    const onChange = jest.fn();
    const codes = Array.from({ length: 21 }, (_, index) =>
      court(`CRT${String(index + 100)}`, `Court ${index + 1}`),
    );
    const values = codes.map((item) => item.value);

    defaultFixture.componentRef.setInput('id', 'codes');
    multi.registerOnChange(onChange);
    multi.writeValue(values.slice(0, 19));
    defaultFixture.detectChanges();

    expect(multi.hintText()).toBe('');
    expect(defaultElement.querySelector('#codes-hint')).toBeNull();

    multi.onSelectItem(codes[19]);
    defaultFixture.detectChanges();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith(values.slice(0, 20));
    expect(multi.hintText()).toBe('You can add up to 20');
    expect(
      defaultElement.querySelector('#codes-hint')?.textContent?.trim(),
    ).toBe('You can add up to 20');

    multi.onSelectItem(codes[20]);
    defaultFixture.detectChanges();

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(
      defaultElement.querySelectorAll(
        '#codes-selected .govuk-summary-list__row',
      ),
    ).toHaveLength(20);
  });

  it('keeps every written value when the control holds more than maxItems', () => {
    host.maxItems.set(1);
    setValue([ALPHA.value, BRAVO.value]);

    expect(selectedLabels()).toEqual([ALPHA.label, BRAVO.label]);
    expect(hintText()).toBe('You can add up to 1');
  });

  it('disables the typeahead and hides the Remove links when the control is disabled', () => {
    setValue([ALPHA.value]);

    host.control.disable();
    fixture.detectChanges();

    expect(input().disabled).toBe(true);
    expect(selectedLabels()).toEqual([ALPHA.label]);
    expect(removeLinks()).toHaveLength(0);
    expect(
      element.querySelectorAll(
        '#host-courts-selected .govuk-summary-list__row',
      ),
    ).toHaveLength(1);

    component().remove(ALPHA.value);
    component().onSelectItem(BRAVO);
    fixture.detectChanges();
    expect(host.control.value).toEqual([ALPHA.value]);

    host.control.enable();
    fixture.detectChanges();

    expect(input().disabled).toBe(false);
    expect(removeLinks()).toHaveLength(1);
  });

  it('disables the typeahead and hides the Remove links when the disabled input is set', () => {
    const disabledFixture = TestBed.createComponent(MultiSuggestionsComponent);
    const multi = disabledFixture.componentInstance;
    disabledFixture.componentRef.setInput('id', 'codes');
    disabledFixture.componentRef.setInput('options', [ALPHA, BRAVO]);
    multi.writeValue([ALPHA.value]);
    multi.onSearchChange('court');
    disabledFixture.detectChanges();
    expect(multi.suggestions()).toEqual([BRAVO]);

    disabledFixture.componentRef.setInput('disabled', true);
    disabledFixture.detectChanges();

    const disabledElement = disabledFixture.nativeElement as HTMLElement;
    expect(
      (disabledElement.querySelector('input#codes') as HTMLInputElement)
        .disabled,
    ).toBe(true);
    expect(
      disabledElement.querySelectorAll('#codes-selected .govuk-link'),
    ).toHaveLength(0);
    expect(multi.suggestions()).toEqual([]);
  });

  it('passes the error state to the typeahead', () => {
    const errorFixture = TestBed.createComponent(MultiSuggestionsComponent);
    errorFixture.componentRef.setInput('id', 'codes');
    errorFixture.componentRef.setInput('showError', true);
    errorFixture.componentRef.setInput('errorText', 'Enter a valid code');
    errorFixture.detectChanges();

    const errorElement = errorFixture.nativeElement as HTMLElement;
    expect(
      errorElement.querySelector('#codes-error')?.textContent?.trim(),
    ).toBe('Error: Enter a valid code');
    expect(errorElement.querySelector('input#codes')?.classList).toContain(
      'govuk-input--error',
    );
  });

  it('applies the width classes to the container and the input', () => {
    const widthFixture = TestBed.createComponent(MultiSuggestionsComponent);
    widthFixture.componentRef.setInput('id', 'codes');
    widthFixture.componentRef.setInput(
      'containerWidthClass',
      'govuk-grid-column-one-half',
    );
    widthFixture.componentRef.setInput('widthClass', 'govuk-!-width-full');
    widthFixture.detectChanges();

    const widthElement = widthFixture.nativeElement as HTMLElement;
    expect(widthElement.firstElementChild?.className).toBe(
      'govuk-grid-column-one-half',
    );
    expect(widthElement.querySelector('input#codes')?.classList).toContain(
      'govuk-!-width-full',
    );
  });
});
