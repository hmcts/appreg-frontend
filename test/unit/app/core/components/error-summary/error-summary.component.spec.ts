import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';

describe('ErrorSummaryComponent (external template)', () => {
  let fixture: ComponentFixture<ErrorSummaryComponent>;
  let comp: ErrorSummaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorSummaryComponent],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(ErrorSummaryComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('renders external hrefs and local targetId fallback links', () => {
    fixture.componentRef.setInput('items', [
      { text: 'External', href: '/somewhere' },
      { text: 'Fallback' },
    ]);
    fixture.componentRef.setInput('targetId', 'sortable-table');
    fixture.detectChanges();
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links[0].getAttribute('href')).toBe('/somewhere');
    expect(links[1].getAttribute('href')).toBe('#sortable-table');
  });

  it('renders plain text without a navigation target', () => {
    fixture.componentRef.setInput('items', [{ text: 'No target' }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No target');
  });

  it('focuses on initial render and again for changed items or submit cycles', () => {
    jest.useFakeTimers();
    const items = [{ text: 'Error', id: 'field' }];
    fixture.componentRef.setInput('items', items);
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.govuk-error-summary');
    const focus = jest.spyOn(summary, 'focus');
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('items', [...items]);
    fixture.detectChanges();
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('focusKey', 1);
    fixture.detectChanges();
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(2);

    fixture.componentRef.setInput('items', [{ text: 'Changed error' }]);
    fixture.detectChanges();
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(3);

    fixture.componentRef.setInput('items', []);
    fixture.detectChanges();
    fixture.componentRef.setInput('items', [{ text: 'Changed error' }]);
    fixture.detectChanges();
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(4);
  });

  it('focuses when errors arrive after initial render', () => {
    jest.useFakeTimers();
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.govuk-error-summary');
    const focus = jest.spyOn(summary, 'focus');
    fixture.componentRef.setInput('items', [{ text: 'Late error' }]);
    fixture.detectChanges();
    jest.runAllTimers();
    expect(focus).toHaveBeenCalledTimes(1);
  });

  it('does not autofocus when disabled, including subsequent GOV.UK initialisation', () => {
    jest.useFakeTimers();
    fixture.componentRef.setInput('items', [{ text: 'Error' }]);
    fixture.componentRef.setInput('autoFocus', false);
    fixture.detectChanges();
    const summary = fixture.nativeElement.querySelector('.govuk-error-summary');
    const focus = jest.spyOn(summary, 'focus');
    jest.runAllTimers();
    expect(focus).not.toHaveBeenCalled();
    expect(summary.getAttribute('data-disable-auto-focus')).toBe('true');
  });

  it.each([
    [{ text: 'Error', href: '#field' }, undefined],
    [{ text: 'Error', id: 'field' }, undefined],
    [{ text: 'Error' }, 'field'],
  ] satisfies [ErrorItem, string | undefined][])(
    'focuses local target once without router navigation: %j',
    (item, targetId) => {
      fixture.componentRef.setInput('items', [item]);
      fixture.componentRef.setInput('targetId', targetId);
      fixture.componentRef.setInput('autoFocus', false);
      fixture.detectChanges();
      document.body.appendChild(fixture.nativeElement);
      const input = document.createElement('input');
      input.id = 'field';
      document.body.appendChild(input);
      const focus = jest.spyOn(input, 'focus');
      const navigate = jest.spyOn(TestBed.inject(Router), 'navigateByUrl');
      const delegatedClick = jest.fn();
      fixture.nativeElement.addEventListener('click', delegatedClick);
      const handler = jest.fn();
      comp.itemSelect.subscribe(handler);
      const link = fixture.nativeElement.querySelector('a');
      expect(link.getAttribute('href')).toBe('#field');
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      });
      link.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
      expect(document.activeElement).toBe(input);
      expect(focus).toHaveBeenCalledTimes(1);
      expect(handler).toHaveBeenCalledWith(item);
      expect(navigate).not.toHaveBeenCalled();
      expect(delegatedClick).not.toHaveBeenCalled();
      link.click();
      expect(document.activeElement).toBe(input);
      expect(focus).toHaveBeenCalledTimes(2);
    },
  );

  it('preserves non-fragment navigation and custom itemSelect handlers', () => {
    const item = { text: 'External', href: '/somewhere' };
    fixture.componentRef.setInput('items', [item]);
    fixture.componentRef.setInput('targetId', 'field');
    fixture.detectChanges();
    const handler = jest.fn();
    comp.itemSelect.subscribe(handler);
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    fixture.nativeElement.querySelector('a').dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
    expect(handler).toHaveBeenCalledWith(item);
    expect(comp.fragmentTarget(item)).toBeUndefined();
  });
});
