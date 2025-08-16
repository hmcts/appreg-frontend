import { PLATFORM_ID , inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const sessionGuard: CanActivateFn = async () => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Avoid calling /sso/me during SSR
  if (!isPlatformBrowser(platformId)) {
    return true; // let SSR render; client will enforce after hydration
  }

  try {
    const res = await fetch('/sso/me', { credentials: 'include' });
    if (res.ok) {return true;}
  } catch {
    // ignore and fall through
  }
  await router.navigateByUrl('/login');
  return false;
};
