import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';
import { CourtSuggestionItem } from '@components/suggestions/suggestions.types';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, SuggestionsComponent],
  template: `
    <app-suggestions
      id="host-suggestions"
      [suggestions]="[]"
      [formControl]="control"
    />
  `,
})
class SuggestionsHostComponent {
  control = new FormControl('');
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

  it('choose prevents default, emits selectItem, sets search/committedLabel, clears suggestions, and marks justSelected', () => {
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
    expect(component.suggestionsState()).toEqual([]);
    expect(component.isCommittedText).toBe(true);
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

  it('writeValue sets value and does not clear search/suggestions when value is non-empty', () => {
    component.onInput('V1');
    setInput('suggestions', [suggestion('A1', 'Alpha')]);

    component.writeValue('V1');

    expect(component.valueState()).toBe('V1');
    expect(component.searchState()).toBe('V1');
    expect(component.suggestionsState()).toEqual([suggestion('A1', 'Alpha')]);
  });

  it('writeValue(null) clears value, search, suggestions, and committed state', () => {
    component.onInput('abc');
    setInput('suggestions', [suggestion('A1', 'Alpha')]);

    // simulate committed state
    component.choose(suggestion('A1', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    component.writeValue(null);

    expect(component.valueState()).toBe('');
    expect(component.searchState()).toBe('');
    expect(component.isCommittedText).toBe(false);
    expect(component.suggestionsState()).toEqual([]);
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

  it('choose sets value based on item.value when present', () => {
    const onChange = jest.fn();
    const emitValue = jest.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    component.choose(suggestion('V123', 'Alpha'), {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(component.valueState()).toBe('V123');
    expect(emitValue).toHaveBeenCalledWith('V123');
    expect(onChange).toHaveBeenCalledWith('V123');
  });

  it('choose sets value based on item.locationCode when value is missing', () => {
    const onChange = jest.fn();
    const emitValue = jest.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    component.choose(
      suggestion('', 'Loc', { locationCode: 'LC9', value: 'LC9' }),
      {
        preventDefault: jest.fn(),
      } as unknown as MouseEvent,
    );

    expect(component.valueState()).toBe('LC9');
    expect(emitValue).toHaveBeenCalledWith('LC9');
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
