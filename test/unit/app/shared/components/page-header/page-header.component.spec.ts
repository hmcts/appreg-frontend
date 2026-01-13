import { NgClass } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';

import { PageHeaderComponent } from '@components/page-header/page-header.component';

type ActionLike = Readonly<{
  id?: string;
  label: string;
  routerLink?: unknown;
  queryParams?: unknown;
  href?: string;
  startIcon?: boolean;
  disabled?: boolean;
  onClick?: (e: Event) => void;
}>;

function q<K extends Element = Element>(
  fixture: ComponentFixture<unknown>,
  sel: string,
): K | null {
  return fixture.debugElement.nativeElement.querySelector(sel) as K | null;
}
function qa<K extends Element = Element>(
  fixture: ComponentFixture<unknown>,
  sel: string,
): NodeListOf<K> {
  return fixture.debugElement.nativeElement.querySelectorAll(
    sel,
  ) as NodeListOf<K>;
}
function byId<K extends Element = Element>(
  fixture: ComponentFixture<unknown>,
  id: string,
): K | null {
  return q<K>(fixture, `#${id}`);
}
function clickCancelable(el: Element): boolean {
  const ev = new Event('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(ev);
  return ev.defaultPrevented;
}

describe('PageHeaderComponent', () => {
  let fixture: ComponentFixture<PageHeaderComponent>;
  let component: PageHeaderComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PageHeaderComponent, RouterLink],
      providers: [provideRouter([])],
    })
      .overrideComponent(PageHeaderComponent, { add: { imports: [NgClass] } })
      .compileComponents();

    fixture = TestBed.createComponent(PageHeaderComponent);
    component = fixture.componentInstance;
  });

  it('renders title with headingClass', () => {
    fixture.componentRef.setInput('title', 'Applications');

    const token = 'x-test-heading-class';
    const getSpy = jest
      .spyOn(
        PageHeaderComponent.prototype as unknown as Record<string, unknown>,
        'headingClass',
        'get',
      )
      .mockReturnValue({ [token]: true });

    fixture.detectChanges();

    const h1 = q<HTMLHeadingElement>(
      fixture,
      '.moj-page-header-actions__title h1',
    );
    expect(h1?.textContent?.trim()).toBe('Applications');
    expect(h1?.classList.contains(token)).toBe(true);

    getSpy.mockRestore();
  });

  it('renders routerLink anchor, href anchor, and button variants', () => {
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'rl', label: 'Go to lists', routerLink: ['/lists'] },
      { id: 'ah', label: 'Help', href: '/help' },
      { id: 'btn', label: 'Create', onClick: () => void 0 },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    const allButtons = qa<HTMLElement>(fixture, '.govuk-button');
    expect(allButtons).toHaveLength(3);

    const rl = byId<HTMLAnchorElement>(fixture, 'rl');
    const ah = byId<HTMLAnchorElement>(fixture, 'ah');
    const btn = byId<HTMLButtonElement>(fixture, 'btn');

    expect(rl?.tagName).toBe('A');
    expect(ah?.tagName).toBe('A');
    expect(ah?.getAttribute('href')).toBe('/help');
    expect(btn?.tagName).toBe('BUTTON');
    expect(btn?.getAttribute('type')).toBe('button');
  });

  it('renders start icon when startIcon=true', () => {
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'with-icon', label: 'Start now', startIcon: true, href: '/start' },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    const anchor = byId<HTMLAnchorElement>(fixture, 'with-icon');
    expect(anchor).not.toBeNull();

    const svg = q<SVGElement>(fixture, '#with-icon .govuk-button__start-icon');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });

  it('disables anchors using aria-disabled and .govuk-button--disabled and prevents click', () => {
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'rl-dis', label: 'Go', routerLink: ['/x'], disabled: true },
      { id: 'ah-dis', label: 'Help', href: '/help', disabled: true },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    const rl = byId<HTMLAnchorElement>(fixture, 'rl-dis')!;
    const ah = byId<HTMLAnchorElement>(fixture, 'ah-dis')!;

    expect(rl.getAttribute('aria-disabled')).toBe('true');
    expect(rl.classList.contains('govuk-button--disabled')).toBe(true);
    expect(clickCancelable(rl)).toBe(true);

    expect(ah.getAttribute('aria-disabled')).toBe('true');
    expect(ah.classList.contains('govuk-button--disabled')).toBe(true);
    expect(clickCancelable(ah)).toBe(true);
  });

  it('disables button via disabled attribute and does not invoke onClick', () => {
    const onClick = jest.fn<void, [Event]>();
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'btn-dis', label: 'Create', onClick, disabled: true },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    const btn = byId<HTMLButtonElement>(fixture, 'btn-dis')!;
    expect(btn.disabled).toBe(true);

    btn.click();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('invokes onClick for enabled button', () => {
    const onClick = jest.fn<void, [Event]>();
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'btn-ok', label: 'Create', onClick },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);
    fixture.detectChanges();

    const btn = byId<HTMLButtonElement>(fixture, 'btn-ok')!;
    btn.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies secondary and warning styles based on component predicates', () => {
    const actions: ReadonlyArray<ActionLike> = [
      { id: 'sec', label: 'Secondary', href: '/s' },
      { id: 'warn', label: 'Delete', href: '/w' },
      { id: 'plain', label: 'Plain', href: '/p' },
    ];
    fixture.componentRef.setInput('title', 'T');
    fixture.componentRef.setInput('actions', actions);

    const isSecondarySpy = jest
      .spyOn(component, 'isSecondary')
      .mockImplementation((act: unknown) => {
        return (
          typeof act === 'object' &&
          act !== null &&
          'id' in act &&
          (act as { id: unknown }).id === 'sec'
        );
      });
    const isWarningSpy = jest
      .spyOn(component, 'isWarning')
      .mockImplementation((act: unknown) => {
        return (
          typeof act === 'object' &&
          act !== null &&
          'id' in act &&
          (act as { id: unknown }).id === 'warn'
        );
      });

    fixture.detectChanges();

    const sec = byId<HTMLAnchorElement>(fixture, 'sec')!;
    const warn = byId<HTMLAnchorElement>(fixture, 'warn')!;
    const plain = byId<HTMLAnchorElement>(fixture, 'plain')!;

    expect(sec.classList.contains('govuk-button--secondary')).toBe(true);
    expect(warn.classList.contains('govuk-button--warning')).toBe(true);
    expect(plain.classList.contains('govuk-button--secondary')).toBe(false);
    expect(plain.classList.contains('govuk-button--warning')).toBe(false);

    expect(isSecondarySpy).toHaveBeenCalled();
    expect(isWarningSpy).toHaveBeenCalled();
  });
});
