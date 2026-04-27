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
const MENU_GAP_PX = 8;
const MENU_VIEWPORT_MARGIN_PX = 8;

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
  private readonly syncOpenMenus = () => {
    this.syncOpenMenuClasses();
  };

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
    window.addEventListener('resize', this.syncOpenMenus);
    window.addEventListener('scroll', this.syncOpenMenus, true);

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
    window.removeEventListener('resize', this.syncOpenMenus);
    window.removeEventListener('scroll', this.syncOpenMenus, true);
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
      if (isOpen) {
        this.applyOverlayPosition(menu, toggle);
      } else {
        this.resetOverlayPosition(menu);
      }
    }
  }

  private applyOverlayPosition(
    menu: HTMLElement,
    toggle: HTMLElement | null,
  ): void {
    const wrapper = menu.querySelector<HTMLElement>(
      '.moj-button-menu__wrapper',
    );
    if (!wrapper || !toggle) {
      return;
    }

    const toggleRect = toggle.getBoundingClientRect();
    const wrapperHeight = wrapper.offsetHeight;
    const wrapperWidth = Math.max(wrapper.offsetWidth, toggleRect.width);
    const viewportWidth =
      window.innerWidth || document.documentElement.clientWidth || 0;
    const viewportHeight =
      window.innerHeight || document.documentElement.clientHeight || 0;
    const spaceBelow = viewportHeight - toggleRect.bottom - MENU_GAP_PX;
    const spaceAbove = toggleRect.top - MENU_GAP_PX;

    let top = toggleRect.bottom + MENU_GAP_PX;
    if (
      wrapperHeight > spaceBelow &&
      wrapperHeight <= spaceAbove - MENU_VIEWPORT_MARGIN_PX
    ) {
      top = Math.max(
        MENU_VIEWPORT_MARGIN_PX,
        toggleRect.top - wrapperHeight - MENU_GAP_PX,
      );
    }

    const alignedRight = wrapper.classList.contains(
      'moj-button-menu__wrapper--right',
    );
    const preferredLeft = alignedRight
      ? toggleRect.right - wrapperWidth
      : toggleRect.left;
    const maxLeft = Math.max(
      MENU_VIEWPORT_MARGIN_PX,
      viewportWidth - wrapperWidth - MENU_VIEWPORT_MARGIN_PX,
    );
    const left = Math.min(
      Math.max(MENU_VIEWPORT_MARGIN_PX, preferredLeft),
      maxLeft,
    );

    wrapper.style.position = 'fixed';
    wrapper.style.top = `${Math.round(top)}px`;
    wrapper.style.bottom = 'auto';
    wrapper.style.left = `${Math.round(left)}px`;
    wrapper.style.right = 'auto';
    wrapper.style.width = `${Math.round(wrapperWidth)}px`;
    wrapper.style.marginTop = '0';
    wrapper.style.marginBottom = '0';
    wrapper.style.zIndex = '2000';
    wrapper.style.maxHeight = `${Math.max(
      120,
      viewportHeight - MENU_VIEWPORT_MARGIN_PX * 2,
    )}px`;
    wrapper.style.overflowY = 'auto';
  }

  private resetOverlayPosition(menu: HTMLElement): void {
    const wrapper = menu.querySelector<HTMLElement>(
      '.moj-button-menu__wrapper',
    );
    if (!wrapper) {
      return;
    }

    wrapper.style.position = '';
    wrapper.style.top = '';
    wrapper.style.bottom = '';
    wrapper.style.left = '';
    wrapper.style.right = '';
    wrapper.style.width = '';
    wrapper.style.marginTop = '';
    wrapper.style.marginBottom = '';
    wrapper.style.zIndex = '';
    wrapper.style.maxHeight = '';
    wrapper.style.overflowY = '';
  }
}
