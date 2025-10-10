import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { Router, RouterLink, provideRouter } from '@angular/router';

import { SuccessBannerComponent } from '../../../../../../src/app/shared/components/success-banner/success-banner.component';

describe('SuccessBannerComponent (external template)', () => {
  let fixture: ComponentFixture<SuccessBannerComponent>;
  let comp: SuccessBannerComponent;

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
    comp.heading = 'Applications list successfully created';
    comp.body = 'You can return to the list.';
    comp.linkText = 'Click here to go back';
    comp.linkCommands = ['/applications-list']; // absolute for deterministic URL
    comp.linkHref = undefined; // ensure routerLink path is used
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
  });

  it('renders an href link when linkHref provided', () => {
    comp.heading = 'Done';
    comp.body = 'Read the docs.';
    comp.linkText = 'Open docs';
    comp.linkHref = '/docs';
    comp.linkCommands = undefined; // ensure href path is used
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector(
      '.govuk-notification-banner__link',
    ) as HTMLAnchorElement;

    expect(link.textContent.trim()).toBe('Open docs');
    expect(link.getAttribute('href')).toBe('/docs');
  });

  it('autoFocus focuses the banner element after view init', () => {
    comp.heading = 'Any';
    comp.autoFocus = true;

    // Enable fake timers BEFORE detectChanges (ngAfterViewInit schedules setTimeout)
    jest.useFakeTimers();
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
    comp.heading = 'Any';
    comp.autoFocus = false;

    jest.useFakeTimers();
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
