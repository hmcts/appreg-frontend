import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import {
  ErrorItem,
  ErrorSummaryComponent,
} from '@components/error-summary/error-summary.component';

describe('ErrorSummaryComponent (external template)', () => {
  let fixture: ComponentFixture<ErrorSummaryComponent>;
  let comp: ErrorSummaryComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorSummaryComponent], // standalone component w/ external HTML
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorSummaryComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('renders items and computes hrefs when a navigation target exists', () => {
    fixture.componentRef.setInput('items', [
      { text: 'With explicit href', href: '/somewhere' },
      { text: 'With targetId (hash)' },
    ]);
    fixture.componentRef.setInput('targetId', 'sortable-table'); // affects item[1]
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      'a.govuk-link',
    ) as NodeListOf<HTMLAnchorElement>;

    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/somewhere');
    expect(links[1].getAttribute('href')).toContain('#sortable-table');
  });

  it('renders plain text when an item has no navigation target', () => {
    fixture.componentRef.setInput('items', [{ text: 'No href or targetId' }]);
    fixture.componentRef.setInput('targetId', undefined);
    fixture.detectChanges();

    const fallbackLink = fixture.nativeElement.querySelector('a.govuk-link');
    expect(fallbackLink).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('No href or targetId');
  });

  it('autoFocus focuses the summary element after view init', () => {
    fixture.componentRef.setInput('items', [{ text: 'Any' }]);
    fixture.componentRef.setInput('autoFocus', true);

    jest.useFakeTimers();
    fixture.detectChanges(); // triggers ngAfterViewInit

    const el = fixture.nativeElement.querySelector(
      '[data-component="error-summary"]',
    ) as HTMLDivElement;
    const focusSpy = jest.spyOn(el, 'focus');

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('autoFocus focuses when items are added after initial render', () => {
    fixture.componentRef.setInput('items', []);
    fixture.componentRef.setInput('autoFocus', true);

    jest.useFakeTimers();
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector(
      '[data-component="error-summary"]',
    ) as HTMLDivElement;
    const focusSpy = jest.spyOn(el, 'focus');

    fixture.componentRef.setInput('items', [{ text: 'Late error' }]);
    fixture.detectChanges();

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('focuses again when focusKey changes even if items stay the same', () => {
    const items = [{ text: 'Repeated error', id: 'field-id' }];
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('autoFocus', true);
    fixture.componentRef.setInput('focusKey', 1);

    jest.useFakeTimers();
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector(
      '[data-component="error-summary"]',
    ) as HTMLDivElement;
    const focusSpy = jest.spyOn(el, 'focus');

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);

    fixture.componentRef.setInput('focusKey', 2);
    fixture.detectChanges();

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(2);
  });

  it('emits itemSelect when a link is clicked', () => {
    const item: ErrorItem = { text: 'Click me', id: 'field-id' };
    fixture.componentRef.setInput('items', [item]);
    fixture.detectChanges();

    const handler = jest.fn();
    const sub = comp.itemSelect.subscribe(handler);

    const a = fixture.nativeElement.querySelector(
      'a.govuk-link',
    ) as HTMLAnchorElement;
    a.click();

    expect(handler).toHaveBeenCalledWith(item);
    sub.unsubscribe();
  });
});
