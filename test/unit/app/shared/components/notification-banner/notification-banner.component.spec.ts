import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { NotificationBannerComponent } from '../../../../../../src/app/shared/components/notification-banner/notification-banner.component';

describe('NotificationBannerComponent (external template)', () => {
  let fixture: ComponentFixture<NotificationBannerComponent>;
  let comp: NotificationBannerComponent;

  beforeEach(async () => {
    // Reset the internal static ID counter so tests can assert IDs deterministically
    (NotificationBannerComponent as unknown as { nextId: number }).nextId = 0;

    await TestBed.configureTestingModule({
      imports: [NotificationBannerComponent], // standalone component
      providers: [provideRouter([])], // enables [routerLink] in the template
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationBannerComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
    document.body.innerHTML = '';
  });

  function bannerEl(): HTMLDivElement {
    return fixture.nativeElement.querySelector(
      '.govuk-notification-banner',
    ) as HTMLDivElement;
  }

  function titleEl(): HTMLHeadingElement {
    return fixture.nativeElement.querySelector(
      '.govuk-notification-banner__title',
    ) as HTMLHeadingElement;
  }

  it('renders defaults: role="region", title "Important", and aria-labelledby pointing to the title id', () => {
    fixture.detectChanges();

    const banner = bannerEl();
    const title = titleEl();

    // Defaults from component inputs
    expect(comp.variant).toBe('default');
    expect(comp.title).toBe('Important');

    // Role should be region for default variant
    expect(banner.getAttribute('role')).toBe('region');

    // Title text and ARIA wiring
    expect(title.textContent?.trim()).toBe('Important');
    const labelledBy = banner.getAttribute('aria-labelledby');
    expect(labelledBy).toBe(comp.titleId);
    expect(title.id).toBe(comp.titleId);
  });

  it('applies success variant: role="alert" and success modifier class', () => {
    comp.variant = 'success';
    fixture.detectChanges();

    const banner = bannerEl();
    expect(banner.getAttribute('role')).toBe('alert');
    expect(
      banner.classList.contains('govuk-notification-banner--success'),
    ).toBe(true);
  });

  it('renders heading and body text when provided', () => {
    comp.heading = 'No lists found';
    comp.body = 'Try different filters, or';
    fixture.detectChanges();

    const heading = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__heading',
    ) as HTMLHeadingElement;

    expect(heading.textContent?.trim()).toBe('No lists found');
    // Body is rendered inside a <p class="govuk-body"> in your template
    const paragraph = fixture.nativeElement.querySelector(
      'p.govuk-body',
    ) as HTMLParagraphElement;
    expect(paragraph.textContent).toContain('Try different filters, or');
  });

  it('renders a link using linkHref when provided', () => {
    comp.linkText = 'create a new list';
    comp.linkHref = '/applications-list/create';
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__link',
    ) as HTMLAnchorElement;

    expect(anchor).toBeTruthy();
    expect(anchor.textContent?.trim()).toBe('create a new list');
    expect(anchor.getAttribute('href')).toBe('/applications-list/create');
  });

  it('renders a routerLink when linkCommands is provided (no linkHref)', () => {
    comp.linkText = 'create a new list';
    comp.linkHref = undefined;
    comp.linkCommands = ['/applications-list/create'];
    fixture.detectChanges();

    const anchor = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__link',
    ) as HTMLAnchorElement;

    expect(anchor).toBeTruthy();
    expect(anchor.textContent?.trim()).toBe('create a new list');

    // With provideRouter([]), RouterLink will bind an href; asserting presence is enough
    expect(anchor.getAttribute('href')).toBeTruthy();
  });

  it('autoFocus focuses the banner element after view init and adds tabindex="-1"', () => {
    comp.autoFocus = true;

    jest.useFakeTimers();
    fixture.detectChanges(); // triggers ngAfterViewInit

    // Access the private ViewChild to spy on focus
    const el = (
      comp as unknown as { bannerEl: { nativeElement: HTMLDivElement } }
    ).bannerEl.nativeElement;
    const focusSpy = jest.spyOn(el, 'focus');

    // tabindex should be -1 to allow programmatic focus
    const banner = bannerEl();
    expect(banner.getAttribute('tabindex')).toBe('-1');

    // run scheduled focus
    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('does not set tabindex when autoFocus is false', () => {
    comp.autoFocus = false;
    fixture.detectChanges();
    const banner = bannerEl();
    expect(banner.hasAttribute('tabindex')).toBe(false);
  });

  it('generates a stable, unique titleId per instance (counter resets in tests)', () => {
    fixture.detectChanges();
    const firstId = comp.titleId;

    // Create a second instance to verify incrementing behaviour
    const fixture2 = TestBed.createComponent(NotificationBannerComponent);
    const comp2 = fixture2.componentInstance;
    fixture2.detectChanges();

    expect(comp2.titleId).not.toBe(firstId);
  });
});
