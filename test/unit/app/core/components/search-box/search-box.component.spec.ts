import { TestBed } from '@angular/core/testing';

import { SearchBoxComponent } from '@components/search-box/search-box.component';

describe('SearchBoxComponent (class tests)', () => {
  let comp: SearchBoxComponent;
  let fixture: ReturnType<typeof TestBed.createComponent<SearchBoxComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SearchBoxComponent],
    });
    fixture = TestBed.createComponent(SearchBoxComponent);
    comp = fixture.componentInstance;
  });

  it('initializes with an empty search control', () => {
    expect(comp.form.controls.search.value).toBe('');
  });

  it('emits valueChange whenever the search control changes', () => {
    const spy = jest.fn();
    const sub = comp.valueChange.subscribe(spy);
    fixture.detectChanges();

    comp.form.controls.search.setValue('alpha');
    fixture.detectChanges();
    comp.form.controls.search.setValue('beta');
    fixture.detectChanges();

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
    fixture.componentRef.setInput('inputId', 'custom-id');
    fixture.detectChanges();
    expect(comp.computedId).toBe('custom-id');
  });

  it('hintId appends "-hint" to computedId', () => {
    fixture.componentRef.setInput('inputId', 'base-id');
    fixture.detectChanges();
    expect(comp.hintId).toBe('base-id-hint');
  });

  it('ariaDescribedByAttr prefers explicit ariaDescribedBy when set', () => {
    fixture.componentRef.setInput('inputId', 'x');
    fixture.componentRef.setInput('ariaDescribedBy', 'a b');
    fixture.detectChanges();
    expect(comp.ariaDescribedByAttr).toBe('a b');
  });

  it('ariaDescribedByAttr falls back to hintId when hint text is present', () => {
    fixture.componentRef.setInput('inputId', 'field-1');
    fixture.componentRef.setInput('ariaDescribedBy', undefined); // not provided
    fixture.componentRef.setInput('hint', 'Some hint');
    fixture.detectChanges();
    expect(comp.ariaDescribedByAttr).toBe('field-1-hint');
  });

  it('ariaDescribedByAttr returns null when neither ariaDescribedBy nor hint are present', () => {
    fixture.componentRef.setInput('ariaDescribedBy', undefined);
    fixture.componentRef.setInput('hint', ''); // no hint content
    fixture.detectChanges();
    expect(comp.ariaDescribedByAttr).toBeNull();
  });
});
