import { isPlatformBrowser } from '@angular/common';

export type SuccessBanner = {
  heading: string;
  body: string;
  link?: { href: string; text: string };
};

export function computeSuccessBanner(
  wording: string,
  wordingRefRegex: RegExp,
): SuccessBanner {
  const needsWording = wordingRefRegex.test(wording);
  return needsWording
    ? {
        heading: 'Application code added',
        body: 'This code requires additional wording. Please complete the "Wording" section.',
        link: { href: '#wording-section', text: 'Go to wording section' },
      }
    : {
        heading: 'Application code added',
        body: 'The application list entry was updated successfully.',
      };
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
