import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  DOCUMENT,
  PLATFORM_ID,
  computed,
  inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

import { HeaderService } from '@services/header.service';
import { SessionService } from '@services/session.service';

@Component({
  selector: 'app-service-navigation',
  templateUrl: './service-navigation.component.html',
  standalone: true,
  imports: [RouterLinkActive, RouterLink],
  styleUrl: './service-navigation.component.scss',
})
export class ServiceNavigationComponent {
  readonly session = inject(SessionService);
  private readonly header = inject(HeaderService);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly document = inject(DOCUMENT);

  readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isLoginPage = computed(() => this.url().startsWith('/login'));

  readonly showMenu = computed(
    () =>
      this.session.isAuthenticated() &&
      !this.isLoginPage() &&
      this.header.isVisible(),
  );

  // Read hidden token to send to server for logout
  readonly xsrfToken = computed(() => {
    if (!isPlatformBrowser(this.platformId)) {
      return '';
    }

    return this.readCookie('XSRF-TOKEN') ?? '';
  });

  private readCookie(name: string): string | null {
    const cookie = this.document.cookie
      .split('; ')
      .find((row) => row.startsWith(`${name}=`));

    return cookie ? decodeURIComponent(cookie.split('=')[1] ?? '') : null;
  }
}
