import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription, filter } from 'rxjs';

import { FooterComponent } from './shared/components/footer/footer.component';
import { HeaderComponent } from './shared/components/header/header.component';
import { ServiceNavigationComponent } from './shared/components/service-navigation/service-navigation.component';

type GovUkInitAll = (opts?: { scope?: HTMLElement }) => void;
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
export class App implements OnInit, AfterViewInit, OnDestroy {
  protected readonly title = signal('appreg-frontend');

  private navSub?: Subscription;
  private didGlobalInit = false;

  constructor(
    @Inject(PLATFORM_ID) private readonly platformId: object,
    private readonly router: Router,
  ) {}

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

    // Re-init only the dynamic area on each navigation
    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
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

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
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
        initAll({ scope });
        return;
      }
    } catch {
      // fall through to global
    }

    // Fallback: global script
    const g = globalThis as typeof globalThis & GovUkGlobal;
    const fn = g.GOVUKFrontend?.initAll;
    if (typeof fn === 'function') {
      fn({ scope });
    }
  }
}
