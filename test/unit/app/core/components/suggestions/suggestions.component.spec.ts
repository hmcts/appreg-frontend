import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import {
  CourtSuggestionItem,
  SuggestionsItem,
  toActivitySuggestionItem,
} from '@components/suggestions/suggestions.types';
import { ActivityType } from '@openapi';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SuggestionsComponent],
  template: `
    <app-suggestions
      id="host-suggestions"
      [suggestions]="suggestions"
      [formControl]="control"
    />
  `,
})
class SuggestionsHostComponent {
  control = new FormControl('');
  suggestions: CourtSuggestionItem[] = [];
}

describe('SuggestionsComponent', () => {
  let fixture: ComponentFixture<SuggestionsComponent>;
  let component: SuggestionsComponent;

  const suggestion = (
    value: string,
    label: string,
    overrides: Partial<CourtSuggestionItem> = {},
  ): CourtSuggestionItem => ({
    kind: 'court',
    value,
    label,
    locationCode: value,
    name: label,
    ...overrides,
  });

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent, SuggestionsHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent);
    component = fixture.componentInstance;

    // required input
    setInput('suggestions', []);
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('onInput updates search, emits searchChange, and clears committed state when needed', () => {
    const emit = jest.spyOn(component.searchChange, 'emit');

    component.onInput('  abc ');
    expect(component.searchState()).toBe('  abc ');
    expect(emit).toHaveBeenCalledWith('  abc ');
  });

  it('labelFor uses the canonical suggestion label', () => {
    expect(component.labelFor(suggestion('C1', 'C1 - Alpha Court'))).toBe(
      'C1 - Alpha Court',
    );
  });

  it('closes on focus leaving without selecting a typed value', () => {
    const item = suggestion('A1', 'A1 - Alpha Court');
    setInput('suggestions', [item]);
    component.onFocus();
    component.onInput(item.label);
    const emit = jest.spyOn(component.selectItem, 'emit');
    const autocomplete = document.createElement('div');

    component.onFocusOut({
      currentTarget: autocomplete,
      relatedTarget: document.body,
    } as unknown as FocusEvent);

    expect(emit).not.toHaveBeenCalled();
    expect(component.searchState()).toBe(item.label);
    expect(component.popupVisible).toBe(false);
  });

  it.each([
    suggestion('A1', 'A1 - Alpha Court'),
    {
      kind: 'cja',
      value: 'C1',
      label: 'C1 - Area One',
      code: 'C1',
      description: 'Area One',
    },
    {
      kind: 'result-code',
      value: 'R1',
      label: 'R1 - Granted',
      resultCode: 'R1',
      title: 'Granted',
    },
    toActivitySuggestionItem(ActivityType.REPORT_CREATED, 'Activity'),
  ] as SuggestionsItem[])(
    'selects the sole visible $kind option with Enter, including partial input',
    (item) => {
      setInput('suggestions', [item]);
      component.onFocus();
      component.onInput(item.label.slice(0, 2));
      fixture.detectChanges();
      const input = fixture.nativeElement.querySelector(
        'input',
      ) as HTMLInputElement;
      const emit = jest.spyOn(component.selectItem, 'emit');
      const onChange = jest.fn();
      component.registerOnChange(onChange);

      const composing = new KeyboardEvent('keydown', {
        key: 'Enter',
        isComposing: true,
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(composing);
      expect(emit).not.toHaveBeenCalled();

      const firstEnter = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(firstEnter);
      expect(firstEnter.defaultPrevented).toBe(true);
      expect(emit).toHaveBeenCalledWith(item);
      expect(onChange).toHaveBeenCalledWith(item.value);
      expect(component.searchState()).toBe(item.label);
      expect(component.open).toBe(false);

      input.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'Enter',
          bubbles: true,
          cancelable: true,
        }),
      );
      expect(emit).toHaveBeenCalledTimes(1);
    },
  );

  it('does not select when multiple options are visible and none is active', () => {
    setInput('suggestions', [
      suggestion('A1', 'A1 - Alpha'),
      suggestion('A2', 'A2 - Alpha'),
    ]);
    component.onFocus();
    component.onInput('Alpha');
    const emit = jest.spyOn(component.selectItem, 'emit');
    const event = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });

    component.onKeydown(event);

    expect(event.defaultPrevented).toBe(true);
    expect(emit).not.toHaveBeenCalled();
  });

  it('selects the sole option in showAllValues mode with an empty query', () => {
    const item = suggestion('A1', 'Alpha');
    setInput('showAllValues', true);
    setInput('suggestions', [item]);
    component.onFocus();
    const emit = jest.spyOn(component.selectItem, 'emit');

    component.onKeydown(
      new KeyboardEvent('keydown', { key: 'Enter', cancelable: true }),
    );

    expect(emit).toHaveBeenCalledWith(item);
  });

  it.each(['empty', 'disabled', 'dismissed'] as const)(
    'does not select when the popup is %s',
    (scenario) => {
      setInput(
        'suggestions',
        scenario === 'empty' ? [] : [suggestion('A1', 'Alpha')],
      );
      component.onFocus();
      component.onInput('Al');
      if (scenario === 'disabled') {
        setInput('disabled', true);
      }
      if (scenario === 'dismissed') {
        component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));
      }
      const emit = jest.spyOn(component.selectItem, 'emit');
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        cancelable: true,
      });

      component.onKeydown(event);

      expect(event.defaultPrevented).toBe(false);
      expect(emit).not.toHaveBeenCalled();
    },
  );

  it('choose prevents default, emits selectItem, and commits the selected label', () => {
    setInput('suggestions', [
      suggestion('A1', 'Alpha'),
      suggestion('B1', 'Beta'),
    ]);

    const emit = jest.spyOn(component.selectItem, 'emit');

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;

    const alpha = suggestion('A1', 'Alpha');
    component.choose(alpha, ev);

    expect(
      (ev as unknown as { preventDefault: jest.Mock }).preventDefault,
    ).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(alpha);

    expect(component.searchState()).toBe('Alpha');
    expect(component.isCommittedText).toBe(true);
    expect(component.open).toBe(false);
  });

  it('moves the active option with arrow keys and selects it with Enter', () => {
    setInput('id', 'court');
    const alpha = suggestion('A1', 'Alpha');
    const beta = suggestion('B1', 'Beta');
    setInput('suggestions', [alpha, beta]);
    component.onFocus();
    component.onInput('alp');
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    const emit = jest.spyOn(component.selectItem, 'emit');
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(0);
    expect(input.getAttribute('aria-activedescendant')).toBe(
      'court-listbox-option-0',
    );
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowDown',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(1);
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'ArrowUp',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();
    expect(component.activeIndex()).toBe(0);
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );
    fixture.detectChanges();

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(alpha);
    expect(component.searchState()).toBe(alpha.label);
    expect(component.open).toBe(false);
  });

  it('starts ArrowUp at the last option and stops at the menu boundaries', () => {
    setInput('suggestions', [
      suggestion('A1', 'Alpha'),
      suggestion('B1', 'Beta'),
    ]);
    component.onFocus();
    component.onInput('a');

    const pressArrow = (key: 'ArrowUp' | 'ArrowDown') =>
      component.onKeydown(new KeyboardEvent('keydown', { key }));

    pressArrow('ArrowUp');
    expect(component.activeIndex()).toBe(1);
    pressArrow('ArrowDown');
    expect(component.activeIndex()).toBe(1);
    pressArrow('ArrowUp');
    expect(component.activeIndex()).toBe(0);
    pressArrow('ArrowUp');
    expect(component.activeIndex()).toBe(0);
  });

  it('selects a clicked option without moving focus away from the input', () => {
    const alpha = suggestion('A1', 'Alpha');
    setInput('suggestions', [alpha]);
    component.onFocus();
    component.onInput('partial');
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector(
      '[role="option"]',
    ) as HTMLElement;
    const emit = jest.spyOn(component.selectItem, 'emit');
    option.dispatchEvent(
      new MouseEvent('mousedown', { bubbles: true, cancelable: true }),
    );
    option.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
    fixture.detectChanges();

    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(alpha);
    expect(component.searchState()).toBe(alpha.label);
    expect(component.open).toBe(false);
  });

  it('uses the same Enter handler if an option receives keyboard focus', () => {
    const alpha = suggestion('A1', 'Alpha');
    setInput('suggestions', [alpha]);
    component.onFocus();
    component.onInput('Al');
    fixture.detectChanges();

    const option = fixture.nativeElement.querySelector(
      '[role="option"]',
    ) as HTMLElement;
    const emit = jest.spyOn(component.selectItem, 'emit');
    expect(option.tabIndex).toBe(-1);
    option.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(emit).toHaveBeenCalledWith(alpha);
  });

  it('choose clears search text when showAllValues is enabled', () => {
    setInput('showAllValues', true);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);
    component.onInput('alp');

    const emit = jest.spyOn(component.searchChange, 'emit');

    component.choose(suggestion('A1', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(component.searchState()).toBe('');
    expect(component.isCommittedText).toBe(false);
    expect(emit).toHaveBeenCalledWith('');
  });

  it('hasQuery is true only when search has non-whitespace content', () => {
    component.searchState.set('');
    expect(component.hasQuery).toBe(false);

    component.searchState.set('   ');
    expect(component.hasQuery).toBe(false);

    component.searchState.set(' a ');
    expect(component.hasQuery).toBe(true);
  });

  it('open is false when disabled', () => {
    setInput('disabled', true);
    component.onInput('abc');
    setInput('suggestions', [suggestion('N1', 'N')]);
    expect(component.open).toBe(false);
  });

  it('open is false when search is empty/whitespace', () => {
    setInput('disabled', false);
    setInput('suggestions', [suggestion('N1', 'N')]);

    component.searchState.set('');
    expect(component.open).toBe(false);

    component.searchState.set('   ');
    expect(component.open).toBe(false);
  });

  it('open is true on focus when showAllValues is enabled and search is empty', () => {
    setInput('disabled', false);
    setInput('showAllValues', true);
    setInput('suggestions', [
      suggestion('A1', 'Alpha'),
      suggestion('B1', 'Beta'),
    ]);

    component.onFocus();

    expect(component.open).toBe(true);
    expect(component.visibleSuggestions).toEqual([
      suggestion('A1', 'Alpha'),
      suggestion('B1', 'Beta'),
    ]);
  });

  it('showAllValues filters visible suggestions by label when search has text', () => {
    setInput('showAllValues', true);
    setInput('suggestions', [
      suggestion('A1', 'Alpha'),
      suggestion('B1', 'Beta'),
    ]);

    component.onFocus();
    component.onInput('bet');

    expect(component.open).toBe(true);
    expect(component.visibleSuggestions).toEqual([suggestion('B1', 'Beta')]);
  });

  it('open is false when suggestions is empty', () => {
    setInput('disabled', false);
    component.onInput('abc');
    setInput('suggestions', []);
    expect(component.open).toBe(false);
  });

  it('open is false when committed text matches search', () => {
    setInput('disabled', false);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);
    setInput('search', 'Alpha');

    expect(component.isCommittedText).toBe(true);
    expect(component.open).toBe(false);
  });

  it('open is true when enabled, search has text, suggestions exist, and text is not committed', () => {
    setInput('disabled', false);
    component.onInput('abc');
    setInput('suggestions', [suggestion('A1', 'Ok')]);
    expect(component.open).toBe(true);
  });

  it('renders suggestions with combobox and listbox semantics', () => {
    setInput('id', 'court');
    setInput('showAllValues', true);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);

    component.onFocus();
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector(
      'input#court',
    ) as HTMLInputElement;
    const listbox = fixture.nativeElement.querySelector(
      'div#court-listbox',
    ) as HTMLDivElement;
    const option = fixture.nativeElement.querySelector(
      '[role="option"]',
    ) as HTMLElement;

    expect(input.getAttribute('role')).toBe('combobox');
    expect(input.getAttribute('aria-autocomplete')).toBe('list');
    expect(input.getAttribute('aria-haspopup')).toBe('listbox');
    expect(input.getAttribute('aria-expanded')).toBe('true');
    expect(input.getAttribute('aria-controls')).toBe('court-listbox');
    expect(listbox).toBeTruthy();
    expect(listbox.getAttribute('role')).toBe('listbox');
    expect(option.getAttribute('role')).toBe('option');
    expect(option.getAttribute('aria-selected')).toBe('false');
  });

  it('closes the popup when focus moves to another page control without selecting', () => {
    setInput('id', 'activity');
    setInput('showAllValues', true);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);
    component.onFocus();
    fixture.detectChanges();

    const autocomplete = fixture.nativeElement.querySelector(
      '.app-autocomplete',
    ) as HTMLElement;
    const nextControl = document.createElement('button');

    component.onFocusOut({
      currentTarget: autocomplete,
      relatedTarget: nextControl,
    } as unknown as FocusEvent);

    expect(component.popupVisible).toBe(false);
  });

  it('renders no results as a polite live region', () => {
    setInput('id', 'court');
    component.onInput('missing');
    component.onFocus();
    fixture.detectChanges();

    const status = fixture.nativeElement.querySelector(
      '#court-status',
    ) as HTMLElement;

    expect(status.textContent?.trim()).toBe('No results found');
    expect(status.getAttribute('aria-live')).toBe('polite');
    expect(status.tagName).toBe('OUTPUT');
    expect(status.classList.contains('app-autocomplete__link')).toBe(true);
    expect(status.parentElement?.parentElement?.classList).toContain(
      'app-autocomplete__menu',
    );
  });

  it('onKeydown opens all values for ArrowDown and Enter when enabled', () => {
    setInput('showAllValues', true);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);
    setInput('disabled', false);
    component.onFocus();

    component.onKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(component.open).toBe(true);
    expect(component.activeIndex()).toBe(0);

    const enter = new KeyboardEvent('keydown', {
      key: 'Enter',
      cancelable: true,
    });
    component.onKeydown(enter);
    expect(enter.defaultPrevented).toBe(true);
    expect(component.open).toBe(false);
  });

  it('closes an open popup when Escape is pressed', () => {
    setInput('showAllValues', true);
    setInput('suggestions', [suggestion('A1', 'Alpha')]);
    component.onFocus();

    expect(component.popupVisible).toBe(true);
    component.onInput('keep this text');

    component.onKeydown(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(component.popupVisible).toBe(false);
    expect(component.searchState()).toBe('keep this text');
  });

  it('noResultsVisible is true when focused + hasQuery + suggestions empty + not committed + not justSelected + not disabled', () => {
    setInput('disabled', false);
    setInput('suggestions', []);
    component.onInput('abc');

    component.onFocus();
    expect(component.noResultsVisible).toBe(true);
  });

  it('noResultsVisible is false when disabled', () => {
    setInput('disabled', true);
    setInput('suggestions', []);
    component.onInput('abc');

    component.onFocus();
    expect(component.noResultsVisible).toBe(false);
  });

  it('noResultsVisible is false when search is committed (programmatic hydrate)', () => {
    setInput('disabled', false);
    setInput('suggestions', []);
    setInput('search', 'Hydrated Value');
    component.onFocus();

    expect(component.isCommittedText).toBe(true);
    expect(component.noResultsVisible).toBe(false);
  });

  it('ngOnChanges: when not focused and parent sets non-empty search, it becomes committed', () => {
    setInput('search', '  Programmatic  ');
    expect(component.isCommittedText).toBe(true);
  });

  it('ngOnChanges: when parent clears search, committed state is cleared', () => {
    // First: commit a value
    setInput('search', 'Alpha');
    expect(component.isCommittedText).toBe(true);

    // Then: external clear
    setInput('search', '   ');
    expect(component.isCommittedText).toBe(false);
  });

  it('onBlur marks focused false asynchronously', () => {
    component.onFocus();
    jest.useFakeTimers();
    expect(component.noResultsVisible).toBe(false);

    component.onInput('abc');
    setInput('suggestions', []);
    expect(component.noResultsVisible).toBe(true);

    component.onBlur();

    expect(component.noResultsVisible).toBe(true);

    jest.runOnlyPendingTimers?.();
  });

  it('writeValue displays the matching suggestion label when value is non-empty', () => {
    setInput('suggestions', [suggestion('V1', 'V1 - Alpha')]);

    component.writeValue('V1');
    fixture.detectChanges();

    expect(component.searchState()).toBe('V1 - Alpha');
    expect(component.isCommittedText).toBe(true);
    expect(component.visibleSuggestions).toEqual([
      suggestion('V1', 'V1 - Alpha'),
    ]);
  });

  it('writeValue(null) clears search and committed state without clearing parent suggestions', () => {
    component.onInput('abc');
    setInput('suggestions', [suggestion('A1', 'Alpha')]);

    // simulate committed state
    component.choose(suggestion('A1', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    component.writeValue(null);

    expect(component.searchState()).toBe('');
    expect(component.isCommittedText).toBe(false);
    expect(component.visibleSuggestions).toEqual([suggestion('A1', 'Alpha')]);
  });

  it('writeValue does not replace a committed parent search label when matching suggestions are absent', () => {
    setInput('search', 'A1 - Alpha');

    component.writeValue('A1');
    fixture.detectChanges();

    expect(component.searchState()).toBe('A1 - Alpha');
    expect(component.isCommittedText).toBe(true);
  });

  it('registerOnChange is invoked when value changes via choose()', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.choose(suggestion('A1', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(onChange).toHaveBeenCalledWith('A1');
  });

  it('registerOnTouched is invoked when choose() is called', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    component.choose(suggestion('A1', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('registerOnTouched is invoked when the input blurs', () => {
    jest.useFakeTimers();
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    component.onFocus();
    component.onBlur();
    jest.runOnlyPendingTimers();

    expect(onTouched).toHaveBeenCalledTimes(1);

    jest.useRealTimers();
  });

  it('setDisabledState updates disabled flag', () => {
    component.setDisabledState(true);
    expect(component.disabledState()).toBe(true);

    component.setDisabledState(false);
    expect(component.disabledState()).toBe(false);
  });

  it('keeps the field disabled when either the input or form control disables it', () => {
    component.setDisabledState(true);
    setInput('disabled', false);

    expect(component.disabledState()).toBe(true);

    component.setDisabledState(false);
    setInput('disabled', true);

    expect(component.disabledState()).toBe(true);
  });

  it('reflects reactive form disabled changes in the input', () => {
    const hostFixture = TestBed.createComponent(SuggestionsHostComponent);
    hostFixture.detectChanges();

    hostFixture.componentInstance.control.disable();
    hostFixture.detectChanges();

    expect(
      (
        hostFixture.nativeElement.querySelector(
          'input#host-suggestions',
        ) as HTMLInputElement
      ).disabled,
    ).toBe(true);
  });

  it('reflects reactive form value writes in the input display', () => {
    const hostFixture = TestBed.createComponent(SuggestionsHostComponent);
    hostFixture.componentInstance.suggestions = [
      suggestion('A1', 'A1 - Alpha'),
      suggestion('B1', 'B1 - Beta'),
    ];
    hostFixture.detectChanges();

    hostFixture.componentInstance.control.setValue('B1');
    hostFixture.detectChanges();

    expect(
      (
        hostFixture.nativeElement.querySelector(
          'input#host-suggestions',
        ) as HTMLInputElement
      ).value,
    ).toBe('B1 - Beta');
  });

  it('choose sets value based on item.value when present', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.choose(suggestion('V123', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(onChange).toHaveBeenCalledWith('V123');
  });

  it('choose sets value based on item.locationCode when value is missing', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.choose(
      suggestion('', 'Loc', { locationCode: 'LC9', value: 'LC9' }),
      {
        preventDefault: jest.fn(),
      } as unknown as MouseEvent,
    );

    expect(onChange).toHaveBeenCalledWith('LC9');
  });

  it('onInput clears committed label when text differs, enabling dropdown to open again', () => {
    const alpha = suggestion('A', 'Alpha');

    // commit "Alpha"
    component.choose(alpha, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    // user types something else => committedLabel should be cleared internally
    component.onInput('Alp');

    // not committed anymore
    expect(component.isCommittedText).toBe(false);

    // with suggestions, dropdown can open
    setInput('disabled', false);
    setInput('suggestions', [alpha]);
    expect(component.open).toBe(true);
  });

  it('ngOnChanges does not auto-commit while focused', () => {
    component.onFocus();

    // since focused, component should NOT set committedLabel, so not committed
    setInput('search', 'Programmatic');
    expect(component.isCommittedText).toBe(false);
  });

  it('onBlur clears focused after timers run (noResultsVisible becomes false)', () => {
    jest.useFakeTimers();

    setInput('disabled', false);
    setInput('suggestions', []);
    component.onInput('abc');

    component.onFocus();
    expect(component.noResultsVisible).toBe(true);

    component.onBlur();
    jest.runOnlyPendingTimers();

    expect(component.noResultsVisible).toBe(false);

    jest.useRealTimers();
  });
});
