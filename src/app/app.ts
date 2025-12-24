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
type SortableCtor = new (el: HTMLElement) => { init?: () => void };

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
    const mod: unknown = await import('@ministryofjustice/frontend');
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

  private readonly sortableSelector = '[data-module="moj-sortable-table"]';

  private collectSortable(node: Node): HTMLElement[] {
    if (!(node instanceof HTMLElement)) {
      return [];
    }
    const direct = node.matches?.(this.sortableSelector) ? [node] : [];
    const found = node.querySelectorAll?.(this.sortableSelector) ?? [];
    return [...direct, ...(Array.from(found) as HTMLElement[])];
  }

  /** Enhance all MoJ Sortable tables in the given scope and observe for new ones */
  private sortableCtor?: SortableCtor;

  /** Enhance all MoJ Sortable tables in the given scope and observe for new ones */
  private initAllSortableTables(scope?: ParentNode): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }
    void this.setupSortable(scope);
  }

  private async setupSortable(scope?: ParentNode): Promise<void> {
    const SortableTable = await loadSortableCtor();
    if (!SortableTable) {
      return;
    }

    this.sortableCtor = SortableTable;
    const root: ParentNode = scope ?? document;

    this.enhanceExisting(root);
    this.ensureObserver(root);
  }

  private enhanceExisting(root: ParentNode): void {
    const tables = root.querySelectorAll<HTMLElement>(
      '[data-module="moj-sortable-table"]',
    );
    for (const el of tables) {
      this.enhance(el);
    }
  }

  private enhance(el: HTMLElement): void {
    if (sortableInitialised.has(el) || !this.sortableCtor) {
      return;
    }
    const inst = new this.sortableCtor(el);
    inst.init?.();
    sortableInitialised.add(el);
  }

  private ensureObserver(root: ParentNode): void {
    if (this.mojObserver) {
      return;
    }

    this.mojObserver = new MutationObserver(this.handleMutations.bind(this));
    this.mojObserver.observe(root, { childList: true, subtree: true });
  }

  private handleMutations(records: MutationRecord[]): void {
    for (const r of records) {
      this.processAddedNodes(r.addedNodes);
    }
  }

  private processAddedNodes(nodes: NodeList): void {
    for (const n of nodes) {
      for (const el of this.collectSortable(n)) {
        this.enhance(el);
      }
    }
  }
}
