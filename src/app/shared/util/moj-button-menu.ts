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

const OPEN_MENU_CLASS = 'app-moj-button-menu--open';
const OPEN_UP_MENU_CLASS = 'app-moj-button-menu--open-up';

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
      const mod: unknown = await import('@ministryofjustice/frontend');
      const root = mod as Record<string, unknown>;
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
    this.syncOpenMenuClasses();

    // observe future inserts (e.g., first page render, pagination, sorts)
    this.mo = new MutationObserver(() => {
      void this.menus.initAll(this.el.nativeElement);
      this.syncOpenMenuClasses();
    });
    this.mo.observe(this.el.nativeElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['aria-expanded'],
    });
  }

  ngOnDestroy(): void {
    this.mo?.disconnect();
  }

  private syncOpenMenuClasses(): void {
    const menus = this.el.nativeElement.querySelectorAll<HTMLElement>(
      '[data-module="moj-button-menu"]',
    );

    for (const menu of menus) {
      const toggle = menu.querySelector<HTMLElement>(
        '.moj-button-menu__toggle-button[aria-expanded="true"]',
      );
      const isOpen = !!toggle;
      menu.classList.toggle(OPEN_MENU_CLASS, isOpen);
      const shouldOpenUp = isOpen ? this.shouldOpenUp(menu) : false;
      menu.classList.toggle(OPEN_UP_MENU_CLASS, shouldOpenUp);
    }
  }

  private shouldOpenUp(menu: HTMLElement): boolean {
    const wrapper = menu.querySelector<HTMLElement>('.moj-button-menu__wrapper');
    if (!wrapper) {
      return false;
    }

    const hostRect = this.el.nativeElement.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    const wrapperHeight = wrapper.offsetHeight;
    const gap = 8;

    const spaceBelow = hostRect.bottom - menuRect.bottom;
    const spaceAbove = menuRect.top - hostRect.top;

    return spaceBelow < wrapperHeight + gap && spaceAbove > spaceBelow;
  }
}
