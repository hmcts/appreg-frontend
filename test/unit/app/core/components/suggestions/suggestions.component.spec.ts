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

  it('writeValue clears search, committed state, justSelected, and suggestions when value is null', () => {
    component.search = 'abc';
    component.suggestions = [{ name: 'Alpha' }];

    component.ngOnChanges({
      search: new SimpleChange('', 'abc', false),
    });
    expect(component.isCommittedText).toBe(true);

    component.writeValue(null);

    expect(component.value).toBe('');
    expect(component.search).toBe('');
    expect(component.suggestions).toEqual([]);
    expect(component.isCommittedText).toBe(false);
  });

  it('registerOnChange stores callback and it is called via setValueInternal (choose)', () => {
    const onChange = jest.fn();
    component.registerOnChange(onChange);

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;
    component.choose({ code: 'C1', name: 'Alpha' }, ev);

    expect(onChange).toHaveBeenCalledWith('C1');
  });

  it('registerOnTouched stores callback and it is called on choose', () => {
    const onTouched = jest.fn();
    component.registerOnTouched(onTouched);

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;
    component.choose({ name: 'Alpha' }, ev);

    expect(onTouched).toHaveBeenCalled();
  });

  it('onInput clears committedLabel and justSelected when input no longer matches committed text', () => {
    component.search = 'Alpha';
    component.ngOnChanges({
      search: new SimpleChange('', 'Alpha', false),
    });
    component.search = 'Alpha';

    expect(component.isCommittedText).toBe(true);

    component.onInput('Beta');

    expect(component.isCommittedText).toBe(false);
  });

  it('onInput with whitespace clears value via CVA + emits valueChange', () => {
    const onChange = jest.fn();
    const emit = jest.spyOn(component.valueChange, 'emit');

    component.registerOnChange(onChange);
    component.search = 'abc';

    component.onInput('   ');

    expect(component.value).toBe('');
    expect(emit).toHaveBeenCalledWith('');
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('choose emits valueChange and uses item.code when present', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;
    component.choose({ name: 'Alpha', code: 'A1' }, ev);

    expect(component.value).toBe('A1');
    expect(emit).toHaveBeenCalledWith('A1');
  });

  it('choose falls back to label when item has no code', () => {
    const emit = jest.spyOn(component.valueChange, 'emit');

    const ev = { preventDefault: jest.fn() } as unknown as MouseEvent;
    component.choose({ name: 'Alpha' }, ev);

    expect(component.value).toBe('Alpha');
    expect(emit).toHaveBeenCalledWith('Alpha');
  });

  it('ngOnChanges returns early when asString(search) is null', () => {
    component.search = 'abc';

    component.ngOnChanges({
      search: new SimpleChange('abc', null, false),
    });

    expect(component.isCommittedText).toBe(false);
  });

  it('ngOnChanges does not commit when focused', () => {
    component.onFocus();

    component.ngOnChanges({
      search: new SimpleChange('', 'Alpha', false),
    });
    component.search = 'Alpha';

    expect(component.isCommittedText).toBe(false);
  });

  it('onBlur clears focused asynchronously (observable via noResultsVisible)', () => {
    jest.useFakeTimers();

    component.search = 'abc';
    component.suggestions = [];
    component.onFocus();

    expect(component.noResultsVisible).toBe(true);

    component.onBlur();
    jest.runOnlyPendingTimers();

    expect(component.noResultsVisible).toBe(false);
  });
});
