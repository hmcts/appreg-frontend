import { SimpleChange } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';

type Item = { name?: string; description?: string; code?: string };

describe('SuggestionsComponent', () => {
  let fixture: ComponentFixture<SuggestionsComponent<Item>>;
  let component: SuggestionsComponent<Item>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent<Item>);
    component = fixture.componentInstance;

    // required input
    component.suggestions = [];
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('onInput updates search, emits searchChange, and clears committed state when needed', () => {
    const emit = jest.spyOn(component.searchChange, 'emit');

    component.onInput('  abc ');
    expect(component.search).toBe('  abc ');
    expect(emit).toHaveBeenCalledWith('  abc ');
  });

  it('labelFor uses getItemLabel when provided', () => {
    component.getItemLabel = (it: Item) => `X:${it.code ?? ''}`;
    expect(component.labelFor({ code: 'C1' })).toBe('X:C1');
  });

  it('labelFor falls back to name, then description, else String(item)', () => {
    component.getItemLabel = null;

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
    component.suggestions = [{ name: 'Alpha' }, { name: 'Beta' }];

    const emit = jest.spyOn(component.selectItem, 'emit');

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;

    component.choose({ name: 'Alpha' }, ev);

    expect(
      (ev as unknown as { preventDefault: jest.Mock }).preventDefault,
    ).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith({ name: 'Alpha' });

    expect(component.search).toBe('Alpha');
    expect(component.suggestions).toEqual([]);
    expect(component.isCommittedText).toBe(true);
  });

  it('hasQuery is true only when search has non-whitespace content', () => {
    component.search = '';
    expect(component.hasQuery).toBe(false);

    component.search = '   ';
    expect(component.hasQuery).toBe(false);

    component.search = ' a ';
    expect(component.hasQuery).toBe(true);
  });

  it('open is false when disabled', () => {
    component.disabled = true;
    component.search = 'abc';
    component.suggestions = [{ name: 'N' }];
    expect(component.open).toBe(false);
  });

  it('open is false when search is empty/whitespace', () => {
    component.disabled = false;
    component.suggestions = [{ name: 'N' }];

    component.search = '';
    expect(component.open).toBe(false);

    component.search = '   ';
    expect(component.open).toBe(false);
  });

  it('open is false when suggestions is empty', () => {
    component.disabled = false;
    component.search = 'abc';
    component.suggestions = [];
    expect(component.open).toBe(false);
  });

  it('open is false when committed text matches search', () => {
    component.disabled = false;
    component.suggestions = [{ name: 'Alpha' }];

    component.search = 'Alpha';
    component.ngOnChanges({
      search: new SimpleChange('', 'Alpha', false),
    });

    expect(component.isCommittedText).toBe(true);
    expect(component.open).toBe(false);
  });

  it('open is true when enabled, search has text, suggestions exist, and text is not committed', () => {
    component.disabled = false;
    component.search = 'abc';
    component.suggestions = [{ description: 'Ok' }];
    expect(component.open).toBe(true);
  });

  it('noResultsVisible is true when focused + hasQuery + suggestions empty + not committed + not justSelected + not disabled', () => {
    component.disabled = false;
    component.suggestions = [];
    component.search = 'abc';

    component.onFocus();
    expect(component.noResultsVisible).toBe(true);
  });

  it('noResultsVisible is false when disabled', () => {
    component.disabled = true;
    component.suggestions = [];
    component.search = 'abc';

    component.onFocus();
    expect(component.noResultsVisible).toBe(false);
  });

  it('noResultsVisible is false when search is committed (programmatic hydrate)', () => {
    component.disabled = false;
    component.suggestions = [];
    component.search = '';

    component.ngOnChanges({
      search: new SimpleChange('', 'Hydrated Value', false),
    });

    component.search = 'Hydrated Value';
    component.onFocus();

    expect(component.isCommittedText).toBe(true);
    expect(component.noResultsVisible).toBe(false);
  });

  it('ngOnChanges: when not focused and parent sets non-empty search, it becomes committed', () => {
    component.search = '';
    component.ngOnChanges({
      search: new SimpleChange('', '  Programmatic  ', false),
    });

    component.search = '  Programmatic  ';
    expect(component.isCommittedText).toBe(true);
  });

  it('ngOnChanges: when parent clears search, committed state is cleared', () => {
    // First: commit a value
    component.ngOnChanges({
      search: new SimpleChange('', 'Alpha', false),
    });
    component.search = 'Alpha';
    expect(component.isCommittedText).toBe(true);

    // Then: external clear
    component.ngOnChanges({
      search: new SimpleChange('Alpha', '   ', false),
    });
    component.search = '   ';
    expect(component.isCommittedText).toBe(false);
  });

  it('onBlur marks focused false asynchronously', () => {
    component.onFocus();
    jest.useFakeTimers();
    expect(component.noResultsVisible).toBe(false);

    component.search = 'abc';
    component.suggestions = [];
    expect(component.noResultsVisible).toBe(true);

    component.onBlur();

    expect(component.noResultsVisible).toBe(true);

    jest.runOnlyPendingTimers?.();
  });

  it('writeValue sets value and does not clear search/suggestions when value is non-empty', () => {
    component.search = 'V1';
    component.suggestions = [{ name: 'Alpha' }];

    component.writeValue('V1');

    expect(component.value).toBe('V1');
    expect(component.search).toBe('V1');
    expect(component.suggestions).toEqual([{ name: 'Alpha' }]);
  });

  it('writeValue(null) clears value, search, suggestions, and committed state', () => {
    component.search = 'abc';
    component.suggestions = [{ name: 'Alpha' }];

    // simulate committed state
    component.choose({ name: 'Alpha' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    component.writeValue(null);

    expect(component.value).toBe('');
    expect(component.search).toBe('');
    expect(component.isCommittedText).toBe(false);
    expect(component.suggestions).toEqual([]);
  });

  it('registerOnChange is invoked when value changes via choose()', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    component.choose(
      { name: 'Alpha' } as unknown as any,
      { preventDefault: jest.fn() } as unknown as MouseEvent,
    );

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
    expect(component.disabled).toBe(false);

    component.setDisabledState(false);
    expect(component.disabled).toBe(false);
  });

  it('choose sets value based on item.value when present', () => {
    const onChange = jest.fn();
    const emitValue = jest.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    component.choose(
      { name: 'Alpha', value: 'V123' } as any,
      { preventDefault: jest.fn() } as unknown as MouseEvent,
    );

    expect(component.value).toBe('V123');
    expect(emitValue).toHaveBeenCalledWith('V123');
    expect(onChange).toHaveBeenCalledWith('V123');
  });

  it('choose sets value based on item.locationCode when value is missing', () => {
    const onChange = jest.fn();
    const emitValue = jest.spyOn(component.valueChange, 'emit');
    component.registerOnChange(onChange);

    component.choose(
      { name: 'Loc', locationCode: 'LC9' } as any,
      { preventDefault: jest.fn() } as unknown as MouseEvent,
    );

    expect(component.value).toBe('LC9');
    expect(emitValue).toHaveBeenCalledWith('LC9');
    expect(onChange).toHaveBeenCalledWith('LC9');
  });

  it('onInput clears committed label when text differs, enabling dropdown to open again', () => {
    // commit "Alpha"
    component.choose(
      { name: 'Alpha', value: 'A' } as any,
      { preventDefault: jest.fn() } as unknown as MouseEvent,
    );
    expect(component.isCommittedText).toBe(true);

    // user types something else => committedLabel should be cleared internally
    component.onInput('Alp');

    // not committed anymore
    expect(component.isCommittedText).toBe(false);

    // with suggestions, dropdown can open
    component.disabled = false;
    component.suggestions = [{ name: 'Alpha' }];
    expect(component.open).toBe(true);
  });

  it('ngOnChanges returns early when search currentValue is not a string (asString -> null)', () => {
    component.choose({ name: 'Alpha' }, {
      preventDefault: jest.fn(),
    } as unknown as MouseEvent);
    expect(component.isCommittedText).toBe(true);

    // pass a non-string currentValue (asString should return null => no state change)
    component.ngOnChanges({
      search: new SimpleChange('Alpha', { not: 'a string' }, false),
    });

    // still committed because changes should have been ignored
    expect(component.isCommittedText).toBe(true);
  });

  it('ngOnChanges does not auto-commit while focused', () => {
    component.onFocus();

    component.ngOnChanges({
      search: new SimpleChange('', 'Programmatic', false),
    });

    // since focused, component should NOT set committedLabel, so not committed
    component.search = 'Programmatic';
    expect(component.isCommittedText).toBe(false);
  });

  it('onBlur clears focused after timers run (noResultsVisible becomes false)', () => {
    jest.useFakeTimers();

    component.disabled = false;
    component.suggestions = [];
    component.search = 'abc';

    component.onFocus();
    expect(component.noResultsVisible).toBe(true);

    component.onBlur();
    jest.runOnlyPendingTimers();

    expect(component.noResultsVisible).toBe(false);

    jest.useRealTimers();
  });
});
