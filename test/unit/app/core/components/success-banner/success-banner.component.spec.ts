import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, provideRouter } from '@angular/router';

import { SuccessBannerComponent } from '@components/success-banner/success-banner.component';

describe('SuccessBannerComponent (external template)', () => {
  let fixture: ComponentFixture<SuccessBannerComponent>;
  let comp: SuccessBannerComponent;

  const setInput = (name: string, value: unknown, detectChanges = true) => {
    fixture.componentRef.setInput(name, value);
    if (detectChanges) {
      fixture.detectChanges();
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        // Standalone component pulls in its own template via templateUrl
        SuccessBannerComponent,
      ],
      // RouterTestingModule is deprecated — use functional providers
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SuccessBannerComponent);
    comp = fixture.componentInstance;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders default heading when none provided', () => {
    // defaults: heading = 'Done'
    fixture.detectChanges();

    const title = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__title',
    )!;
    const heading = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__heading',
    )!;

    expect(title.textContent.trim()).toBe('Success');
    expect(heading.textContent.trim()).toBe('Done');
  });

  it('renders heading, body, and a router link when linkCommands provided', () => {
    setInput('heading', 'Applications list successfully created', false);
    setInput('body', 'You can return to the list.', false);
    setInput('linkText', 'Click here to go back', false);
    setInput('linkCommands', ['/applications-list'], false); // absolute for deterministic URL
    setInput('linkHref', undefined, false); // ensure routerLink path is used
    fixture.detectChanges();

    const router = TestBed.inject(Router);
    const heading = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__heading',
    )!;
    const bodyP = fixture.nativeElement.querySelector('.govuk-body')!;
    const linkDe = fixture.debugElement.query(
      By.css('.govuk-notification-banner__link'),
    );
    const linkDir = linkDe.injector.get(RouterLink);
    const linkEl: HTMLAnchorElement = linkDe.nativeElement;

    expect(heading.textContent.trim()).toBe(
      'Applications list successfully created',
    );
    expect(bodyP.textContent).toContain('You can return to the list.');
    expect(linkEl.textContent.trim()).toBe('Click here to go back');

    // Assert target using public RouterLink API (urlTree) + Router.serializeUrl
    expect(linkDir.urlTree).toBeTruthy();
    const url = router.serializeUrl(linkDir.urlTree!);
    expect(url).toBe('/applications-list');

    // Optional: also assert the rendered href (jsdom makes it absolute)
    expect(linkEl.href.endsWith('/applications-list')).toBe(true);
    expect(
      bodyP.querySelectorAll('.govuk-notification-banner__link'),
    ).toHaveLength(1);
    expect(bodyP.querySelectorAll('span')).toHaveLength(0);
  });

  it('renders an href link when linkHref provided', () => {
    setInput('heading', 'Done', false);
    setInput('body', 'Read the docs.', false);
    setInput('linkText', 'Open docs', false);
    setInput('linkHref', '/docs', false);
    setInput('linkCommands', undefined, false); // ensure href path is used
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__link',
    ) as HTMLAnchorElement;

    expect(link.textContent.trim()).toBe('Open docs');
    expect(link.getAttribute('href')).toBe('/docs');
    expect(
      fixture.nativeElement.querySelectorAll(
        '.govuk-notification-banner__link',
      ),
    ).toHaveLength(1);
    expect(
      fixture.nativeElement.querySelectorAll('.govuk-body span'),
    ).toHaveLength(0);
  });

  it('prefers linkHref when both linkHref and linkCommands are provided', () => {
    setInput('linkText', 'Open docs', false);
    setInput('linkHref', '/docs', false);
    setInput('linkCommands', ['/applications-list'], false);
    fixture.detectChanges();

    const links = fixture.nativeElement.querySelectorAll(
      '.govuk-notification-banner__link',
    );
    const link = links[0] as HTMLAnchorElement;

    expect(links).toHaveLength(1);
    expect(link.getAttribute('href')).toBe('/docs');
    expect(fixture.nativeElement.querySelector('.govuk-body span')).toBeNull();
  });

  it('emits linkClick when the banner link is clicked', () => {
    setInput('heading', 'Done', false);
    setInput('linkText', 'Open docs', false);
    setInput('linkCommands', ['/applications-list'], false);
    fixture.detectChanges();

    const emitSpy = jest.spyOn(comp.linkClick, 'emit');
    const link = fixture.debugElement.query(
      By.css('.govuk-notification-banner__link'),
    );
    const clickEvent = new MouseEvent('click', { button: 0 });

    link.nativeElement.dispatchEvent(clickEvent);

    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('renders a clickable anchor and emits linkClick without navigation inputs', () => {
    setInput('heading', 'Done', false);
    setInput('linkText', 'Run action', false);
    setInput('linkHref', undefined, false);
    setInput('linkCommands', undefined, false);
    setInput('allowOnClick', true, true);

    const emitSpy = jest.spyOn(comp.linkClick, 'emit');
    const link = fixture.nativeElement.querySelector(
      '.govuk-link',
    ) as HTMLAnchorElement;
    const clickEvent = new MouseEvent('click', {
      button: 0,
      cancelable: true,
    });

    link.dispatchEvent(clickEvent);

    expect(link.textContent?.trim()).toBe('Run action');
    expect(clickEvent.defaultPrevented).toBe(true);
    expect(emitSpy).toHaveBeenCalledTimes(1);
  });

  it('autoFocus focuses the banner element after view init', () => {
    // Enable fake timers BEFORE detectChanges (ngAfterViewInit schedules setTimeout)
    jest.useFakeTimers();
    setInput('heading', 'Any', false);
    setInput('autoFocus', true, false);
    fixture.detectChanges();

    // Access the private ViewChild via a typed cast
    const el = (
      comp as unknown as {
        bannerEl: { nativeElement: HTMLDivElement };
      }
    ).bannerEl.nativeElement;
    const focusSpy = jest.spyOn(el, 'focus');

    jest.runAllTimers();
    expect(focusSpy).toHaveBeenCalledTimes(1);
  });

  it('does not focus when autoFocus is false', () => {
    jest.useFakeTimers();
    setInput('heading', 'Any', false);
    setInput('autoFocus', false, false);
    fixture.detectChanges();

    const el = (
      comp as unknown as {
        bannerEl: { nativeElement: HTMLDivElement };
      }
    ).bannerEl.nativeElement;
    const focusSpy = jest.spyOn(el, 'focus');

    jest.runOnlyPendingTimers();
    expect(focusSpy).not.toHaveBeenCalled();
  });
});
