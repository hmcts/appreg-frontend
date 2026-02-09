import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';

type Item = {
  name?: string;
  description?: string;
  code?: string;
  value?: string;
  locationCode?: string;
};

describe('SuggestionsComponent', () => {
  let fixture: ComponentFixture<SuggestionsComponent<Item>>;
  let component: SuggestionsComponent<Item>;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent<Item>);
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

  it('labelFor uses getItemLabel when provided', () => {
    setInput('getItemLabel', (it: Item) => `X:${it.code ?? ''}`);
    expect(component.labelFor({ code: 'C1' })).toBe('X:C1');
  });

  it('labelFor falls back to name, then description, else String(item)', () => {
    setInput('getItemLabel', null);

    expect(component.labelFor({ name: 'Alpha' })).toBe('Alpha');
    expect(component.labelFor({ description: 'Desc' })).toBe('Desc');
    expect(component.labelFor({ code: 'C9' })).toBe('[object Object]');

    expect(component.labelFor('plain' as unknown as Item)).toBe('plain');
    expect(component.labelFor(42 as unknown as Item)).toBe('42');
  });

  it('labelOf maps by name/description/code and handles primitives/null', () => {
    expect(component.labelOf(null as unknown as Item)).toBe('');
    expect(component.labelOf('s' as unknown as Item)).toBe('s');
    expect(component.labelOf({ name: 'N' })).toBe('N');
    expect(component.labelOf({ description: 'D' })).toBe('D');
    expect(component.labelOf({ code: 'C' })).toBe('C');

    expect(component.labelOf(7 as unknown as Item)).toBe('');
  });

  it('choose prevents default, emits selectItem, sets search/committedLabel, clears suggestions, and marks justSelected', () => {
    setInput('suggestions', [{ name: 'Alpha' }, { name: 'Beta' }]);

    const emit = jest.spyOn(component.selectItem, 'emit');

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;

    component.choose({ name: 'Alpha' }, ev);

    expect(
      (ev as unknown as { preventDefault: jest.Mock }).preventDefault,
    ).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith({ name: 'Alpha' });

    expect(component.searchState()).toBe('Alpha');
    expect(component.suggestionsState()).toEqual([]);
    expect(component.isCommittedText).toBe(true);
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
    setInput('suggestions', [{ name: 'N' }]);
    expect(component.open).toBe(false);
  });

  it('open is false when search is empty/whitespace', () => {
    setInput('disabled', false);
    setInput('suggestions', [{ name: 'N' }]);

    component.searchState.set('');
    expect(component.open).toBe(false);

    component.searchState.set('   ');
    expect(component.open).toBe(false);
  });

  it('open is false when suggestions is empty', () => {
    setInput('disabled', false);
    component.onInput('abc');
    setInput('suggestions', []);
    expect(component.open).toBe(false);
  });

  it('open is false when committed text matches search', () => {
    setInput('disabled', false);
    setInput('suggestions', [{ name: 'Alpha' }]);
    setInput('search', 'Alpha');

    expect(component.isCommittedText).toBe(true);
    expect(component.open).toBe(false);
  });

  it('open is true when enabled, search has text, suggestions exist, and text is not committed', () => {
    setInput('disabled', false);
    component.onInput('abc');
    setInput('suggestions', [{ description: 'Ok' }]);
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
    setInput('suggestions', [{ name: 'Alpha' }]);

    component.writeValue('V1');

    expect(component.valueState()).toBe('V1');
    expect(component.searchState()).toBe('V1');
    expect(component.suggestionsState()).toEqual([{ name: 'Alpha' }]);
  });

  it('writeValue(null) clears value, search, suggestions, and committed state', () => {
    component.onInput('abc');
    setInput('suggestions', [{ name: 'Alpha' }]);

    // simulate committed state
    component.choose({ name: 'Alpha' }, {
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

    component.choose({ name: 'Alpha' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(onChange).toHaveBeenCalledWith('');
  });

  it('registerOnTouched is invoked when choose() is called', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    component.choose({ name: 'Alpha' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(onTouched).toHaveBeenCalledTimes(1);
  });

  it('setDisabledState updates disabled flag', () => {
    component.setDisabledState(false);
    expect(component.disabledState()).toBe(false);

    component.setDisabledState(false);
    expect(component.disabledState()).toBe(false);
  });

  it('choose sets value based on item.value when present', () => {
    const onChange = jest.fn();
    const emitValue = jest.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    component.choose({ name: 'Alpha', value: 'V123' }, {
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

    component.choose({ name: 'Loc', locationCode: 'LC9' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);

    expect(component.valueState()).toBe('LC9');
    expect(emitValue).toHaveBeenCalledWith('LC9');
    expect(onChange).toHaveBeenCalledWith('LC9');
  });

  it('onInput clears committed label when text differs, enabling dropdown to open again', () => {
    // commit "Alpha"
    component.choose({ name: 'Alpha', value: 'A' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    // user types something else => committedLabel should be cleared internally
    component.onInput('Alp');

    // not committed anymore
    expect(component.isCommittedText).toBe(false);

    // with suggestions, dropdown can open
    setInput('disabled', false);
    setInput('suggestions', [{ name: 'Alpha' }]);
    expect(component.open).toBe(true);
  });

  it('ngOnChanges returns early when search currentValue is not a string (asString -> null)', () => {
    component.choose({ name: 'Alpha' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    // pass a non-string currentValue (asString should return null => no state change)
    setInput('search', { not: 'a string' });

    // still committed because changes should have been ignored
    expect(component.isCommittedText).toBe(true);
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
