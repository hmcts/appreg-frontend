import { ComponentFixture, TestBed } from '@angular/core/testing';

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
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorSummaryComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  it('renders items and computes hrefs (explicit href, target hash, fallback "#")', () => {
    comp.items = [
      { text: 'With explicit href', href: '/somewhere' },
      { text: 'With targetId (hash)' },
      { text: 'No href or targetId' },
    ];
    comp.targetId = 'sortable-table'; // affects item[1]
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      'a.govuk-link',
    ) as NodeListOf<HTMLAnchorElement>;

    expect(links).toHaveLength(3);
    expect(links[0].getAttribute('href')).toBe('/somewhere');
    expect(links[1].getAttribute('href')).toBe('#sortable-table');

    // Pure fallback: when neither err.href nor targetId are set
    comp.targetId = undefined;
    expect(comp.linkHrefFor({ text: 'x' })).toBe('#');
  });

  it('autoFocus focuses the summary element after view init', () => {
    comp.items = [{ text: 'Any' }];
    comp.autoFocus = true;

    jest.useFakeTimers();
    fixture.detectChanges(); // triggers ngAfterViewInit

    // Access the private ViewChild through a typed shape
    const el = (
      comp as unknown as {
        summaryEl: { nativeElement: HTMLDivElement };
      }
    ).summaryEl.nativeElement;
    const focusSpy = jest.spyOn(el, 'focus');

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('onLinkClick with targetId: prevents default, scrolls and focuses target', () => {
    // use fake timers BEFORE scheduling any setTimeout
    jest.useFakeTimers();

    document.body.innerHTML = '<div id="the-target" tabindex="-1"></div>';
    const target = document.getElementById('the-target') as HTMLElement;

    // spy on prototype for jsdom; requires the polyfill you added in setup-jest
    const scrollSpy = jest.spyOn(Element.prototype, 'scrollIntoView');
    const focusSpy = jest.spyOn(target, 'focus');

    comp.items = [{ text: 'Go to target' }];
    comp.targetId = 'the-target';
    fixture.detectChanges();

    const preventDefault = jest.fn();
    comp.onLinkClick({ preventDefault } as unknown as Event, comp.items[0]);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(scrollSpy).toHaveBeenCalled();

    // run the scheduled focus timeout
    jest.runOnlyPendingTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('onLinkClick with itemSelect observers (no targetId): preventDefault + emit; no scroll', () => {
    comp.items = [{ text: 'Emit only' }];
    comp.targetId = undefined;
    fixture.detectChanges();

    const handler = jest.fn();
    const sub = comp.itemSelect.subscribe(handler);

    const preventDefault = jest.fn();
    const getByIdSpy = jest.spyOn(document, 'getElementById');

    comp.onLinkClick({ preventDefault } as unknown as Event, comp.items[0]);

    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith({ text: 'Emit only' });
    expect(getByIdSpy).not.toHaveBeenCalled();

    sub.unsubscribe();
  });

  it('onLinkClick with no observers and no targetId: allow default (no preventDefault)', () => {
    comp.items = [{ text: 'No-op click' }];
    comp.targetId = undefined;
    fixture.detectChanges();

    const preventDefault = jest.fn();
    const sub = comp.itemSelect.subscribe(() => {});
    sub.unsubscribe(); // zero observers

    comp.onLinkClick({ preventDefault } as unknown as Event, comp.items[0]);

    expect(preventDefault).not.toHaveBeenCalled();
  });

  it('template click calls onLinkClick with the clicked item', () => {
    const item: ErrorItem = { text: 'Click me', href: '#x' };
    comp.items = [item];
    fixture.detectChanges();

    const clickSpy = jest.spyOn(comp, 'onLinkClick');
    const a = fixture.nativeElement.querySelector(
      'a.govuk-link',
    ) as HTMLAnchorElement;

    a.click();

    expect(clickSpy).toHaveBeenCalledTimes(1);
    const [, passedItem] = clickSpy.mock.calls[0];
    expect(passedItem).toEqual(item);
  });
});
