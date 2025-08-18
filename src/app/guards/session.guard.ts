import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

export const sessionGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Don’t block SSR – enforce on the client
  if (!isPlatformBrowser(platformId)) {return true;}

  // Abort after ~1.5s so we don't hang on flaky networks
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 1500);

  try {
    const res = await fetch('/sso/me', {
      credentials: 'include',
      cache: 'no-store',
      redirect: 'manual', // <— DO NOT follow 302/303 to /login
      signal: ctrl.signal,
      headers: { accept: 'application/json' },
    });

    // Only a direct 2xx from /sso/me counts as authenticated
    if (res.status >= 200 && res.status < 300) {return true;}
  } catch {
    // network/abort = treat as not authenticated
  } finally {
    clearTimeout(t);
  }

  return router.createUrlTree(['/login']);
};
