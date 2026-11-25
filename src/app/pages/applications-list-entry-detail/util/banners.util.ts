import { isPlatformBrowser } from '@angular/common';

export function focusSuccessBanner(platformId: object): void {
  if (!isPlatformBrowser(platformId)) {
    return;
  }
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(
      'app-success-banner [tabindex="-1"]',
    );
    if (el && document.activeElement !== el) {
      el.focus();
    }
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  });
}

// Focus on alert component that's in child accordions
export function focusLocalBanner(
  platformId: object,
  bannerId = 'app-alert',
  canFocus: () => boolean = () => true,
): void {
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  setTimeout(() => {
    if (!canFocus()) {
      return;
    }
    const el = document.querySelector<HTMLElement>(bannerId);
    el?.focus?.({ preventScroll: true });
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  });
}
