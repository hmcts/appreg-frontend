import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';

import { SessionService } from '../core/services/session.service';

export const sessionGuard: CanActivateFn = async (): Promise<
  boolean | UrlTree
> => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const session = inject(SessionService);

  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const ok = await session.refresh();
  return ok ? true : router.createUrlTree(['/login']);
};
