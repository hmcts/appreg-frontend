import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  OnInit,
  PLATFORM_ID,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { FooterComponent } from '@components/footer/footer.component';
import { HeaderComponent } from '@components/header/header.component';
import { ServiceNavigationComponent } from '@components/service-navigation/service-navigation.component';

type GovUkInitAll = (opts?: { scope?: Element | Document | null }) => void;
type GovUkGlobal = { GOVUKFrontend?: { initAll?: GovUkInitAll } };

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    FooterComponent,
    HeaderComponent,
    ServiceNavigationComponent,
  ],
  templateUrl: './app.html',
})
export class App implements OnInit, AfterViewInit {
  protected readonly title = signal('appreg-frontend');

  private readonly platformId = inject(PLATFORM_ID);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  private didGlobalInit = false;

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

    // Re-init only the dynamic area on each navigation (after view swaps)
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        requestAnimationFrame(() => {
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
