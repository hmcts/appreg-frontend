import { isPlatformBrowser } from '@angular/common';

import { ENTRY_SUCCESS_MESSAGES } from '@constants/application-list-entry/success-messages';
import { SuccessBanner } from '@core-types/banner/banner.types';

export function computeSuccessBanner(
  wording: string,
  wordingRefRegex: RegExp,
): SuccessBanner {
  const needsWording = wordingRefRegex.test(wording);
  return needsWording
    ? ENTRY_SUCCESS_MESSAGES.applicationCodeAdded.needsWording
    : ENTRY_SUCCESS_MESSAGES.applicationCodeAdded.ok;
}

export function focusSuccessBanner(platformId: object): void {
  if (!isPlatformBrowser(platformId)) {
    return;
  }
  setTimeout(() => {
    const el = document.querySelector<HTMLElement>('app-success-banner');
    el?.focus?.();
    el?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  });
}
