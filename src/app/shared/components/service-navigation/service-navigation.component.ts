import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  Inject,
  OnInit,
  PLATFORM_ID,
  computed,
  signal,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter } from 'rxjs/operators';

import { SessionService } from '../../../core/session.service';

@Component({
  selector: 'app-service-navigation',
  templateUrl: './service-navigation.component.html',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
})
export class ServiceNavigationComponent implements OnInit {
  readonly isLoginPage = signal(false);
  readonly showMenu = computed(
    () => this.session.isAuthenticated() && !this.isLoginPage(),
  );

  constructor(
    public session: SessionService, // public so template can read it if needed
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: object,
  ) {}

  ngOnInit(): void {
    // set initial state (important on first paint)
    if (isPlatformBrowser(this.platformId)) {
      this.isLoginPage.set(this.router.url.startsWith('/login'));
    }

    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        this.isLoginPage.set(e.urlAfterRedirects.startsWith('/login'));
      });
  }

  async onSignOutClicked(ev: Event): Promise<void> {
    ev.preventDefault();

    // Ask for confirmation
    const ok = window.confirm('Are you sure you want to sign out?');
    if (!ok) {
      return;
    }

    // (optional) guard against double-clicks
    (ev.currentTarget as HTMLElement)?.setAttribute('aria-busy', 'true');

    try {
      await fetch('/auth/logout', {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
      });
    } catch {
      // ignore network errors; we'll still send the user to /login
    }

    this.session.setAuthenticated(false);
    await this.router.navigateByUrl('/login');
  }
}
