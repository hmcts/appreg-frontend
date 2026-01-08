import { ComponentFixture, TestBed } from '@angular/core/testing';
import { jest } from '@jest/globals';

import { SuggestionsComponent } from '@components/suggestions/suggestions.component';

type Item = { name?: string; description?: string; code?: string };
const toItem = (v: unknown) => v as Item;

describe('SuggestionsComponent', () => {
  let fixture: ComponentFixture<SuggestionsComponent<Item>>;
  let component: SuggestionsComponent<Item>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SuggestionsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SuggestionsComponent<Item>);
    component = fixture.componentInstance;
  });

  it('onInput updates search and emits searchChange', () => {
    const emit = jest.spyOn(component.searchChange, 'emit');
    component.onInput('  abc ');
    expect(component.search).toBe('  abc ');
    expect(emit).toHaveBeenCalledWith('  abc ');
  });

  it('labelFor uses getItemLabel when provided', () => {
    component.getItemLabel = (it: Item) => `X:${it.code}`;
    const res = component.labelFor({ code: 'C1' });
    expect(res).toBe('X:C1');
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
    expect(component.labelOf(toItem(null))).toBe('');
    expect(component.labelOf(toItem('s'))).toBe('s');
    expect(component.labelOf(toItem({ name: 'N' }))).toBe('N');
    expect(component.labelOf(toItem({ description: 'D' }))).toBe('D');
    expect(component.labelOf(toItem({ code: 'C' }))).toBe('C');
    expect(component.labelOf(toItem(7))).toBe(''); // numbers -> ''
  });

  it('choose prevents default and emits selectItem', () => {
    const item: Item = { code: 'Z1' };
    const emit = jest.spyOn(component.selectItem, 'emit');

    const ev = { preventDefault: jest.fn() };
    const prevent = jest.spyOn(ev, 'preventDefault');

    component.choose(item, ev as unknown as Event);
    expect(prevent).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(item);
  });

  it('open is false when disabled', () => {
    component.disabled = true;
    component.search = 'abc';
    component.suggestions = [{ name: 'N' }];
    expect(component.open).toBe(false);
  });

  it('open is false when search is empty or whitespace', () => {
    component.disabled = false;
    component.suggestions = [{ name: 'N' }];
    component.search = '';
    expect(component.open).toBe(false);
    component.search = '   ';
    expect(component.open).toBe(false);
  });

  const setSuggestions = (v: Item[] | undefined) =>
    ((component as unknown as { suggestions: Item[] | undefined }).suggestions =
      v);

  it('open is false when suggestions missing or empty', () => {
    component.disabled = false;
    component.search = 'abc';

    setSuggestions(undefined);
    expect(component.open).toBe(false);

    setSuggestions([]);
    expect(component.open).toBe(false);
  });

  it('open is true when enabled, search has text, and suggestions exist', () => {
    component.disabled = false;
    component.search = 'abc';
    component.suggestions = [{ description: 'Ok' }];
    expect(component.open).toBe(true);
  });
});
