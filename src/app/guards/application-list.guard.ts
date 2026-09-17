import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID, inject } from '@angular/core';
import { CanActivateFn, RedirectCommand, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { ApplicationListsApi } from '@openapi';
import { getHttpStatus } from '@util/http-error-to-text';

export const applicationListGuard: CanActivateFn = (route) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);
  const api = inject(ApplicationListsApi);

  // Authenticated API calls run in the browser, matching the list pages.
  if (!isPlatformBrowser(platformId)) {
    return true;
  }

  const redirect = new RedirectCommand(
    router.createUrlTree(['/applications-list']),
    { replaceUrl: true },
  );
  const listId = route.paramMap.get('id') ?? '';
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      listId,
    )
  ) {
    return redirect;
  }

  return api
    .getApplicationList({ listId }, 'body', false, { transferCache: false })
    .pipe(
      map(() => true),
      // Only a missing list warrants a redirect. Preserve other error handling.
      catchError((err: unknown) =>
        of(getHttpStatus(err) === 404 ? redirect : true),
      ),
    );
};
