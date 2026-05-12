/* 
Error summary - clickable error hints
*/

import { isPlatformBrowser } from '@angular/common';

import { ErrorItem } from '@components/error-summary/error-summary.component';

function normaliseDomId(idOrHref: string): string {
  const raw = (idOrHref ?? '').trim();
  if (!raw || raw === '#') {
    return '';
  }
  return raw.startsWith('#') ? raw.slice(1) : raw;
}

function resolveTargetElement(id: string): HTMLElement | null {
  const exactMatch = document.getElementById(id);
  if (exactMatch) {
    return exactMatch;
  }

  // Error summary ids can be namespaced for uniqueness, while rendered inputs
  // often keep the leaf control id.
  const leafId = id.split('.').pop();
  return leafId ? document.getElementById(leafId) : null;
}

function focusByIdOrFirstFocusable(idOrHref: string): void {
  const id = normaliseDomId(idOrHref);
  if (!id) {
    return;
  }

  const root = resolveTargetElement(id);
  if (!root) {
    return;
  }

  try {
    root.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    root.scrollIntoView(true);
  }

  const selector = 'input,select,textarea,[contenteditable="true"],[tabindex]';

  const target: HTMLElement = root.matches(selector)
    ? root
    : (root.querySelector<HTMLElement>(selector) ?? root);

  setTimeout(() => target.focus?.({ preventScroll: true }), 50);
}

export function onCreateErrorClick(item: ErrorItem): void {
  const target = (item.href ?? item.id ?? '').trim();
  if (!target || target === '#') {
    return;
  }

  focusByIdOrFirstFocusable(target);
}

export function focusField(id: string, ev?: Event): void {
  ev?.preventDefault();
  focusByIdOrFirstFocusable(id);
}

export function focusErrorSummary(platformId: object): void {
  if (!isPlatformBrowser(platformId)) {
    return;
  }

  setTimeout(() => {
    const el = document.querySelector<HTMLElement>(
      '[data-component="error-summary"]',
    );

    el?.focus?.();
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, 0);
}
