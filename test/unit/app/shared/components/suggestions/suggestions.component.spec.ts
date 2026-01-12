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
});
