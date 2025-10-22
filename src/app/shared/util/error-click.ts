/* 
Error summary - clickable error hints
*/

import { ErrorItem } from '../components/error-summary/error-summary.component';

function focusByIdOrFirstFocusable(id: string): void {
  const root = document.getElementById(id);
  if (!root) {
    return;
  }

  // smooth scroll to the block
  try {
    root.scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch {
    root.scrollIntoView(true);
  }

  // pick the real focus target (input/select/textarea or any focusable)
  const selector =
    'input,select,textarea,[contenteditable="true"],[tabindex]:not([tabindex="-1"])';
  const target: HTMLElement = root.matches(selector)
    ? root
    : (root.querySelector<HTMLElement>(selector) ?? root);

  // focus after the scroll completes
  setTimeout(() => target.focus?.({ preventScroll: true }), 50);
}

export function onCreateErrorClick(item: ErrorItem): void {
  const id = item.id ?? '';
  if (!id) {
    return;
  }
  focusByIdOrFirstFocusable(id);
}

export function focusField(id: string, ev?: Event): void {
  ev?.preventDefault();
  focusByIdOrFirstFocusable(id);
}