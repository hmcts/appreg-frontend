import { FormBuilder, NonNullableFormBuilder } from '@angular/forms';

import { SearchBoxComponent } from '../../../../../../src/app/shared/components/search-box/search-box.component';

describe('SearchBoxComponent (class tests)', () => {
  let fb: NonNullableFormBuilder;
  let comp: SearchBoxComponent;

  beforeEach(() => {
    fb = new FormBuilder().nonNullable;
    comp = new SearchBoxComponent(fb);
  });

  it('initializes with an empty search control', () => {
    expect(comp.form.controls.search.value).toBe('');
  });

  it('emits valueChange whenever the search control changes', () => {
    const spy = jest.fn();
    const sub = comp.valueChange.subscribe(spy);

    comp.form.controls.search.setValue('alpha');
    comp.form.controls.search.setValue('beta');

    expect(spy).toHaveBeenNthCalledWith(1, 'alpha');
    expect(spy).toHaveBeenNthCalledWith(2, 'beta');

    sub.unsubscribe();
  });

  it('onSubmit emits submitted with the current search value', () => {
    const spy = jest.fn();
    const sub = comp.submitted.subscribe(spy);

    comp.form.controls.search.setValue('final term');
    comp.onSubmit();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('final term');

    sub.unsubscribe();
  });

  it('computedId uses inputId when provided; otherwise uses a stable generated id', () => {
    // default: generated id
    const id1 = comp.computedId;
    const id2 = comp.computedId; // stable across calls
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^search-/); // generated prefix

    // when inputId is set, it takes precedence
    comp.inputId = 'custom-id';
    expect(comp.computedId).toBe('custom-id');
  });

  it('hintId appends "-hint" to computedId', () => {
    comp.inputId = 'base-id';
    expect(comp.hintId).toBe('base-id-hint');
  });

  it('ariaDescribedByAttr prefers explicit ariaDescribedBy when set', () => {
    comp.inputId = 'x';
    comp.ariaDescribedBy = 'a b';
    expect(comp.ariaDescribedByAttr).toBe('a b');
  });

  it('ariaDescribedByAttr falls back to hintId when hint text is present', () => {
    comp.inputId = 'field-1';
    comp.ariaDescribedBy = undefined; // not provided
    comp.hint = 'Some hint';
    expect(comp.ariaDescribedByAttr).toBe('field-1-hint');
  });

  it('ariaDescribedByAttr returns null when neither ariaDescribedBy nor hint are present', () => {
    comp.ariaDescribedBy = undefined;
    comp.hint = ''; // no hint content
    expect(comp.ariaDescribedByAttr).toBeNull();
  });
});
