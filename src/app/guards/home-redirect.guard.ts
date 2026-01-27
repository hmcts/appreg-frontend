import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { SessionService } from '@services/session.service';

export const homeRedirectGuard: CanActivateFn = async () => {
  const session = inject(SessionService);
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  if (!isPlatformBrowser(platformId)) {
    return router.parseUrl('/login');
  }

  const authed = await session.refresh();
  return authed
    ? router.parseUrl('/applications-list')
    : router.parseUrl('/login');
};
