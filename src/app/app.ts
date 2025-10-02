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

/* ---------- MoJ Sortable Table helpers ---------- */
type MojCtor = new (
  el: HTMLElement,
  cfg?: Record<string, unknown>,
) => { init?: () => void };

const sortableInitialised = new WeakSet<HTMLElement>();

function pickSortableCtor(mod: unknown): MojCtor | null {
  const m = mod as {
    SortableTable?: unknown;
    default?: { SortableTable?: unknown };
  };
  const candidate =
    m && typeof m.SortableTable === 'function'
      ? m.SortableTable
      : m?.default?.SortableTable;

  return typeof candidate === 'function' ? (candidate as MojCtor) : null;
}

async function loadSortableCtor(): Promise<MojCtor | null> {
  try {
    const mod = await import('@ministryofjustice/frontend');
    const ctor = pickSortableCtor(mod);
    if (ctor) {
      return ctor;
    }
  } catch {
    // ignore;
  }
  return null;
}

/* --------------------------------------------------------------------------- */

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

  // Observer to catch sortable tables that are inserted later
  private mojObserver?: MutationObserver;

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
      // Initialise any sortable tables currently in the DOM
      this.initAllSortableTables();
      this.didGlobalInit = true;
    }

    // Re-init only the dynamic area on each navigation (after view swaps)
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
          // Enhance sortable tables that belong to the new route content
          this.initAllSortableTables(document);
        });
      });
  }

  ngOnDestroy(): void {
    this.navSub?.unsubscribe();
    this.mojObserver?.disconnect();
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

  /** Enhance all MoJ Sortable tables in the given scope and observe for new ones */
  private initAllSortableTables(scope?: ParentNode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    void loadSortableCtor().then((SortableTable) => {
      if (!SortableTable) {
        return;
      }

      const root = scope ?? document;

      const enhance = (el: HTMLElement): void => {
        if (sortableInitialised.has(el)) {
          return;
        }
        const inst = new SortableTable(el);
        inst.init?.();
        sortableInitialised.add(el);
      };

      // Enhance what exists now
      const tables = root.querySelectorAll<HTMLElement>(
        '[data-module="moj-sortable-table"]',
      );
      for (const el of tables) {
        enhance(el);
      }

      // Observe for late additions (set up once)
      if (this.mojObserver) {
        return;
      }
      this.mojObserver = new MutationObserver((records) => {
        for (const r of records) {
          for (const n of Array.from(r.addedNodes)) {
            if (!(n instanceof HTMLElement)) {
              continue;
            }
            if (n.matches?.('[data-module="moj-sortable-table"]')) {
              enhance(n);
            }
            const nodeList = n.querySelectorAll?.(
              '[data-module="moj-sortable-table"]',
            ) as NodeListOf<HTMLElement> | undefined;

            if (nodeList) {
              for (const el of nodeList) {
                enhance(el);
              }
            }
          }
        }
      });
      this.mojObserver.observe(root, { childList: true, subtree: true });
    });
  }
}
