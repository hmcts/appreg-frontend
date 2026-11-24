import { Location, isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';

import { FooterComponent } from '@components/footer/footer.component';
import { HeaderComponent } from '@components/header/header.component';
import { ServiceNavigationComponent } from '@components/service-navigation/service-navigation.component';

type GovUkInitAll = (opts?: { scope?: Element | Document | null }) => void;
type GovUkGlobal = { GOVUKFrontend?: { initAll?: GovUkInitAll } };

/**
 * App
 *
 * Functionality:
 * - Hosts the application shell.
 * - Initialises GOV.UK frontend interactions after rendering.
 * - Provides the root view for routed pages and shared layout.
 */
@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FooterComponent,
    HeaderComponent,
    ServiceNavigationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.Eager,
  templateUrl: './app.html',
})
export class App implements OnInit, AfterViewInit {
  protected readonly title = signal('appreg-frontend');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isPreview = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      startWith(null),
      map(() => {
        let route = this.router.routerState.snapshot.root;
        while (route.firstChild) {
          route = route.firstChild;
        }
        return route.data['preview'] === true;
      }),
    ),
    { initialValue: false },
  );

  private didGlobalInit = false;

  protected get skipLinkHref(): string {
    // Include the current route because <base href="/"> resolves bare fragments to home.
    return `${this.location.path()}#main-content`;
  }

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    document.body.classList.add('js-enabled');
    if ('noModule' in HTMLScriptElement.prototype) {
      document.body.classList.add('govuk-frontend-supported');
    }
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // One full-page init (header/footer included)
    if (!this.didGlobalInit) {
      void this.initGovUkFrontend();
      this.didGlobalInit = true;
    }

    let previousPath = this.router.navigated
      ? this.router.url.split(/[?#]/)[0]
      : undefined;

    // Re-init only the dynamic area on each navigation (after view swaps)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        const path = event.urlAfterRedirects.split(/[?#]/)[0];
        const resetFocus = previousPath !== undefined && previousPath !== path;
        previousPath = path;
        requestAnimationFrame(() => {
          if (resetFocus) {
            // ARCPOC-1976: emulate a page load; the next Tab reaches the GOV.UK skip link.
            // Query/fragment updates are not new pages and must not steal focus.
            const tabindex = document.body.getAttribute('tabindex');
            document.body.setAttribute('tabindex', '-1');
            document.body.focus();
            if (tabindex === null) {
              document.body.removeAttribute('tabindex');
            } else {
              document.body.setAttribute('tabindex', tabindex);
            }
            window.scrollTo(0, 0);
          }
          const main =
            document.querySelector<HTMLElement>('main.govuk-main-wrapper') ??
            document.querySelector<HTMLElement>('main');
          if (main) {
            void this.initGovUkFrontend(main);
          }
        });
      });
  }

  // ARCPOC-860: temporarily remove data-module on already-initialised elements
  // so initAll skips them, then restore attributes after init completes
  private suppressInitialisedGovUkModules(
    root: Element | Document,
  ): () => void {
    const removed: { el: HTMLElement; moduleName: string }[] = [];
    const nodes = root.querySelectorAll<HTMLElement>('[data-module]');
    for (const el of nodes) {
      const moduleName = el.dataset['module'];
      if (!moduleName) {
        continue;
      }
      if (el.hasAttribute(`data-${moduleName}-init`)) {
        removed.push({ el, moduleName });
        delete el.dataset['module'];
      }
    }

    return () => {
      for (const { el, moduleName } of removed) {
        el.dataset['module'] = moduleName;
      }
    };
  }

  /** Initialise GOV.UK Frontend, optionally scoped to avoid re-init errors */
  private async initGovUkFrontend(scope?: HTMLElement): Promise<void> {
    // Try npm module first
    try {
      const mod: unknown = await import('govuk-frontend');
      const initAll: GovUkInitAll | undefined =
        typeof (mod as { initAll?: unknown }).initAll === 'function'
          ? (mod as { initAll: GovUkInitAll }).initAll
          : undefined;

      if (initAll) {
        const root: Element | Document = scope ?? document;
        const restore = this.suppressInitialisedGovUkModules(root);
        try {
          initAll({ scope: root });
        } finally {
          restore();
        }
        return;
      }
    } catch {
      // fall through to global
    }

    // Fallback: global script
    const g = globalThis as typeof globalThis & GovUkGlobal;
    const fn = g.GOVUKFrontend?.initAll;
    if (typeof fn === 'function') {
      const root: Element | Document = scope ?? document;
      const restore = this.suppressInitialisedGovUkModules(root);
      try {
        fn({ scope: root });
      } finally {
        restore();
      }
    }
  }
}
