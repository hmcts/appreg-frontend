import { isPlatformBrowser } from '@angular/common';
import { Inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly isAuthenticated = signal(false);

  constructor(@Inject(PLATFORM_ID) private platformId: object) {}

  setAuthenticated(v: boolean): void {
    this.isAuthenticated.set(v);
  }

  /** Probe the session once; only 2xx counts as authed. */
  async refresh(): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) {
      this.isAuthenticated.set(false);
      return false;
    }
    try {
      const res = await fetch('/sso/me', {
        credentials: 'include',
        cache: 'no-store',
        redirect: 'manual',
        headers: { accept: 'application/json' },
      });
      const ok = res.status >= 200 && res.status < 300;
      this.isAuthenticated.set(ok);
      return ok;
    } catch {
      this.isAuthenticated.set(false);
      return false;
    }
  }
}
