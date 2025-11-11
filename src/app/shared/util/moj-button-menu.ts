import { isPlatformBrowser } from '@angular/common';
import {
  AfterViewInit,
  Directive,
  ElementRef,
  Inject,
  Injectable,
  OnDestroy,
  PLATFORM_ID,
} from '@angular/core';

type ButtonMenuInstance = { init?: () => void; destroy?: () => void };
type ButtonMenuCtor = new (el: HTMLElement) => ButtonMenuInstance;

interface MojInitEl extends HTMLElement {
  __mojInit?: boolean;
}

@Injectable({ providedIn: 'root' })
export class MojButtonMenu {
  private cachedCtor?: ButtonMenuCtor;

  constructor(@Inject(PLATFORM_ID) private readonly platformId: object) {}

  private async loadCtor(): Promise<ButtonMenuCtor | undefined> {
    if (!isPlatformBrowser(this.platformId)) {
      return undefined;
    }
    if (this.cachedCtor) {
      return this.cachedCtor;
    }

    try {
      const mod = await import('@ministryofjustice/frontend');
      const root = mod as unknown as Record<string, unknown>;
      const def = (root['default'] ?? {}) as Record<string, unknown>;
      const candidate = root['ButtonMenu'] ?? def['ButtonMenu'];

      if (typeof candidate === 'function') {
        this.cachedCtor = candidate as ButtonMenuCtor;
        return this.cachedCtor;
      }
    } catch {
      /* swallow: still render without JS */
    }
    return undefined;
  }

  /** Initialise all menus under `root` (defaults to document), idempotently. */
  async initAll(root: ParentNode = document): Promise<void> {
    const Ctor = await this.loadCtor();
    if (!Ctor) {
      return;
    }

    const nodes = root.querySelectorAll<HTMLElement>(
      '[data-module="moj-button-menu"]',
    );
    for (const el of nodes) {
      const flagged = el as MojInitEl;
      if (flagged.__mojInit) {
        continue;
      }

      const instance = new Ctor(flagged);
      instance.init?.();
      flagged.__mojInit = true;
    }
  }
}

@Directive({
  selector: '[appMojButtonMenu]',
  standalone: true,
})
export class MojButtonMenuDirective implements AfterViewInit, OnDestroy {
  private mo?: MutationObserver;

  constructor(
    private readonly el: ElementRef<HTMLElement>,
    private readonly menus: MojButtonMenu,
    @Inject(PLATFORM_ID) private readonly platformId: object,
  ) {}

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    // initial scan
    void this.menus.initAll(this.el.nativeElement);

    // observe future inserts (e.g., first page render, pagination, sorts)
    this.mo = new MutationObserver(() => {
      void this.menus.initAll(this.el.nativeElement);
    });
    this.mo.observe(this.el.nativeElement, { childList: true, subtree: true });
  }

  ngOnDestroy(): void {
    this.mo?.disconnect();
  }
}
