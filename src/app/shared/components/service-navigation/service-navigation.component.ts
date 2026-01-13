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

import { SessionService } from '@services/session.service';

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
    private readonly router: Router,
    @Inject(PLATFORM_ID) private readonly platformId: object,
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

  onSignOutClicked(ev: Event): void {
    ev.preventDefault();
    if (!globalThis.confirm('Are you sure you want to sign out?')) {
      return;
    }
    globalThis.location.assign('/sso/logout');
  }
}
